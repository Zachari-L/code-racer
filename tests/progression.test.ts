import { describe, expect, it } from "bun:test";
import { calculateDriverLevel, getDriverTitleKey } from "../src/lib/progression";

describe("Driver progression", () => {
  it("starts at level 1 for new drivers", () => {
    expect(calculateDriverLevel(0, 0)).toBe(1);
  });

  it("calculates progression based on completed races and victories", () => {
    // 5 races, 0 wins -> floor(5 / 5) + 1 = 2
    expect(calculateDriverLevel(5, 0)).toBe(2);
    // 10 races, 5 wins -> floor((10 + 10) / 5) + 1 = 5
    expect(calculateDriverLevel(10, 5)).toBe(5);
    // 50 races, 25 wins -> floor((50 + 50) / 5) + 1 = 21
    expect(calculateDriverLevel(50, 25)).toBe(21);
  });

  it("assigns appropriate prestige titles according to level", () => {
    expect(getDriverTitleKey(1)).toBe("title.apprentice");
    expect(getDriverTitleKey(3)).toBe("title.speedDriver");
    expect(getDriverTitleKey(7)).toBe("title.trackAce");
    expect(getDriverTitleKey(12)).toBe("title.keyVirtuoso");
    expect(getDriverTitleKey(18)).toBe("title.legend");
  });
});
