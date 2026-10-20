/** Room rules that do not need the database: tested in tests/rooms.test.ts. */

import { randomBytes } from "node:crypto";
import type { RoomPhase } from "@/lib/game/state-machine";
import { isJoinable } from "@/lib/game/state-machine";

/** 16 random bytes = 128 bits of entropy (SALLE-04). */
export function generateInviteToken(): string {
  return randomBytes(16).toString("base64url");
}

export interface InviteRecord {
  usedAt: Date | null;
  usedIp: string | null;
  usedByUserId: string | null;
  usedByGuestId: string | null;
  revokedAt: Date | null;
}

export interface Visitor {
  kind: "user" | "guest";
  id: string;
  ip: string;
}

export type InviteCheck = "claim" | "reuse" | "used" | "revoked";

/**
 * Single-use invitation (SALLE-04): the first visitor claims it and binds it
 * to their identity and IP; afterwards only that same person, from that same
 * IP, may reuse it to come back.
 */
export function checkInvite(invite: InviteRecord, visitor: Visitor): InviteCheck {
  if (invite.revokedAt) return "revoked";
  if (!invite.usedAt) return "claim";
  const sameIdentity =
    visitor.kind === "user"
      ? invite.usedByUserId === visitor.id
      : invite.usedByGuestId === visitor.id;
  return sameIdentity && invite.usedIp === visitor.ip ? "reuse" : "used";
}

export interface MemberLike {
  id: string;
  userId: string | null;
  joinedAt: Date;
}

/**
 * Next host when the host leaves (SALLE-08): the signed-in person present the
 * longest. Guests cannot host (AUTH-03). `null` means the room closes.
 */
export function pickNextHost<T extends MemberLike>(members: readonly T[], leavingId: string) {
  return (
    [...members]
      .filter((m) => m.id !== leavingId && m.userId !== null)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0] ?? null
  );
}

/** Participants count toward capacity, bots included; spectators do not (SALLE-05). */
export function countParticipants(
  members: readonly { role: "PARTICIPANT" | "SPECTATOR" }[],
  botCount: number
): number {
  return members.filter((m) => m.role === "PARTICIPANT").length + botCount;
}

export interface QuickRaceCandidate {
  code: string;
  phase: RoomPhase;
  participants: number;
  capacity: number;
  createdAt: Date;
}

/**
 * Quick race (JOIN-03): among joinable public rooms that are not full, the
 * one closest to its capacity (fewest free seats); ties go to the oldest room.
 */
export function pickQuickRace(rooms: readonly QuickRaceCandidate[]): string | null {
  const open = rooms.filter((r) => isJoinable(r.phase) && r.participants < r.capacity);
  open.sort(
    (a, b) =>
      a.capacity - a.participants - (b.capacity - b.participants) ||
      a.createdAt.getTime() - b.createdAt.getTime()
  );
  return open[0]?.code ?? null;
}

/** Client IP, trusting proxy headers only when the app runs behind one. */
export function clientIp(
  headers: Record<string, string | string[] | undefined>,
  socketAddress: string | undefined,
  trustProxy: boolean
): string {
  if (trustProxy) {
    const first = (value: string | string[] | undefined) =>
      (Array.isArray(value) ? value[0] : value)?.split(",")[0]?.trim();
    const forwarded = first(headers["fly-client-ip"]) ?? first(headers["x-forwarded-for"]);
    if (forwarded) return forwarded;
  }
  return socketAddress ?? "unknown";
}
