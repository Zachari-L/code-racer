import { describe, expect, it } from "bun:test";
import { createRateLimiter } from "@/lib/rate-limit";

describe("Rate limiter (SALLE-10)", () => {
  it("allows up to the limit within the window, per key", () => {
    const limiter = createRateLimiter(3, 60000);
    expect([1, 2, 3, 4].map(() => limiter.attempt("ip-a", 0))).toEqual([true, true, true, false]);
    expect(limiter.attempt("ip-b", 0)).toBe(true);
  });

  it("frees attempts as the window slides", () => {
    const limiter = createRateLimiter(2, 60000);
    limiter.attempt("ip", 0);
    limiter.attempt("ip", 30000);
    expect(limiter.attempt("ip", 59000)).toBe(false);
    expect(limiter.retryAfterMs("ip", 59000)).toBe(1000);
    expect(limiter.attempt("ip", 60000)).toBe(true);
  });
});
