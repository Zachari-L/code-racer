import { describe, expect, it } from "bun:test";
import { BADGES, BADGE_CODES, getEarnedBadges, toBadgeRecord } from "@/lib/badges";

const NEUTRAL = { wpm: 30, accuracy: 90, rank: 3, totalRaces: 2 };

function earnedCodes(ctx: Partial<typeof NEUTRAL>) {
  return getEarnedBadges({ ...NEUTRAL, ...ctx }).map((b) => b.code);
}

describe("Badge registry", () => {
  it("has unique codes", () => {
    expect(new Set(BADGE_CODES).size).toBe(BADGES.length);
  });

  it("awards only the first-race badge for an unremarkable race", () => {
    expect(earnedCodes({})).toEqual(["FIRST_RACE"]);
  });

  it("awards speed badges at 50 and 100 WPM", () => {
    expect(earnedCodes({ wpm: 49 })).not.toContain("SPEED_50");
    expect(earnedCodes({ wpm: 50 })).toContain("SPEED_50");
    expect(earnedCodes({ wpm: 99 })).not.toContain("SPEED_100");
    expect(earnedCodes({ wpm: 100 })).toEqual(expect.arrayContaining(["SPEED_50", "SPEED_100"]));
  });

  it("awards perfect accuracy, first victory and veteran badges", () => {
    expect(earnedCodes({ accuracy: 100 })).toContain("PERFECT_ACCURACY");
    expect(earnedCodes({ rank: 1 })).toContain("FIRST_VICTORY");
    expect(earnedCodes({ totalRaces: 4 })).not.toContain("VETERAN_5");
    expect(earnedCodes({ totalRaces: 5 })).toContain("VETERAN_5");
  });

  it("builds DB records with default-locale strings", () => {
    const veteran = BADGES.find((b) => b.code === "VETERAN_5");
    expect(veteran && toBadgeRecord(veteran)).toEqual({
      code: "VETERAN_5",
      name: "Pilote Assidu",
      description: "Terminer 5 courses",
      iconName: "car",
    });
  });
});
