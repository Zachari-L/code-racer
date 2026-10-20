/**
 * WebSocket entry point: authenticates sockets with a signed ticket, routes
 * joins to room runtimes, rate-limits room codes (SALLE-10) and feeds the room
 * explorer (JOIN-02).
 */

import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { WebSocket } from "ws";
import { parseStoredConfig } from "@/lib/game/config";
import { ticketSchema, type Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, ROOM_CODE_ATTEMPTS_PER_MINUTE } from "@/lib/rate-limit";
import {
  clientMessageSchema,
  type ExplorerRoom,
  type ParsedClientMessage,
  type ServerMessage,
} from "@/lib/realtime/protocol";
import { clientIp, countParticipants } from "@/lib/rooms";
import { getAuthSecret, verifyPayload } from "@/lib/signing";
import { setRealtimeBridge } from "./bridge";
import { RoomRuntime, type Connection } from "./room-runtime";

const MAX_MESSAGE_BYTES = 16 * 1024;
const EXPLORER_DEBOUNCE_MS = 300;

interface SocketContext extends Connection {
  socket: WebSocket;
  room: RoomRuntime | null;
  explorer: boolean;
}

export class RealtimeHub {
  private readonly rooms = new Map<string, RoomRuntime>();
  private readonly loading = new Map<string, Promise<RoomRuntime | null>>();
  private readonly sockets = new Set<SocketContext>();
  private readonly codeLimiter = createRateLimiter(
    Number(process.env.ROOM_CODE_RATE_LIMIT ?? ROOM_CODE_ATTEMPTS_PER_MINUTE),
    60_000
  );
  private explorerTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly hooks = {
    onPublicChange: () => this.invalidateExplorer(),
    onClosed: (code: string) => {
      this.rooms.delete(code);
      for (const ctx of this.sockets) if (ctx.room?.code === code) ctx.room = null;
    },
  };

  constructor(private readonly trustProxy: boolean) {
    setRealtimeBridge({
      leaveCurrentRoom: (identity) => this.leaveCurrentRoom(identity),
      roomCreated: async (code) => {
        await this.getRoom(code);
        this.invalidateExplorer();
      },
    });
  }

  /** Loads every open room so absent members time out after a restart. */
  async bootstrap() {
    const open = await prisma.room.findMany({
      where: { status: { not: "CLOSED" } },
      select: { code: true },
    });
    await Promise.all(open.map((room) => this.getRoom(room.code)));
  }

  private getRoom(code: string): Promise<RoomRuntime | null> {
    const live = this.rooms.get(code);
    if (live) return Promise.resolve(live);
    const pending = this.loading.get(code);
    if (pending) return pending;
    const load = RoomRuntime.load(code, this.hooks).then((runtime) => {
      this.loading.delete(code);
      if (runtime) this.rooms.set(code, runtime);
      return runtime;
    });
    this.loading.set(code, load);
    return load;
  }

  handleConnection(socket: WebSocket, request: IncomingMessage) {
    const ctx: SocketContext = {
      id: randomUUID(),
      socket,
      identity: null,
      ip: clientIp(request.headers, request.socket.remoteAddress, this.trustProxy),
      room: null,
      explorer: false,
      send: (message: ServerMessage) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
      },
    };
    this.sockets.add(ctx);

    socket.on("message", (raw, isBinary) => {
      if (isBinary || (raw as Buffer).length > MAX_MESSAGE_BYTES) return;
      let data: unknown;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const parsed = clientMessageSchema.safeParse(data);
      if (!parsed.success) {
        ctx.send({ type: "actionError", error: "invalid" });
        return;
      }
      this.onMessage(ctx, parsed.data).catch((error) => console.error("[realtime]", error));
    });
    socket.on("close", () => {
      this.sockets.delete(ctx);
      ctx.room?.detach(ctx);
    });
  }

  private async onMessage(ctx: SocketContext, message: ParsedClientMessage) {
    switch (message.type) {
      case "auth": {
        const ticket = verifyPayload(message.ticket, getAuthSecret(), ticketSchema);
        ctx.identity =
          ticket && ticket.exp > Date.now()
            ? { kind: ticket.kind, id: ticket.id, name: ticket.name }
            : null;
        ctx.send({ type: "hello", serverNow: Date.now(), signedIn: ctx.identity !== null });
        return;
      }
      case "ping":
        ctx.send({ type: "pong", t: message.t, serverNow: Date.now() });
        return;
      case "subscribeExplorer":
        ctx.explorer = true;
        ctx.send({ type: "explorer", rooms: await this.explorerRooms() });
        return;
      case "join":
        return this.join(ctx, message);
      default: {
        const memberId = ctx.identity && ctx.room?.memberIdOf(ctx.identity);
        if (!ctx.room || !memberId) {
          ctx.send({ type: "actionError", error: "notInRoom" });
          return;
        }
        await ctx.room.handle(ctx, memberId, message);
      }
    }
  }

  private async join(ctx: SocketContext, message: Extract<ParsedClientMessage, { type: "join" }>) {
    const identity = ctx.identity;
    if (!identity) {
      ctx.send({ type: "joinError", error: "notSignedIn" });
      return;
    }

    const membership = await prisma.roomMember.findFirst({
      where: identity.kind === "user" ? { userId: identity.id } : { guestId: identity.id },
      include: { room: { select: { code: true } } },
    });
    const isReturning = membership?.room.code === message.code;

    // Only fresh attempts with a bare code count toward the limit (SALLE-10).
    if (!isReturning && !message.invite && !this.codeLimiter.attempt(ctx.ip)) {
      ctx.send({
        type: "joinError",
        error: "rateLimited",
        retryAfterMs: this.codeLimiter.retryAfterMs(ctx.ip),
      });
      return;
    }

    const room = await this.getRoom(message.code);
    if (!room) {
      ctx.send({ type: "joinError", error: "notFound" });
      return;
    }

    if (membership && !isReturning) {
      // One room at a time (SALLE-06): offer to leave the current one first.
      if (!message.leaveCurrent) {
        ctx.send({ type: "joinError", error: "alreadyInRoom", currentRoom: membership.room.code });
        return;
      }
      await this.leaveCurrentRoom(identity);
    }

    ctx.room?.detach(ctx);
    const outcome = await room.join(ctx, identity, message);
    if (outcome.ok) ctx.room = room;
    else ctx.send({ type: "joinError", error: outcome.error });
  }

  private async leaveCurrentRoom(identity: Identity) {
    const membership = await prisma.roomMember.findFirst({
      where: identity.kind === "user" ? { userId: identity.id } : { guestId: identity.id },
      include: { room: { select: { code: true } } },
    });
    if (!membership) return;
    const room = await this.getRoom(membership.room.code);
    if (room) await room.removeMember(membership.id, "leave");
    else await prisma.roomMember.deleteMany({ where: { id: membership.id } });
  }

  private invalidateExplorer() {
    if (this.explorerTimer) return;
    this.explorerTimer = setTimeout(async () => {
      this.explorerTimer = null;
      const subscribers = [...this.sockets].filter((s) => s.explorer);
      if (subscribers.length === 0) return;
      const rooms = await this.explorerRooms();
      subscribers.forEach((s) => s.send({ type: "explorer", rooms }));
    }, EXPLORER_DEBOUNCE_MS);
  }

  /** Public rooms for the explorer (JOIN-02); other visibilities never appear. */
  private async explorerRooms(): Promise<ExplorerRoom[]> {
    const rooms = await prisma.room.findMany({
      where: { visibility: "PUBLIC", status: { not: "CLOSED" } },
      include: {
        host: { select: { username: true, displayName: true } },
        members: { select: { role: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return rooms.map((room) => {
      const config = parseStoredConfig(room.config);
      return {
        code: room.code,
        hostName: room.host.displayName ?? room.host.username,
        participants: countParticipants(room.members, config.bots.length),
        capacity: room.capacity,
        language: config.language,
        complexity: config.complexity,
        phase: room.status,
        createdAt: room.createdAt.toISOString(),
      };
    });
  }
}
