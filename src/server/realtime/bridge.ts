/**
 * Lets Server Actions reach the realtime hub. Both run in the same Node
 * process (server.ts), but Next.js bundles its own copy of every module, so
 * they meet through a `globalThis` slot instead of a shared import.
 */

import type { Identity } from "@/lib/identity";

export interface RealtimeBridge {
  /** Removes the person from their current room, abandoning any race. */
  leaveCurrentRoom(identity: Identity): Promise<void>;
  /** A room was created outside the hub: load it and refresh the explorer. */
  roomCreated(code: string): Promise<void>;
}

const slot = globalThis as typeof globalThis & { __coderacerRealtime?: RealtimeBridge };

export function setRealtimeBridge(bridge: RealtimeBridge) {
  slot.__coderacerRealtime = bridge;
}

export function getRealtimeBridge(): RealtimeBridge | undefined {
  return slot.__coderacerRealtime;
}
