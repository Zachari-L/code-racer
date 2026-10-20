/**
 * Who is playing: a signed-in user or a guest with a pseudonym (AUTH-02).
 * Shared by Next.js and the realtime server.
 */

import { z } from "zod";
import { i18nKey } from "@/lib/i18n";

export const GUEST_COOKIE = "coderacer_guest";
export const GUEST_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export const nicknameSchema = z
  .string()
  .trim()
  .min(3, i18nKey("validation.nicknameMin"))
  .max(20, i18nKey("validation.nicknameMax"))
  .regex(/^[\p{L}\p{N} _-]+$/u, i18nKey("validation.nicknameChars"));

export const guestSessionSchema = z.object({
  id: z.string().regex(/^g_[\w-]{10,}$/),
  nickname: nicknameSchema,
});
export type GuestSession = z.infer<typeof guestSessionSchema>;

export const identitySchema = z.object({
  kind: z.enum(["user", "guest"]),
  id: z.string().min(1),
  name: z.string().min(1).max(40),
});
export type Identity = z.infer<typeof identitySchema>;

/** Realtime connection ticket: an identity valid for a short time. */
export const ticketSchema = identitySchema.extend({ exp: z.number() });
export type RealtimeTicket = z.infer<typeof ticketSchema>;
export const TICKET_TTL_MS = 60_000;

export function identityKey(identity: Pick<Identity, "kind" | "id">): string {
  return `${identity.kind}:${identity.id}`;
}
