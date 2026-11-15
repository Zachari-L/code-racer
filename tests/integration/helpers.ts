/**
 * Shared fixtures for the integration tests, which run the realtime server
 * code against a real PostgreSQL database (DATABASE_URL, migrated). Every test
 * creates its own users and rooms and `cleanup` deletes them afterwards.
 */

import { randomUUID } from "node:crypto";
import { DEFAULT_ROOM_CONFIG, type RoomConfig } from "@/lib/game/config";
import type { Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import type { ParsedClientMessage, ServerMessage } from "@/lib/realtime/protocol";
import { generateRoomCode } from "@/lib/room-code";
import type { Connection, RuntimeHooks } from "@/server/realtime/room-runtime";

/** A short config that keeps races fast and free of randomness from bonuses. */
export const TEST_CONFIG: RoomConfig = {
  ...DEFAULT_ROOM_CONFIG,
  textMode: "RANDOM",
  wordCount: 10,
  complexity: "EASY",
  punctuation: false,
  capitals: false,
  accents: false,
  bonuses: false,
  timeLimitSec: null,
};

const createdUsers = new Set<string>();
const createdRooms = new Set<string>();

function unique(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

export async function createUser(name = "racer"): Promise<Identity> {
  const user = await prisma.user.create({ data: { username: unique(name).slice(0, 20) } });
  createdUsers.add(user.id);
  return { kind: "user", id: user.id, name: user.username };
}

export function guestIdentity(name = "Guest"): Identity {
  return { kind: "guest", id: unique("g"), name };
}

/** A room hosted by `host`, who is its first member (like the createRoom action). */
export async function createRoom(
  host: Identity,
  config: Partial<RoomConfig> = {},
  overrides: {
    status?: "WAITING" | "COUNTDOWN" | "RACING" | "RESULTS" | "CLOSED";
    /** False for a room the host already left (a person is in one room at most). */
    hostIsMember?: boolean;
  } = {}
): Promise<{ id: string; code: string; config: RoomConfig }> {
  const full = { ...TEST_CONFIG, ...config };
  let code = generateRoomCode();
  while (await prisma.room.findUnique({ where: { code }, select: { id: true } })) {
    code = generateRoomCode();
  }
  const room = await prisma.room.create({
    data: {
      code,
      hostId: host.id,
      visibility: full.visibility,
      capacity: full.capacity,
      config: full,
      language: full.language,
      complexity: full.complexity,
      status: overrides.status,
      members:
        overrides.hostIsMember === false
          ? undefined
          : { create: { userId: host.id, nickname: host.name, role: "PARTICIPANT" } },
    },
  });
  createdRooms.add(room.id);
  return { id: room.id, code, config: full };
}

/** Rooms created by the code under test (not through `createRoom`) are cleaned up too. */
export function trackRoom(id: string) {
  createdRooms.add(id);
}

export async function cleanup() {
  const userIds = [...createdUsers];
  // Rooms first: a room keeps a non-cascading reference to its host.
  await prisma.room.deleteMany({
    where: { OR: [{ id: { in: [...createdRooms] } }, { hostId: { in: userIds } }] },
  });
  await prisma.raceResult.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  createdUsers.clear();
  createdRooms.clear();
}

/** A join message as the hub hands it to a room, after Zod filled the defaults. */
export function joinMessage(
  code: string,
  options: { invite?: string; asSpectator?: boolean } = {}
): Extract<ParsedClientMessage, { type: "join" }> {
  return {
    type: "join",
    code,
    invite: options.invite,
    asSpectator: options.asSpectator ?? false,
    leaveCurrent: false,
  };
}

/** Waits until `check` returns a truthy value, polling every 10 ms. */
export async function waitFor<T>(
  check: () => T | Promise<T>,
  { timeout = 5000, label = "condition" } = {}
): Promise<NonNullable<T>> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

type MessageOf<T extends ServerMessage["type"]> = Extract<ServerMessage, { type: T }>;

/** A browser tab as the room sees it: records every message it receives. */
export class FakeConnection implements Connection {
  readonly id = randomUUID();
  readonly messages: ServerMessage[] = [];

  constructor(
    readonly identity: Identity | null,
    readonly ip = "203.0.113.7"
  ) {}

  send(message: ServerMessage) {
    this.messages.push(message);
  }

  all<T extends ServerMessage["type"]>(type: T): MessageOf<T>[] {
    return this.messages.filter((m): m is MessageOf<T> => m.type === type);
  }

  last<T extends ServerMessage["type"]>(type: T): MessageOf<T> | undefined {
    return this.all(type).at(-1);
  }

  /** Waits for a message of `type` (received from now on) that matches `predicate`. */
  next<T extends ServerMessage["type"]>(
    type: T,
    predicate: (message: MessageOf<T>) => boolean = () => true
  ): Promise<MessageOf<T>> {
    const from = this.messages.length;
    return waitFor(
      () =>
        this.messages
          .slice(from)
          .find((m): m is MessageOf<T> => m.type === type && predicate(m as MessageOf<T>)),
      { label: `"${type}" message` }
    );
  }

  /** Latest room snapshot matching `predicate`, waiting for it if needed. */
  room(predicate: (room: MessageOf<"room">["room"]) => boolean = () => true) {
    return waitFor(
      () =>
        this.all("room")
          .map((m) => m.room)
          .findLast(predicate),
      { label: "room snapshot" }
    );
  }
}

export function recordingHooks(): RuntimeHooks & { closed: string[]; publicChanges: number } {
  const hooks = {
    closed: [] as string[],
    publicChanges: 0,
    onPublicChange: () => {
      hooks.publicChanges++;
    },
    onClosed: (code: string) => {
      hooks.closed.push(code);
    },
  };
  return hooks;
}
