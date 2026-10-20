"use server";

import { TICKET_TTL_MS, type RealtimeTicket } from "@/lib/identity";
import { getAuthSecret, signPayload } from "@/lib/signing";
import { getCurrentIdentity } from "@/server/identity";

/**
 * Short-lived signed ticket proving the caller's identity to the WebSocket
 * server, which cannot read Auth.js sessions itself. `null` for visitors
 * without an account or guest pseudonym (they can still browse the explorer).
 */
export async function getRealtimeTicket(): Promise<
  { success: true; ticket: string | null } | { success: false; error: string }
> {
  const identity = await getCurrentIdentity();
  if (!identity) return { success: true, ticket: null };
  const ticket: RealtimeTicket = { ...identity, exp: Date.now() + TICKET_TTL_MS };
  return { success: true, ticket: signPayload(ticket, getAuthSecret()) };
}
