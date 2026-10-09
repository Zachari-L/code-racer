import { describe, expect, it } from "bun:test";
import {
  createTranslator,
  formatOrdinal,
  formatRelativeTime,
  isTranslationKey,
  negotiateLocale,
  translateZodError,
} from "@/lib/i18n";
import { fr } from "@/lib/i18n/messages/fr";
import { en } from "@/lib/i18n/messages/en";
import { joinLobbySchema } from "@/lib/validations/race";
import { registerSchema } from "@/lib/validations/auth";

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe("Dictionaries", () => {
  it("define the same keys in every locale", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it("use the same interpolation placeholders in every locale", () => {
    for (const key of Object.keys(fr) as (keyof typeof fr)[]) {
      expect({ key, params: placeholders(en[key]) }).toEqual({
        key,
        params: placeholders(fr[key]),
      });
    }
  });

  it("have no empty translations", () => {
    for (const value of [...Object.values(fr), ...Object.values(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Translator", () => {
  it("translates and interpolates parameters", () => {
    expect(createTranslator("en")("footer.text", { year: 2026 })).toBe(
      "CodeRacer © 2026 — Designed for classrooms and coding enthusiasts."
    );
    expect(createTranslator("fr")("nav.lobbies")).toBe("Salons");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(createTranslator("en")("footer.text")).toContain("{year}");
  });

  it("recognizes translation keys", () => {
    expect(isTranslationKey("nav.lobbies")).toBe(true);
    expect(isTranslationKey("nav.nope")).toBe(false);
    expect(isTranslationKey("toString")).toBe(false);
  });
});

describe("Locale negotiation", () => {
  it("picks the highest-ranked supported language", () => {
    expect(negotiateLocale("en-US,en;q=0.9,fr;q=0.8")).toBe("en");
    expect(negotiateLocale("de-DE,fr;q=0.5,en;q=0.7")).toBe("en");
    expect(negotiateLocale("fr-CA")).toBe("fr");
  });

  it("falls back to French", () => {
    expect(negotiateLocale(null)).toBe("fr");
    expect(negotiateLocale("de,es;q=0.9")).toBe("fr");
    expect(negotiateLocale("en;q=0")).toBe("fr");
  });
});

describe("Formatting", () => {
  it("formats ordinals per locale", () => {
    expect([1, 2, 3, 4, 11, 21, 22, 23].map((n) => formatOrdinal("en", n))).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "21st",
      "22nd",
      "23rd",
    ]);
    expect([1, 2, 10].map((n) => formatOrdinal("fr", n))).toEqual(["1er", "2e", "10e"]);
  });

  it("formats relative times", () => {
    const now = Date.parse("2026-01-10T12:00:00Z");
    expect(formatRelativeTime("en", new Date(now - 2 * 3_600_000), now)).toBe("2 hours ago");
    expect(formatRelativeTime("fr", new Date(now - 24 * 3_600_000), now)).toBe("hier");
  });
});

describe("Validation messages", () => {
  it("are translation keys translated per locale", () => {
    const result = joinLobbySchema.safeParse({ code: "12", nickname: "Ace" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(translateZodError(createTranslator("en"), result.error, "errors.invalidParams")).toBe(
      "The lobby code must be exactly 6 digits"
    );
    expect(translateZodError(createTranslator("fr"), result.error, "errors.invalidParams")).toBe(
      "Le code de salon doit comporter exactement 6 chiffres"
    );
  });

  it("fall back when Zod uses a built-in message", () => {
    const result = registerSchema.safeParse({ username: 42, password: "secret123" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(translateZodError(createTranslator("en"), result.error, "errors.invalidData")).toBe(
      "Invalid data"
    );
  });
});
