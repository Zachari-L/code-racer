import { describe, expect, it } from "bun:test";
import {
  MAX_CHAR_BURST,
  applyKey,
  applyKeys,
  computeRaceStats,
  consumeChars,
  createRateBucket,
  createTypingState,
  isTextComplete,
  retargetText,
  type KeyInput,
} from "@/lib/game/typing";

const chars = (value: string): KeyInput[] => [...value].map((c) => ({ k: "c", c }));
const BACKSPACE: KeyInput = { k: "b" };

describe("Typing engine (COURSE-04, CONF-08)", () => {
  it("inserts wrong characters in FREE mode and counts the error", () => {
    const state = applyKeys(createTypingState(), "abc", chars("axc"), "FREE");
    expect(state.typed).toBe("axc");
    expect(state.errors).toBe(1);
    expect(state.missedKeys).toEqual({ b: 1 });
    expect(isTextComplete(state, "abc")).toBe(true);
  });

  it("blocks wrong characters in STRICT mode until corrected", () => {
    const state = applyKeys(createTypingState(), "abc", chars("axbc"), "STRICT");
    expect(state.typed).toBe("abc");
    expect(state.errors).toBe(1);
    expect(state.keystrokes).toBe(4);
  });

  it("handles backspace and never types past the end", () => {
    let state = applyKeys(createTypingState(), "ab", chars("ax"), "FREE");
    state = applyKey(state, "ab", BACKSPACE, "FREE");
    state = applyKeys(state, "ab", chars("bzz"), "FREE");
    expect(state.typed).toBe("ab");
    expect(applyKey(createTypingState(), "ab", BACKSPACE, "FREE").typed).toBe("");
  });

  it("records missed spaces under a readable key", () => {
    const state = applyKeys(createTypingState(), "a b", chars("ax"), "FREE");
    expect(state.missedKeys).toEqual({ space: 1 });
  });
});

describe("Race statistics (Annex A)", () => {
  it("computes net WPM, raw WPM, accuracy and progress", () => {
    const text = "a".repeat(100);
    // 50 keystrokes, 40 correct, typed in 12 seconds.
    const keys = chars("a".repeat(40) + "b".repeat(10));
    const stats = computeRaceStats(applyKeys(createTypingState(), text, keys, "FREE"), text, 12000);
    expect(stats.wpm).toBe(40); // (40 / 5) / 0.2 min
    expect(stats.rawWpm).toBe(50); // (50 / 5) / 0.2 min
    expect(stats.accuracy).toBe(80);
    expect(stats.progress).toBe(0.5);
    expect(stats.errors).toBe(10);
  });

  it("keeps accuracy after a corrected error", () => {
    let state = applyKeys(createTypingState(), "ab", chars("ax"), "FREE");
    state = applyKey(state, "ab", BACKSPACE, "FREE");
    state = applyKey(state, "ab", { k: "c", c: "b" }, "FREE");
    const stats = computeRaceStats(state, "ab", 1000);
    expect(stats.accuracy).toBeCloseTo(66.7, 1);
    expect(stats.correctChars).toBe(2);
  });

  it("stays consistent when a bonus shortens the text (BONUS-04)", () => {
    const state = applyKeys(createTypingState(), "abcdef", chars("abcd"), "FREE");
    const shorter = retargetText(state, "abc");
    expect(shorter.typed).toBe("abc");
    expect(computeRaceStats(shorter, "abc", 1000).progress).toBe(1);
  });
});

describe("Input rate limit (COURSE-06)", () => {
  it("allows a burst, then refills over time", () => {
    const bucket = createRateBucket(0);
    expect(consumeChars(bucket, MAX_CHAR_BURST + 1, 0)).toBeNull();
    const drained = consumeChars(bucket, MAX_CHAR_BURST, 0);
    expect(drained).not.toBeNull();
    expect(consumeChars(drained!, 1, 0)).toBeNull();
    expect(consumeChars(drained!, 5, 200)).not.toBeNull();
  });
});
