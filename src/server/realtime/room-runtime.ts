/**
 * Live state of one open room. The database stays the source of truth for
 * membership, host, phase and configuration; this object mirrors it, runs the
 * race and pushes updates to every connected browser. Operations run one at a
 * time through `enqueue` so database writes never interleave.
 */

import { randomInt } from "node:crypto";
import { avatarUrlFor } from "@/lib/avatar-url";
import { botName } from "@/lib/game/bot-names";
import { parseStoredConfig, type RoomConfig } from "@/lib/game/config";
import { hashString } from "@/lib/game/random";
import type { KeyInput } from "@/lib/game/typing";
import {
  canStartRace,
  COUNTDOWN_MS,
  transition,
  type RoomEvent,
  type RoomPhase,
} from "@/lib/game/state-machine";
import type { Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import {
  RECONNECT_GRACE_MS,
  TRACK_BROADCAST_MS,
  type ActionError,
  type InviteView,
  type MemberView,
  type ParsedClientMessage,
  type RaceResultsData,
  type RacerView,
  type RoomSnapshot,
  type ServerMessage,
} from "@/lib/realtime/protocol";
import { checkInvite, countParticipants, generateInviteToken, pickNextHost } from "@/lib/rooms";
import { buildRaceText } from "@/server/race-text";
import { saveRaceResults } from "./persistence";
import { RaceSession } from "./race-session";

const TICK_MS = 100;

export interface Connection {
  id: string;
  identity: Identity | null;
  ip: string;
  send(message: ServerMessage): void;
}

interface MemberState {
  id: string;
  userId: string | null;
  guestId: string | null;
  nickname: string;
  role: "PARTICIPANT" | "SPECTATOR";
  joinedAt: Date;
  avatarUrl: string | null;
}

interface RaceState {
  raceId: string;
  session: RaceSession;
  racers: RacerView[];
  errorMode: RoomConfig["errorMode"];
  language: RoomConfig["language"];
  startedAt: Date;
  results: RaceResultsData | null;
}

export type JoinOutcome =
  | { ok: true }
  | {
      ok: false;
      error:
        "closed" | "inProgress" | "full" | "private" | "banned" | "inviteInvalid" | "inviteUsed";
    };

type JoinMessage = Extract<ParsedClientMessage, { type: "join" }>;
type RoomMessage = Exclude<
  ParsedClientMessage,
  { type: "auth" | "ping" | "join" | "subscribeExplorer" }
>;

export interface RuntimeHooks {
  /** Called whenever public room data changed (explorer, JOIN-02). */
  onPublicChange(): void;
  /** Called once the room is closed and the runtime can be dropped. */
  onClosed(code: string): void;
}

function matchesIdentity(member: MemberState, identity: Identity): boolean {
  return identity.kind === "user" ? member.userId === identity.id : member.guestId === identity.id;
}

export class RoomRuntime {
  readonly code: string;
  private readonly roomId: string;
  private phase: RoomPhase;
  private config: RoomConfig;
  private hostUserId: string;
  private members = new Map<string, MemberState>();
  private connections = new Map<string, Set<Connection>>();
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private race: RaceState | null = null;
  private loop: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTrackAt = 0;
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(
    room: { id: string; code: string; status: RoomPhase; config: unknown; hostId: string },
    private readonly hooks: RuntimeHooks
  ) {
    this.roomId = room.id;
    this.code = room.code;
    this.phase = room.status;
    this.config = parseStoredConfig(room.config);
    this.hostUserId = room.hostId;
  }

  /** Loads an open room. Races cut short by a server restart go back to waiting. */
  static async load(code: string, hooks: RuntimeHooks): Promise<RoomRuntime | null> {
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        members: { include: { user: { include: { avatar: { select: { updatedAt: true } } } } } },
      },
    });
    if (!room || room.status === "CLOSED") return null;

    let status: RoomPhase = room.status;
    if (status === "COUNTDOWN" || status === "RACING") {
      status = "WAITING";
      await prisma.room.update({ where: { id: room.id }, data: { status } });
    }
    const runtime = new RoomRuntime({ ...room, status }, hooks);
    for (const m of room.members) {
      runtime.members.set(m.id, {
        id: m.id,
        userId: m.userId,
        guestId: m.guestId,
        nickname: m.nickname,
        role: m.role,
        joinedAt: m.joinedAt,
        avatarUrl: m.user?.avatar ? avatarUrlFor(m.user.id, m.user.avatar.updatedAt) : null,
      });
      // Nobody is connected yet: everyone gets the reconnection delay.
      runtime.startGrace(m.id);
    }
    return runtime;
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch((error) => console.error(`[room ${this.code}]`, error));
    return run;
  }

  get isClosed(): boolean {
    return this.phase === "CLOSED";
  }

  memberIdOf(identity: Identity): string | null {
    for (const member of this.members.values()) {
      if (matchesIdentity(member, identity)) return member.id;
    }
    return null;
  }

  private hostMember(): MemberState | undefined {
    return [...this.members.values()].find((m) => m.userId === this.hostUserId);
  }

  private botCount(): number {
    return this.config.bots.length;
  }

  private participantCount(): number {
    return countParticipants([...this.members.values()], this.botCount());
  }

  // ------------------------------------------------------------------
  // Joining, leaving and connections
  // ------------------------------------------------------------------

  /** Admission rules for someone who is not yet a member (SALLE-03 to SALLE-09). */
  join(connection: Connection, identity: Identity, message: JoinMessage): Promise<JoinOutcome> {
    return this.enqueue(async () => {
      if (this.isClosed) return { ok: false, error: "closed" } as const;

      const existing = this.memberIdOf(identity);
      if (existing) {
        this.attach(connection, existing);
        return { ok: true } as const;
      }

      const banned = await prisma.roomBan.findFirst({
        where: {
          roomId: this.roomId,
          ...(identity.kind === "user" ? { userId: identity.id } : { guestId: identity.id }),
        },
      });
      if (banned) return { ok: false, error: "banned" } as const;
      if (this.phase !== "WAITING" && this.phase !== "RESULTS") {
        return { ok: false, error: "inProgress" } as const;
      }

      if (message.invite) {
        const invite = await prisma.invite.findUnique({ where: { token: message.invite } });
        if (!invite || invite.roomId !== this.roomId)
          return { ok: false, error: "inviteInvalid" } as const;
        const check = checkInvite(invite, { ...identity, ip: connection.ip });
        if (check === "revoked") return { ok: false, error: "inviteInvalid" } as const;
        if (check === "used") return { ok: false, error: "inviteUsed" } as const;
        if (check === "claim") {
          await prisma.invite.update({
            where: { id: invite.id },
            data: {
              usedAt: new Date(),
              usedIp: connection.ip,
              usedByName: identity.name,
              ...(identity.kind === "user"
                ? { usedByUserId: identity.id }
                : { usedByGuestId: identity.id }),
            },
          });
        }
      } else if (this.config.visibility === "PRIVATE") {
        // The code alone never opens a private room (SALLE-04).
        return { ok: false, error: "private" } as const;
      }

      const role = message.asSpectator ? "SPECTATOR" : "PARTICIPANT";
      if (role === "PARTICIPANT" && this.participantCount() >= this.config.capacity) {
        return { ok: false, error: "full" } as const;
      }

      const created = await prisma.roomMember.create({
        data: {
          roomId: this.roomId,
          nickname: identity.name,
          role,
          ...(identity.kind === "user" ? { userId: identity.id } : { guestId: identity.id }),
        },
        include: { user: { include: { avatar: { select: { updatedAt: true } } } } },
      });
      this.members.set(created.id, {
        id: created.id,
        userId: created.userId,
        guestId: created.guestId,
        nickname: created.nickname,
        role: created.role,
        joinedAt: created.joinedAt,
        avatarUrl: created.user?.avatar
          ? avatarUrlFor(created.user.id, created.user.avatar.updatedAt)
          : null,
      });
      this.attach(connection, created.id);
      this.hooks.onPublicChange();
      return { ok: true } as const;
    });
  }

  /** Re-attaches an existing member (second tab or reconnection). */
  attach(connection: Connection, memberId: string) {
    const set = this.connections.get(memberId) ?? new Set<Connection>();
    set.add(connection);
    this.connections.set(memberId, set);
    const timer = this.graceTimers.get(memberId);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(memberId);
    }
    this.broadcastRoom();
    const self = this.race?.session.self(memberId);
    if (self && !this.race?.results) connection.send({ type: "self", self, reason: "resync" });
  }

  /** A socket closed. After the grace delay, the member leaves (COURSE-08). */
  detach(connection: Connection) {
    for (const [memberId, set] of this.connections) {
      if (!set.delete(connection)) continue;
      if (set.size === 0) {
        this.connections.delete(memberId);
        this.startGrace(memberId);
      }
      this.broadcastRoom();
    }
  }

  private startGrace(memberId: string) {
    if (this.graceTimers.has(memberId)) return;
    this.graceTimers.set(
      memberId,
      setTimeout(() => {
        this.graceTimers.delete(memberId);
        if (!this.connections.has(memberId)) void this.removeMember(memberId, "timeout");
      }, RECONNECT_GRACE_MS)
    );
  }

  /** Leaves the room for good: abandons a running race, hands over hosting. */
  removeMember(memberId: string, reason: "leave" | "timeout" | "kick"): Promise<void> {
    return this.enqueue(async () => {
      const member = this.members.get(memberId);
      if (!member || this.isClosed) return;
      this.race?.session.abandon(memberId, Date.now());

      if (reason === "kick") {
        await prisma.$transaction([
          prisma.roomBan.create({
            data: { roomId: this.roomId, userId: member.userId, guestId: member.guestId },
          }),
          // The expelled person's invitation stops working (SALLE-04).
          prisma.invite.updateMany({
            where: {
              roomId: this.roomId,
              ...(member.userId
                ? { usedByUserId: member.userId }
                : { usedByGuestId: member.guestId }),
            },
            data: { revokedAt: new Date() },
          }),
        ]);
      }
      await prisma.roomMember.deleteMany({ where: { id: memberId } });
      this.members.delete(memberId);
      const timer = this.graceTimers.get(memberId);
      if (timer) clearTimeout(timer);
      this.graceTimers.delete(memberId);

      const sockets = this.connections.get(memberId);
      this.connections.delete(memberId);
      sockets?.forEach((c) => c.send({ type: reason === "kick" ? "kicked" : "left" }));

      if (member.userId === this.hostUserId) {
        const next = pickNextHost([...this.members.values()], memberId);
        if (!next?.userId) {
          await this.closeRoom();
          return;
        }
        this.hostUserId = next.userId;
        await prisma.room.update({ where: { id: this.roomId }, data: { hostId: next.userId } });
      }
      this.broadcastRoom();
      this.hooks.onPublicChange();
    });
  }

  // ------------------------------------------------------------------
  // Room messages
  // ------------------------------------------------------------------

  handle(connection: Connection, memberId: string, message: RoomMessage): Promise<void> {
    if (message.type === "input") {
      // Hot path: no queue, no database.
      this.handleInput(connection, memberId, message.keys);
      return Promise.resolve();
    }
    if (message.type === "leave") return this.removeMember(memberId, "leave");
    return this.enqueue(async () => {
      const error = await this.dispatch(connection, memberId, message);
      if (error) connection.send({ type: "actionError", error });
    });
  }

  private requireHost(memberId: string): ActionError | null {
    return this.members.get(memberId)?.userId === this.hostUserId ? null : "notHost";
  }

  private async dispatch(
    connection: Connection,
    memberId: string,
    message: Exclude<RoomMessage, { type: "input" | "leave" }>
  ): Promise<ActionError | null> {
    switch (message.type) {
      case "abandon":
        this.race?.session.abandon(memberId, Date.now());
        this.broadcastTrack(Date.now());
        return null;
      case "setRole":
        return this.setRole(memberId, message.role);
      case "updateConfig":
        return this.requireHost(memberId) ?? this.updateConfig(message.config);
      case "createInvite":
        return this.requireHost(memberId) ?? this.createInvite();
      case "kick": {
        const denied = this.requireHost(memberId);
        if (denied) return denied;
        if (message.memberId === memberId || !this.members.has(message.memberId)) return "invalid";
        // removeMember runs after this task in the queue.
        void this.removeMember(message.memberId, "kick");
        return null;
      }
      case "start":
        return this.requireHost(memberId) ?? this.startRace();
      case "restart":
        return this.requireHost(memberId) ?? this.restart();
      case "close":
        if (this.requireHost(memberId)) return "notHost";
        await this.closeRoom();
        return null;
    }
  }

  private async setRole(memberId: string, role: MemberState["role"]): Promise<ActionError | null> {
    const member = this.members.get(memberId);
    if (!member) return "notInRoom";
    if (this.phase !== "WAITING" && this.phase !== "RESULTS") return "wrongPhase";
    if (member.role === role) return null;
    if (role === "PARTICIPANT" && this.participantCount() >= this.config.capacity) {
      return "overCapacity";
    }
    await prisma.roomMember.update({ where: { id: memberId }, data: { role } });
    member.role = role;
    this.broadcastRoom();
    this.hooks.onPublicChange();
    return null;
  }

  private async updateConfig(config: RoomConfig): Promise<ActionError | null> {
    if (this.phase !== "WAITING" && this.phase !== "RESULTS") return "wrongPhase";
    const humans = [...this.members.values()].filter((m) => m.role === "PARTICIPANT").length;
    if (humans + config.bots.length > config.capacity) return "overCapacity";

    await prisma.room.update({
      where: { id: this.roomId },
      data: {
        config,
        visibility: config.visibility,
        capacity: config.capacity,
        language: config.language,
        complexity: config.complexity,
      },
    });
    this.config = config;
    this.broadcastRoom();
    this.hooks.onPublicChange();
    return null;
  }

  private async createInvite(): Promise<ActionError | null> {
    if (this.isClosed) return "wrongPhase";
    await prisma.invite.create({ data: { roomId: this.roomId, token: generateInviteToken() } });
    this.broadcastRoom();
    return null;
  }

  private setPhase(event: RoomEvent): boolean {
    const next = transition(this.phase, event);
    if (!next) return false;
    this.phase = next;
    return true;
  }

  private async startRace(): Promise<ActionError | null> {
    if (this.phase !== "WAITING") return "wrongPhase";
    const participants = [...this.members.values()].filter((m) => m.role === "PARTICIPANT");
    const check = canStartRace({ humanParticipants: participants.length, bots: this.botCount() });
    if (!check.ok) return check.reason;

    const seed = randomInt(0, 2 ** 31);
    const generated = await buildRaceText(this.config, seed);

    const goAt = Date.now() + COUNTDOWN_MS;
    const racers: RacerView[] = [
      ...participants.map((m, index) => ({
        id: m.id,
        name: m.nickname,
        isBot: false,
        botLevel: null,
        avatarUrl: m.avatarUrl,
        colorIndex: index,
      })),
      ...this.config.bots.map((b, index) => ({
        id: b.id,
        name: botName(b.id),
        isBot: true,
        botLevel: b.level,
        avatarUrl: null,
        colorIndex: participants.length + index,
      })),
    ];
    const session = new RaceSession({
      racers: racers.map((r) => ({
        id: r.id,
        name: r.name,
        userId: r.isBot ? null : (this.members.get(r.id)?.userId ?? null),
        bot: r.botLevel ? { level: r.botLevel, seed: seed ^ hashString(r.id) } : null,
      })),
      text: generated.text,
      config: this.config,
      seed,
      goAt,
    });

    const race = await prisma.race.create({
      data: {
        roomId: this.roomId,
        seed,
        config: this.config,
        text: generated.text,
        passageId: generated.passageId,
        startedAt: new Date(goAt),
      },
    });
    await prisma.room.update({ where: { id: this.roomId }, data: { status: "COUNTDOWN" } });
    this.setPhase("START");
    this.race = {
      raceId: race.id,
      session,
      racers,
      errorMode: this.config.errorMode,
      language: this.config.language,
      startedAt: new Date(goAt),
      results: null,
    };
    // The text is revealed now, at the start of the countdown (COURSE-03).
    this.broadcastRoom();
    this.hooks.onPublicChange();

    this.countdownTimer = setTimeout(() => {
      void this.enqueue(async () => {
        if (this.phase !== "COUNTDOWN") return;
        this.setPhase("GO");
        await prisma.room.update({ where: { id: this.roomId }, data: { status: "RACING" } });
        this.broadcastRoom();
        this.loop = setInterval(() => this.tick(), TICK_MS);
      });
    }, goAt - Date.now());
    return null;
  }

  private handleInput(connection: Connection, memberId: string, keys: KeyInput[]) {
    const session = this.race?.session;
    if (!session || this.phase !== "RACING") return;
    const result = session.input(memberId, keys, Date.now());
    if (result === "rejected") {
      // Impossible progress: the server's state wins (COURSE-06).
      const self = session.self(memberId);
      if (self) connection.send({ type: "self", self, reason: "resync" });
    }
  }

  private tick() {
    const race = this.race;
    if (!race || this.phase !== "RACING") return;
    const now = Date.now();
    const result = race.session.tick(now);

    for (const bonus of result.bonuses) this.broadcast({ type: "bonus", bonus });
    for (const racerId of result.changed) {
      const self = race.session.self(racerId);
      if (self)
        this.connections
          .get(racerId)
          ?.forEach((c) => c.send({ type: "self", self, reason: "text" }));
    }
    if (now - this.lastTrackAt >= TRACK_BROADCAST_MS || result.ended) this.broadcastTrack(now);
    if (result.ended) void this.enqueue(() => this.finishRace());
  }

  private async finishRace() {
    const race = this.race;
    if (!race || this.phase !== "RACING") return;
    if (this.loop) clearInterval(this.loop);
    this.loop = null;

    const endedAt = new Date();
    const rows = await saveRaceResults(race.raceId, race.session.results(), endedAt);
    race.results = {
      raceId: race.raceId,
      startedAt: race.startedAt.toISOString(),
      text: race.session.baseText,
      language: race.language,
      rows,
    };
    this.setPhase("END");
    await prisma.room.update({ where: { id: this.roomId }, data: { status: "RESULTS" } });
    this.broadcastRoom();
    this.hooks.onPublicChange();
  }

  private async restart(): Promise<ActionError | null> {
    if (!this.setPhase("RESTART")) return "wrongPhase";
    this.race = null;
    await prisma.room.update({ where: { id: this.roomId }, data: { status: "WAITING" } });
    this.broadcastRoom();
    this.hooks.onPublicChange();
    return null;
  }

  /** Closes the room: everybody is released and every invitation dies (SALLE-04). */
  private async closeRoom() {
    if (this.loop) clearInterval(this.loop);
    if (this.countdownTimer) clearTimeout(this.countdownTimer);
    this.graceTimers.forEach((timer) => clearTimeout(timer));
    this.graceTimers.clear();
    this.phase = "CLOSED";
    await prisma.$transaction([
      prisma.roomMember.deleteMany({ where: { roomId: this.roomId } }),
      prisma.invite.updateMany({
        where: { roomId: this.roomId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.room.update({
        where: { id: this.roomId },
        data: { status: "CLOSED", closedAt: new Date() },
      }),
    ]);
    this.broadcast({ type: "closed" });
    this.members.clear();
    this.connections.clear();
    this.hooks.onClosed(this.code);
    this.hooks.onPublicChange();
  }

  // ------------------------------------------------------------------
  // Views
  // ------------------------------------------------------------------

  private async invitesView(): Promise<InviteView[]> {
    const invites = await prisma.invite.findMany({
      where: { roomId: this.roomId },
      orderBy: { createdAt: "asc" },
    });
    return invites.map((i) => ({
      id: i.id,
      url: `/room/${this.code}?invite=${i.token}`,
      createdAt: i.createdAt.toISOString(),
      usedByName: i.usedByName,
      revoked: i.revokedAt !== null,
    }));
  }

  private snapshot(memberId: string, invites: InviteView[] | null): RoomSnapshot {
    const members: MemberView[] = [...this.members.values()]
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((m) => ({
        id: m.id,
        name: m.nickname,
        kind: m.userId ? "user" : "guest",
        role: m.role,
        isHost: m.userId === this.hostUserId,
        connected: this.connections.has(m.id),
        avatarUrl: m.avatarUrl,
        joinedAt: m.joinedAt.toISOString(),
      }));
    const isHost = this.members.get(memberId)?.userId === this.hostUserId;
    const race = this.race;
    return {
      code: this.code,
      phase: this.phase,
      config: this.config,
      members,
      bots: this.config.bots.map((b) => ({ id: b.id, level: b.level, name: botName(b.id) })),
      youId: memberId,
      invites: isHost ? invites : null,
      race: race
        ? {
            goAt: race.session.goAt,
            endsAt: race.session.endsAt,
            text: race.session.baseText,
            errorMode: race.errorMode,
            racers: race.racers,
            track: race.session.track(Date.now()),
            results: race.results,
          }
        : null,
    };
  }

  private broadcastRoom() {
    const host = this.hostMember();
    const needsInvites = host !== undefined && this.connections.has(host.id);
    void (needsInvites ? this.invitesView() : Promise.resolve(null)).then((invites) => {
      const serverNow = Date.now();
      for (const [memberId, sockets] of this.connections) {
        const room = this.snapshot(memberId, invites);
        sockets.forEach((c) => c.send({ type: "room", room, serverNow }));
      }
    });
  }

  private broadcastTrack(now: number) {
    if (!this.race) return;
    this.lastTrackAt = now;
    this.broadcast({ type: "track", track: this.race.session.track(now), serverNow: now });
  }

  private broadcast(message: ServerMessage) {
    for (const sockets of this.connections.values()) sockets.forEach((c) => c.send(message));
  }
}
