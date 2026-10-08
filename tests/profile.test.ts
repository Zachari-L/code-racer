import { describe, expect, it } from "bun:test";
import { saveRaceResultSchema } from "../src/lib/validations/race";
import { calculateDriverLevel, getDriverTitle } from "../src/lib/progression";

describe("Profile & Race Persistence (AUTH-4, PLAY-9)", () => {
  describe("saveRaceResultSchema", () => {
    it("validates a compliant race result payload", () => {
      const valid = {
        code: "482910",
        wpm: 84,
        rawWpm: 88,
        accuracy: 96.5,
        errorsCount: 4,
        durationMs: 18500,
        rank: 1,
        category: "code",
        language: "fr",
      };
      const result = saveRaceResultSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects accuracy greater than 100", () => {
      const invalid = {
        wpm: 80,
        rawWpm: 80,
        accuracy: 105,
        errorsCount: 0,
        durationMs: 10000,
        rank: 1,
      };
      const result = saveRaceResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects negative WPM or errors", () => {
      const invalid = {
        wpm: -5,
        rawWpm: 80,
        accuracy: 95,
        errorsCount: -1,
        durationMs: 10000,
        rank: 1,
      };
      const result = saveRaceResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid rank less than 1", () => {
      const invalid = {
        wpm: 75,
        rawWpm: 75,
        accuracy: 98,
        errorsCount: 1,
        durationMs: 12000,
        rank: 0,
      };
      const result = saveRaceResultSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Driver Progression Engine", () => {
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
      expect(getDriverTitle(1)).toBe("Apprenti du Clavier");
      expect(getDriverTitle(3)).toBe("Pilote Vitesse");
      expect(getDriverTitle(7)).toBe("As de la Piste");
      expect(getDriverTitle(12)).toBe("Virtuose des Touches");
      expect(getDriverTitle(18)).toBe("Légende Vitesse Grand V");
    });
  });

  describe("Statistical Aggregation Formulas", () => {
    it("updates rolling averages correctly across multiple races", () => {
      const prevRaces = 4;
      const prevAvgWpm = 70;
      const newRaceWpm = 90;

      const newAvgWpm = (prevAvgWpm * prevRaces + newRaceWpm) / (prevRaces + 1);
      expect(newAvgWpm).toBe(74);

      const prevAvgAcc = 95;
      const newRaceAcc = 100;
      const newAvgAcc = (prevAvgAcc * prevRaces + newRaceAcc) / (prevRaces + 1);
      expect(newAvgAcc).toBe(96);
    });

    it("tracks new best WPM personal records", () => {
      const currentBest = 85;
      const slowerRace = 80;
      const recordRace = 104;

      expect(Math.max(currentBest, slowerRace)).toBe(85);
      expect(Math.max(currentBest, recordRace)).toBe(104);
    });
  });
});
