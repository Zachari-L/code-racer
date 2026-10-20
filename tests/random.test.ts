import { describe, expect, it } from "bun:test";
import { createRng, hashString, pick, randomInt } from "@/lib/game/random";

describe("Seeded RNG", () => {
  it("replays the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
  });

  it("produces different sequences for different seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("draws inclusive integers and picks list items", () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(randomInt(rng, 1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
    expect(["a", "b"]).toContain(pick(rng, ["a", "b"]));
  });

  it("hashes strings stably", () => {
    expect(hashString("bot-1")).toBe(hashString("bot-1"));
    expect(hashString("bot-1")).not.toBe(hashString("bot-2"));
  });
});
