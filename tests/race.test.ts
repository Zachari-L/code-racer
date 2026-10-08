import { describe, expect, test } from "bun:test";
import { createLobbySchema, joinLobbySchema } from "@/lib/validations/race";

describe("Lobby & Race State Rules (COURSE-1, COURSE-2, COURSE-5, CONFIG-7)", () => {
  test("validates compliant lobby creation input", () => {
    const payload = {
      visibility: "SEMI_PUBLIC",
      textLanguage: "fr",
      textCategory: "quotes",
      strictMode: false,
      maxDurationSec: 120,
      hostNickname: "Prof_Alice",
    };
    const parsed = createLobbySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  test("validates lobby joining input with 6-digit numeric code", () => {
    const payload = {
      code: "123456",
      nickname: "Eleve_Bob",
      isSpectator: false,
    };
    const parsed = joinLobbySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  test("rejects invalid lobby codes (not exactly 6 digits)", () => {
    const invalidCodes = ["123", "1234567", "ABCDEF", "12-345"];
    for (const code of invalidCodes) {
      const parsed = joinLobbySchema.safeParse({
        code,
        nickname: "Racer",
      });
      expect(parsed.success).toBe(false);
    }
  });

  test("spectator role selection is properly captured on join", () => {
    const payload = {
      code: "987654",
      nickname: "Spectateur_Curieux",
      isSpectator: true,
    };
    const parsed = joinLobbySchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isSpectator).toBe(true);
    }
  });
});
