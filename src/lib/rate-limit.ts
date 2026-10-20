/**
 * In-memory sliding-window rate limiter. The app runs as a single server
 * process (see docs/ARCHITECTURE.md), so memory is a valid store.
 */

export interface RateLimiter {
  /** Records an attempt for `key`; returns false if the limit is already reached. */
  attempt(key: string, now?: number): boolean;
  /** Milliseconds until `key` may try again (0 if allowed now). */
  retryAfterMs(key: string, now?: number): number;
}

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const attempts = new Map<string, number[]>();

  function recent(key: string, now: number): number[] {
    const kept = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
    if (kept.length > 0) attempts.set(key, kept);
    else attempts.delete(key);
    return kept;
  }

  return {
    attempt(key, now = Date.now()) {
      const kept = recent(key, now);
      if (kept.length >= limit) return false;
      attempts.set(key, [...kept, now]);
      return true;
    },
    retryAfterMs(key, now = Date.now()) {
      const kept = recent(key, now);
      return kept.length < limit ? 0 : windowMs - (now - kept[0]);
    },
  };
}

/** Room code attempts per IP (SALLE-10). */
export const ROOM_CODE_ATTEMPTS_PER_MINUTE = 10;
