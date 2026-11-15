import { afterAll, afterEach, describe, expect, it, jest } from "bun:test";
import { COUNTDOWN_MS } from "@/lib/game/state-machine";
import type { Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import { RECONNECT_GRACE_MS } from "@/lib/realtime/protocol";
import { RoomRuntime } from "@/server/realtime/room-runtime";
import {
  FakeConnection,
  TEST_CONFIG,
  cleanup,
  createRoom,
  createUser,
  guestIdentity,
  joinMessage,
  recordingHooks,
  waitFor,
} from "./helpers";

const runtimes: RoomRuntime[] = [];

async function load(code: string, hooks = recordingHooks()) {
  const runtime = await RoomRuntime.load(code, hooks);
  if (runtime) runtimes.push(runtime);
  return runtime;
}

/** A room with its host connected, ready to accept other people. */
async function openRoom(config: Partial<typeof TEST_CONFIG> = {}) {
  const host = await createUser("host");
  const room = await createRoom(host, config);
  const hooks = recordingHooks();
  const runtime = (await load(room.code, hooks))!;
  const hostConn = new FakeConnection(host);
  await runtime.join(hostConn, host, joinMessage(room.code));
  const hostMemberId = runtime.memberIdOf(host)!;
  return { host, room, hooks, runtime, hostConn, hostMemberId };
}

async function joinAs(
  runtime: RoomRuntime,
  code: string,
  identity: Identity,
  options: { invite?: string; asSpectator?: boolean; ip?: string } = {}
) {
  const connection = new FakeConnection(identity, options.ip);
  const outcome = await runtime.join(connection, identity, joinMessage(code, options));
  return { connection, outcome, memberId: runtime.memberIdOf(identity) };
}

/** Types `text` as fast as the server's rate limit allows. */
async function typeText(
  runtime: RoomRuntime,
  connection: FakeConnection,
  memberId: string,
  text: string
) {
  for (let i = 0; i < text.length; i += 15) {
    const keys = [...text.slice(i, i + 15)].map((c) => ({ k: "c" as const, c }));
    await runtime.handle(connection, memberId, { type: "input", keys });
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
}

afterEach(async () => {
  // Closing stops every timer (grace delays, countdown, race loop).
  for (const runtime of runtimes.splice(0)) {
    if (runtime.isClosed) continue;
    const host = await prisma.room.findUnique({
      where: { code: runtime.code },
      select: { hostId: true },
    });
    const hostConn = new FakeConnection({ kind: "user", id: host!.hostId, name: "host" });
    const memberId = runtime.memberIdOf(hostConn.identity!);
    if (memberId) await runtime.handle(hostConn, memberId, { type: "close" });
  }
});

afterAll(cleanup);

describe("RoomRuntime.load", () => {
  it("returns null for unknown and closed rooms", async () => {
    const host = await createUser();
    const closed = await createRoom(host, {}, { status: "CLOSED" });
    expect(await load("ZZZZZZ")).toBeNull();
    expect(await load(closed.code)).toBeNull();
  });

  it("sends a race cut short by a restart back to the waiting room", async () => {
    const host = await createUser();
    const room = await createRoom(host, {}, { status: "RACING" });
    const runtime = await load(room.code);
    expect(runtime).not.toBeNull();
    const stored = await prisma.room.findUnique({ where: { id: room.id } });
    expect(stored?.status).toBe("WAITING");
  });
});

describe("Joining (SALLE-03 to SALLE-09)", () => {
  it("adds a member, stores them and tells everyone", async () => {
    const { runtime, room, hostConn, hooks } = await openRoom();
    const guest = guestIdentity("Zoe");
    const { outcome, connection, memberId } = await joinAs(runtime, room.code, guest);

    expect(outcome).toEqual({ ok: true });
    const stored = await prisma.roomMember.findUnique({ where: { guestId: guest.id } });
    expect(stored).toMatchObject({ id: memberId, roomId: room.id, nickname: "Zoe" });
    const seenByHost = await hostConn.room((r) => r.members.length === 2);
    expect(seenByHost.members.map((m) => m.name)).toContain("Zoe");
    const seenByGuest = await connection.room((r) => r.members.length === 2);
    expect(seenByGuest.youId).toBe(memberId!);
    // Only the host sees invitations.
    expect(seenByGuest.invites).toBeNull();
    expect(hooks.publicChanges).toBeGreaterThan(0);
  });

  it("re-attaches a returning member instead of adding them twice", async () => {
    const { runtime, room, host } = await openRoom();
    const secondTab = new FakeConnection(host);
    expect(await runtime.join(secondTab, host, joinMessage(room.code))).toEqual({
      ok: true,
    });
    expect(await prisma.roomMember.count({ where: { roomId: room.id } })).toBe(1);
    await secondTab.room();
  });

  it("keeps private rooms closed to the bare code (SALLE-04)", async () => {
    const { runtime, room } = await openRoom({ visibility: "PRIVATE" });
    const { outcome } = await joinAs(runtime, room.code, guestIdentity());
    expect(outcome).toEqual({ ok: false, error: "private" });
  });

  it("binds an invitation to the first person who opens it (SALLE-04)", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom({ visibility: "PRIVATE" });
    await runtime.handle(hostConn, hostMemberId, { type: "createInvite" });
    const invite = await prisma.invite.findFirstOrThrow({ where: { roomId: room.id } });
    const snapshot = await hostConn.room((r) => (r.invites ?? []).length === 1);
    expect(snapshot.invites![0].url).toBe(`/room/${room.code}?invite=${invite.token}`);

    const guest = guestIdentity("Invited");
    const first = await joinAs(runtime, room.code, guest, { invite: invite.token });
    expect(first.outcome).toEqual({ ok: true });
    const claimed = await prisma.invite.findUniqueOrThrow({ where: { id: invite.id } });
    expect(claimed).toMatchObject({ usedByGuestId: guest.id, usedByName: "Invited" });

    const other = await joinAs(runtime, room.code, guestIdentity(), { invite: invite.token });
    expect(other.outcome).toEqual({ ok: false, error: "inviteUsed" });
    const forged = await joinAs(runtime, room.code, guestIdentity(), { invite: "not-a-token" });
    expect(forged.outcome).toEqual({ ok: false, error: "inviteInvalid" });
  });

  it("refuses participants over capacity but still lets people watch (SALLE-05)", async () => {
    const { runtime, room } = await openRoom({ capacity: 2 });
    expect((await joinAs(runtime, room.code, guestIdentity())).outcome.ok).toBe(true);
    const third = guestIdentity();
    expect((await joinAs(runtime, room.code, third)).outcome).toEqual({
      ok: false,
      error: "full",
    });
    expect((await joinAs(runtime, room.code, third, { asSpectator: true })).outcome).toEqual({
      ok: true,
    });
  });

  it("does not let anyone in while a race is running (SALLE-09)", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom({
      bots: [{ id: "bot-1", level: "NOOB" }],
    });
    await runtime.handle(hostConn, hostMemberId, { type: "start" });
    const { outcome } = await joinAs(runtime, room.code, guestIdentity());
    expect(outcome).toEqual({ ok: false, error: "inProgress" });
  });
});

describe("Host actions (CONF-12, SALLE-07)", () => {
  it("rejects host-only actions from other members", async () => {
    const { runtime, room } = await openRoom();
    const guest = await joinAs(runtime, room.code, guestIdentity());
    for (const message of [
      { type: "start" },
      { type: "createInvite" },
      { type: "restart" },
      { type: "close" },
    ] as const) {
      await runtime.handle(guest.connection, guest.memberId!, message);
      expect(guest.connection.last("actionError")?.error).toBe("notHost");
    }
    expect(runtime.isClosed).toBe(false);
  });

  it("stores a new configuration and its explorer columns", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom();
    const config = {
      ...TEST_CONFIG,
      capacity: 4,
      language: "en" as const,
      complexity: "HARD" as const,
    };
    await runtime.handle(hostConn, hostMemberId, { type: "updateConfig", config });
    const stored = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(stored).toMatchObject({ capacity: 4, language: "en", complexity: "HARD" });
    expect((await hostConn.room((r) => r.config.capacity === 4)).config.language).toBe("en");

    // Bots count toward capacity.
    const tooMany = {
      ...config,
      capacity: 2,
      bots: [
        { id: "b1", level: "NOOB" as const },
        { id: "b2", level: "NOOB" as const },
      ],
    };
    await runtime.handle(hostConn, hostMemberId, { type: "updateConfig", config: tooMany });
    expect(hostConn.last("actionError")?.error).toBe("overCapacity");
  });

  it("switches between participant and spectator within capacity", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom({ capacity: 2 });
    const guest = await joinAs(runtime, room.code, guestIdentity(), { asSpectator: true });
    const other = await joinAs(runtime, room.code, guestIdentity());
    expect(other.outcome.ok).toBe(true);

    await runtime.handle(guest.connection, guest.memberId!, {
      type: "setRole",
      role: "PARTICIPANT",
    });
    expect(guest.connection.last("actionError")?.error).toBe("overCapacity");

    await runtime.handle(hostConn, hostMemberId, { type: "setRole", role: "SPECTATOR" });
    await runtime.handle(guest.connection, guest.memberId!, {
      type: "setRole",
      role: "PARTICIPANT",
    });
    const stored = await prisma.roomMember.findUniqueOrThrow({ where: { id: guest.memberId! } });
    expect(stored.role).toBe("PARTICIPANT");
  });

  it("expels a member for good and revokes their invitation (SALLE-07)", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom({ visibility: "PRIVATE" });
    await runtime.handle(hostConn, hostMemberId, { type: "createInvite" });
    const invite = await prisma.invite.findFirstOrThrow({ where: { roomId: room.id } });
    const guestId = guestIdentity("Pest");
    const guest = await joinAs(runtime, room.code, guestId, { invite: invite.token });

    await runtime.handle(hostConn, hostMemberId, { type: "kick", memberId: guest.memberId! });
    await waitFor(() => guest.connection.last("kicked"), { label: "kicked message" });
    expect(await prisma.roomMember.findUnique({ where: { guestId: guestId.id } })).toBeNull();
    expect(await prisma.roomBan.count({ where: { roomId: room.id, guestId: guestId.id } })).toBe(1);
    const revoked = await prisma.invite.findUniqueOrThrow({ where: { id: invite.id } });
    expect(revoked.revokedAt).not.toBeNull();

    const again = await joinAs(runtime, room.code, guestId, { invite: invite.token });
    expect(again.outcome).toEqual({ ok: false, error: "banned" });
  });

  it("cannot kick itself or someone who is not in the room", async () => {
    const { runtime, hostConn, hostMemberId } = await openRoom();
    await runtime.handle(hostConn, hostMemberId, { type: "kick", memberId: hostMemberId });
    expect(hostConn.last("actionError")?.error).toBe("invalid");
    await runtime.handle(hostConn, hostMemberId, { type: "kick", memberId: "nobody" });
    expect(hostConn.last("actionError")?.error).toBe("invalid");
  });
});

describe("Leaving and hosting (SALLE-08)", () => {
  it("hands hosting to the longest-present signed-in member", async () => {
    const { runtime, room, hostConn, hostMemberId } = await openRoom();
    await joinAs(runtime, room.code, guestIdentity());
    const next = await createUser("next");
    const nextJoin = await joinAs(runtime, room.code, next);

    await runtime.handle(hostConn, hostMemberId, { type: "leave" });
    expect(hostConn.last("left")).toBeDefined();
    const stored = await prisma.room.findUniqueOrThrow({ where: { id: room.id } });
    expect(stored.hostId).toBe(next.id);
    const snapshot = await nextJoin.connection.room((r) => r.members.length === 2);
    expect(snapshot.members.find((m) => m.id === nextJoin.memberId)?.isHost).toBe(true);
  });

  it("closes the room when only guests would be left", async () => {
    const { runtime, room, hostConn, hostMemberId, hooks } = await openRoom();
    await runtime.handle(hostConn, hostMemberId, { type: "createInvite" });
    const guest = await joinAs(runtime, room.code, guestIdentity());

    await runtime.handle(hostConn, hostMemberId, { type: "leave" });
    expect(guest.connection.last("closed")).toBeDefined();
    expect(runtime.isClosed).toBe(true);
    expect(hooks.closed).toEqual([room.code]);
    const stored = await prisma.room.findUniqueOrThrow({
      where: { id: room.id },
      include: { members: true, invites: true },
    });
    expect(stored.status).toBe("CLOSED");
    expect(stored.closedAt).not.toBeNull();
    expect(stored.members).toHaveLength(0);
    expect(stored.invites.every((i) => i.revokedAt !== null)).toBe(true);
    expect(
      (
        await runtime.join(
          new FakeConnection(guestIdentity()),
          guestIdentity(),
          joinMessage(room.code)
        )
      ).ok
    ).toBe(false);
  });
});

describe("Reconnection (COURSE-08)", () => {
  it("keeps a member who comes back within the grace delay", async () => {
    const { runtime, room, hostConn } = await openRoom();
    const guestId = guestIdentity("Flaky");
    const guest = await joinAs(runtime, room.code, guestId);
    runtime.detach(guest.connection);
    await hostConn.room((r) => r.members.some((m) => m.name === "Flaky" && !m.connected));

    const back = new FakeConnection(guestId);
    await runtime.join(back, guestId, joinMessage(room.code));
    await hostConn.room((r) => r.members.some((m) => m.name === "Flaky" && m.connected));
    expect(runtime.memberIdOf(guestId)).toBe(guest.memberId);
  });

  it("removes a member once the grace delay is over", async () => {
    const { runtime, room } = await openRoom();
    const guestId = guestIdentity();
    const guest = await joinAs(runtime, room.code, guestId);

    jest.useFakeTimers();
    try {
      runtime.detach(guest.connection);
      jest.advanceTimersByTime(RECONNECT_GRACE_MS);
    } finally {
      jest.useRealTimers();
    }
    await waitFor(() => runtime.memberIdOf(guestId) === null, { label: "member removal" });
    expect(await prisma.roomMember.findUnique({ where: { guestId: guestId.id } })).toBeNull();
  });
});

describe("Race lifecycle (COURSE-01 to COURSE-11)", () => {
  it("needs two participants, including a human (COURSE-02)", async () => {
    const { runtime, hostConn, hostMemberId } = await openRoom();
    await runtime.handle(hostConn, hostMemberId, { type: "start" });
    expect(hostConn.last("actionError")?.error).toBe("notEnoughParticipants");
  });

  it(
    "runs a race from the countdown to the stored results, then restarts",
    async () => {
      const { runtime, room, hostConn, hostMemberId, host } = await openRoom();
      const guest = await joinAs(runtime, room.code, guestIdentity("Quitter"));

      await runtime.handle(hostConn, hostMemberId, { type: "start" });
      // The text is revealed with the countdown (COURSE-03).
      const countdown = await hostConn.room((r) => r.phase === "COUNTDOWN");
      const text = countdown.race!.text;
      expect(text.split(" ")).toHaveLength(10);
      expect(countdown.race!.racers.map((r) => r.id).sort()).toEqual(
        [hostMemberId, guest.memberId!].sort()
      );
      const race = await prisma.race.findFirstOrThrow({ where: { roomId: room.id } });
      expect(race.text).toBe(text);

      // Typing before the start is ignored.
      await runtime.handle(hostConn, hostMemberId, {
        type: "input",
        keys: [{ k: "c", c: text[0] }],
      });
      await hostConn.room((r) => r.phase === "RACING");
      expect(Date.now()).toBeGreaterThanOrEqual(countdown.race!.goAt - 50);

      await runtime.handle(guest.connection, guest.memberId!, { type: "abandon" });
      await typeText(runtime, hostConn, hostMemberId, text);

      const done = await hostConn.room((r) => r.phase === "RESULTS");
      const rows = done.race!.results!.rows;
      expect(rows.map((r) => [r.name, r.status, r.rank])).toEqual([
        [host.name, "FINISHED", 1],
        ["Quitter", "ABANDONED", 2],
      ]);
      const stored = await prisma.raceResult.findMany({
        where: { raceId: race.id },
        orderBy: { rank: "asc" },
      });
      expect(stored.map((r) => [r.userId, r.status])).toEqual([
        [host.id, "FINISHED"],
        [null, "ABANDONED"],
      ]);
      expect(
        (await prisma.race.findUniqueOrThrow({ where: { id: race.id } })).endedAt
      ).not.toBeNull();
      expect((await prisma.room.findUniqueOrThrow({ where: { id: room.id } })).status).toBe(
        "RESULTS"
      );

      // Back to the waiting room with the same people (COURSE-11).
      await runtime.handle(hostConn, hostMemberId, { type: "restart" });
      const waiting = await hostConn.room((r) => r.phase === "WAITING" && r.race === null);
      expect(waiting.members).toHaveLength(2);
    },
    COUNTDOWN_MS + 20_000
  );

  it(
    "resyncs a racer whose input arrives faster than humanly possible (COURSE-06)",
    async () => {
      const { runtime, hostConn, hostMemberId } = await openRoom({
        bots: [{ id: "bot-1", level: "NOOB" }],
      });
      await runtime.handle(hostConn, hostMemberId, { type: "start" });
      const racing = await hostConn.room((r) => r.phase === "RACING");
      const burst = [...racing.race!.text.slice(0, 40)].map((c) => ({ k: "c" as const, c }));
      const resync = hostConn.next("self", (m) => m.reason === "resync");
      await runtime.handle(hostConn, hostMemberId, { type: "input", keys: burst });
      expect((await resync).self.typed).toBe("");
    },
    COUNTDOWN_MS + 5000
  );

  it("refuses to restart or reconfigure in the wrong phase", async () => {
    const { runtime, hostConn, hostMemberId } = await openRoom({
      bots: [{ id: "bot-1", level: "NOOB" }],
    });
    await runtime.handle(hostConn, hostMemberId, { type: "restart" });
    expect(hostConn.last("actionError")?.error).toBe("wrongPhase");
    await runtime.handle(hostConn, hostMemberId, { type: "start" });
    await runtime.handle(hostConn, hostMemberId, { type: "updateConfig", config: TEST_CONFIG });
    expect(hostConn.last("actionError")?.error).toBe("wrongPhase");
  });
});
