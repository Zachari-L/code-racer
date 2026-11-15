import { afterAll, describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import type { IncomingMessage } from "node:http";
import type { WebSocket } from "ws";
import type { Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import type { ServerMessage } from "@/lib/realtime/protocol";
import { signPayload } from "@/lib/signing";
import { getRealtimeBridge } from "@/server/realtime/bridge";
import { RealtimeHub } from "@/server/realtime/hub";
import { cleanup, createRoom, createUser, guestIdentity, trackRoom, waitFor } from "./helpers";

process.env.AUTH_SECRET ??= "integration-test-secret";
const SECRET = process.env.AUTH_SECRET;

type MessageOf<T extends ServerMessage["type"]> = Extract<ServerMessage, { type: T }>;

/** The parts of a `ws` socket the hub uses, recording what it sends. */
class FakeSocket extends EventEmitter {
  readonly OPEN = 1;
  readyState = 1;
  readonly received: ServerMessage[] = [];

  send(data: string) {
    this.received.push(JSON.parse(data) as ServerMessage);
  }

  /** Sends a client message to the hub. */
  emitJson(message: unknown) {
    this.emit("message", Buffer.from(JSON.stringify(message)), false);
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }

  /** Waits for a message of `type` that arrived after `from` (an index in `received`). */
  wait<T extends ServerMessage["type"]>(
    type: T,
    predicate: (message: MessageOf<T>) => boolean = () => true,
    from = 0
  ): Promise<MessageOf<T>> {
    return waitFor(
      () =>
        this.received
          .slice(from)
          .find((m): m is MessageOf<T> => m.type === type && predicate(m as MessageOf<T>)),
      { label: `"${type}" message` }
    );
  }
}

function connect(hub: RealtimeHub, ip = "198.51.100.4") {
  const socket = new FakeSocket();
  const request = { headers: {}, socket: { remoteAddress: ip } } as unknown as IncomingMessage;
  hub.handleConnection(socket as unknown as WebSocket, request);
  return socket;
}

function ticket(identity: Identity, exp = Date.now() + 60_000) {
  return signPayload({ ...identity, exp }, SECRET);
}

/** A connected, authenticated socket. */
async function signedIn(hub: RealtimeHub, identity: Identity, ip?: string) {
  const socket = connect(hub, ip);
  socket.emitJson({ type: "auth", ticket: ticket(identity) });
  await socket.wait("hello");
  return socket;
}

async function join(socket: FakeSocket, message: Record<string, unknown>) {
  const from = socket.received.length;
  socket.emitJson({ type: "join", ...message });
  return waitFor(
    () => socket.received.slice(from).find((m) => m.type === "room" || m.type === "joinError"),
    { label: "join answer" }
  );
}

/** Hubs read ROOM_CODE_RATE_LIMIT when they are created. */
function createHub(rateLimit = 1000) {
  process.env.ROOM_CODE_RATE_LIMIT = String(rateLimit);
  return new RealtimeHub(false);
}

const openSockets: FakeSocket[] = [];
afterAll(async () => {
  openSockets.forEach((s) => s.close());
  // Close the rooms the hubs loaded so their timers stop.
  await cleanup();
});

describe("Authentication", () => {
  it("accepts a valid ticket and rejects forged or expired ones", async () => {
    const hub = createHub();
    const user = await createUser();

    const valid = connect(hub);
    valid.emitJson({ type: "auth", ticket: ticket(user) });
    expect((await valid.wait("hello")).signedIn).toBe(true);

    const expired = connect(hub);
    expired.emitJson({ type: "auth", ticket: ticket(user, Date.now() - 1) });
    expect((await expired.wait("hello")).signedIn).toBe(false);

    const forged = connect(hub);
    forged.emitJson({ type: "auth", ticket: signPayload({ ...user, exp: Date.now() + 1e5 }, "x") });
    expect((await forged.wait("hello")).signedIn).toBe(false);

    const anonymous = connect(hub);
    anonymous.emitJson({ type: "join", code: "ABCDEF" });
    expect((await anonymous.wait("joinError")).error).toBe("notSignedIn");
  });

  it("answers pings with the server clock", async () => {
    const socket = connect(createHub());
    socket.emitJson({ type: "ping", t: 42 });
    const pong = await socket.wait("pong");
    expect(pong.t).toBe(42);
    expect(Math.abs(pong.serverNow - Date.now())).toBeLessThan(1000);
  });
});

describe("Message validation (TECH-07)", () => {
  it("rejects messages that do not match the protocol", async () => {
    const socket = connect(createHub());
    socket.emitJson({ type: "ping", t: "soon" });
    socket.emitJson({ type: "teleport" });
    await waitFor(() => socket.received.filter((m) => m.type === "actionError").length === 2);
    expect(socket.received.every((m) => m.type === "actionError" && m.error === "invalid")).toBe(
      true
    );
  });

  it("ignores binary, oversized and malformed frames", async () => {
    const socket = connect(createHub());
    socket.emit("message", Buffer.from("{"), false);
    socket.emit("message", Buffer.from(JSON.stringify({ type: "ping", t: 1 })), true);
    socket.emit("message", Buffer.alloc(17 * 1024, " "), false);
    socket.emitJson({ type: "ping", t: 2 });
    await socket.wait("pong");
    expect(socket.received).toHaveLength(1);
  });

  it("refuses room actions from someone who is not in a room", async () => {
    const hub = createHub();
    const socket = await signedIn(hub, await createUser());
    socket.emitJson({ type: "start" });
    expect((await socket.wait("actionError")).error).toBe("notInRoom");
  });
});

describe("Joining rooms", () => {
  it("joins an existing room, routes its messages and reports unknown codes", async () => {
    const hub = createHub();
    const host = await createUser("host");
    const room = await createRoom(host);
    const socket = await signedIn(hub, host);
    openSockets.push(socket);

    expect(await join(socket, { code: "ZZZZZZ" })).toMatchObject({
      type: "joinError",
      error: "notFound",
    });
    const answer = await join(socket, { code: room.code });
    expect(answer.type).toBe("room");

    const from = socket.received.length;
    socket.emitJson({ type: "setRole", role: "SPECTATOR" });
    await socket.wait("room", (m) => m.room.members[0]?.role === "SPECTATOR", from);
  });

  it("allows one room at a time and can leave the current one (SALLE-06)", async () => {
    const hub = createHub();
    const hostA = await createUser("hosta");
    const hostB = await createUser("hostb");
    const roomA = await createRoom(hostA);
    const roomB = await createRoom(hostB);
    const guest = guestIdentity("Hopper");

    const socket = await signedIn(hub, guest);
    openSockets.push(socket);
    expect((await join(socket, { code: roomA.code })).type).toBe("room");

    expect(await join(socket, { code: roomB.code })).toMatchObject({
      type: "joinError",
      error: "alreadyInRoom",
      currentRoom: roomA.code,
    });

    expect((await join(socket, { code: roomB.code, leaveCurrent: true })).type).toBe("room");
    const membership = await prisma.roomMember.findUniqueOrThrow({
      where: { guestId: guest.id },
    });
    expect(membership.roomId).toBe(roomB.id);
  });

  it("limits attempts with a bare code per IP address, but not returns (SALLE-10)", async () => {
    const hub = createHub(2);
    const host = await createUser("host");
    const room = await createRoom(host);
    const socket = await signedIn(hub, host, "192.0.2.50");
    openSockets.push(socket);

    expect(await join(socket, { code: "ZZZZZZ" })).toMatchObject({ error: "notFound" });
    expect(await join(socket, { code: "YYYYYY" })).toMatchObject({ error: "notFound" });
    const limited = await join(socket, { code: "XXXXXX" });
    expect(limited).toMatchObject({ type: "joinError", error: "rateLimited" });
    expect((limited as MessageOf<"joinError">).retryAfterMs).toBeGreaterThan(0);

    // The host is already a member of their room, so going back is not an attempt.
    expect((await join(socket, { code: room.code })).type).toBe("room");
  });

  it("marks a member as disconnected when their socket closes", async () => {
    const hub = createHub();
    const host = await createUser("host");
    const room = await createRoom(host);
    const hostSocket = await signedIn(hub, host);
    openSockets.push(hostSocket);
    await join(hostSocket, { code: room.code });

    const guest = guestIdentity("Leaver");
    const guestSocket = await signedIn(hub, guest);
    await join(guestSocket, { code: room.code });
    await hostSocket.wait("room", (m) => m.room.members.length === 2);

    const from = hostSocket.received.length;
    guestSocket.close();
    const snapshot = await hostSocket.wait(
      "room",
      (m) => m.room.members.some((x) => x.name === "Leaver" && !x.connected),
      from
    );
    expect(snapshot.room.members).toHaveLength(2);
  });
});

describe("Room explorer (JOIN-02) and server actions bridge", () => {
  it("lists public rooms only and refreshes when a room is created", async () => {
    const hub = createHub();
    const host = await createUser("host");
    const publicRoom = await createRoom(host);
    const privateHost = await createUser("secret");
    const privateRoom = await createRoom(privateHost, { visibility: "PRIVATE" });

    const watcher = connect(hub);
    watcher.emitJson({ type: "subscribeExplorer" });
    const list = await watcher.wait("explorer");
    const codes = list.rooms.map((r) => r.code);
    expect(codes).toContain(publicRoom.code);
    expect(codes).not.toContain(privateRoom.code);
    expect(list.rooms.find((r) => r.code === publicRoom.code)).toMatchObject({
      hostName: host.name,
      participants: 1,
      phase: "WAITING",
    });

    // A room created by a server action reaches the explorer through the bridge.
    const laterHost = await createUser("later");
    const later = await createRoom(laterHost);
    const from = watcher.received.length;
    await getRealtimeBridge()!.roomCreated(later.code);
    await watcher.wait("explorer", (m) => m.rooms.some((r) => r.code === later.code), from);
  });

  it("lets server actions remove someone from their current room", async () => {
    const hub = createHub();
    const host = await createUser("host");
    const room = await createRoom(host);
    trackRoom(room.id);
    const guest = guestIdentity("Moved");
    const socket = await signedIn(hub, guest);
    openSockets.push(socket);
    await join(socket, { code: room.code });

    await getRealtimeBridge()!.leaveCurrentRoom(guest);
    await socket.wait("left");
    expect(await prisma.roomMember.findUnique({ where: { guestId: guest.id } })).toBeNull();
  });
});
