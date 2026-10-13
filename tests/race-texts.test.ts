import { describe, expect, it } from "bun:test";
import { RACE_TEXTS, getRaceText } from "@/lib/race-texts";
import { createLobbySchema } from "@/lib/validations/race";

const CATEGORIES = createLobbySchema.shape.textCategory.unwrap().options;

describe("Race text registry", () => {
  it("has unique ids", () => {
    expect(new Set(RACE_TEXTS.map((t) => t.id)).size).toBe(RACE_TEXTS.length);
  });

  it("has a French default for every lobby category", () => {
    for (const category of CATEGORIES) {
      const text = getRaceText(category, "fr");
      expect({ category, language: text.language }).toEqual({ category, language: "fr" });
      expect(text.category).toBe(category);
    }
  });

  it("uses the first matching text as the default", () => {
    expect(getRaceText("quotes", "fr").id).toBe("fr-quotes-courage");
    expect(getRaceText("code", "en").id).toBe("en-code-async-countdown");
  });

  it("falls back to French when a language has no text for the category", () => {
    expect(getRaceText("moliere", "en").id).toBe("fr-moliere-petit-chat");
  });

  it("contains only typeable, non-empty texts", () => {
    for (const text of RACE_TEXTS) {
      expect(text.content.trim().length).toBeGreaterThan(20);
      // The race input is a single-line <input>: newlines and tabs can never be typed.
      expect({ id: text.id, untypeable: /[\r\n\t]/.test(text.content) }).toEqual({
        id: text.id,
        untypeable: false,
      });
    }
  });
});
