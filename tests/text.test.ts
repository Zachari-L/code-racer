import { describe, expect, it } from "bun:test";
import { DEFAULT_ROOM_CONFIG } from "@/lib/game/config";
import { createRng } from "@/lib/game/random";
import {
  RANDOM_COMPLEXITY_RULES,
  appendWords,
  applyTextOptions,
  buildCoherentText,
  classifyPassage,
  countWords,
  generateRandomText,
  getWordPool,
  normalizeTypeable,
  removeTrailingWords,
  type Passage,
} from "@/lib/game/text";
import { EN_WORDS } from "@/lib/game/words/en";
import { FR_WORDS } from "@/lib/game/words/fr";

const random = {
  ...DEFAULT_ROOM_CONFIG,
  textMode: "RANDOM" as const,
  wordCount: 40,
};

describe("Dictionaries", () => {
  it("contain unique lowercase words", () => {
    for (const list of [FR_WORDS, EN_WORDS]) {
      expect(new Set(list).size).toBe(list.length);
      for (const word of list) expect(word).toBe(word.toLowerCase());
    }
  });
});

describe("Random texts (CONF-03, CONF-04)", () => {
  it("has the requested number of words", () => {
    expect(countWords(generateRandomText(random, createRng(1)))).toBe(40);
  });

  it("is deterministic for a seed", () => {
    expect(generateRandomText(random, createRng(9))).toBe(generateRandomText(random, createRng(9)));
  });

  it("respects the complexity word rules (CONF-05)", () => {
    for (const complexity of ["EASY", "MEDIUM", "HARD"] as const) {
      const rules = RANDOM_COMPLEXITY_RULES[complexity];
      for (const word of getWordPool({ ...random, complexity })) {
        expect(word.length).toBeGreaterThanOrEqual(rules.minLength);
        expect(word.length).toBeLessThanOrEqual(rules.maxLength);
      }
    }
  });

  it("honours punctuation, numbers, capitals and accents switches (CONF-06)", () => {
    const text = generateRandomText(
      { ...random, punctuation: false, numbers: false, capitals: false, accents: false },
      createRng(4)
    );
    expect(text).toMatch(/^[a-z' -]+$/);
  });

  it("adds numbers when enabled", () => {
    const text = generateRandomText({ ...random, numbers: true, wordCount: 150 }, createRng(2));
    expect(text).toMatch(/\d/);
  });

  it("applies include and exclude filters (CONF-07)", () => {
    const excluded = generateRandomText({ ...random, excludeChars: "ea" }, createRng(3));
    expect(excluded.toLowerCase()).not.toMatch(/[ea]/);
    const included = getWordPool({ ...random, includeChars: "z" });
    for (const word of included) expect(word).toContain("z");
  });

  it("falls back to the full tier when filters exclude every word", () => {
    expect(getWordPool({ ...random, excludeChars: "aeiouyé" }).length).toBeGreaterThan(0);
  });
});

describe("Text options on passages", () => {
  const options = {
    language: "fr" as const,
    punctuation: true,
    numbers: true,
    capitals: true,
    accents: true,
  };

  it("normalizes typographic characters", () => {
    expect(normalizeTypeable("« L’été… »  —  fin")).toBe('"L\'été..." - fin');
  });

  it("strips punctuation but keeps apostrophes inside words", () => {
    expect(applyTextOptions("C'est fini, enfin !", { ...options, punctuation: false })).toBe(
      "C'est fini enfin"
    );
  });

  it("removes numbers, capitals and accents", () => {
    expect(
      applyTextOptions("En 1872, Phileas était là.", {
        ...options,
        numbers: false,
        capitals: false,
        accents: false,
      })
    ).toBe("en phileas etait la.");
  });
});

describe("Passage complexity (CONF-05)", () => {
  it("classifies short plain sentences as easy and long technical ones as hard", () => {
    expect(classifyPassage("le chat est sur le mur et il dort au soleil")).toBe("EASY");
    expect(
      classifyPassage(
        "Particulièrement, l'administration gouvernementale reconnaît l'extraordinaire responsabilité."
      )
    ).toBe("HARD");
  });
});

describe("Coherent texts", () => {
  const passages: Passage[] = [
    { id: "a", language: "fr", complexity: "EASY", content: "un deux trois quatre cinq six" },
    { id: "b", language: "en", complexity: "HARD", content: "one two three four five six" },
  ];

  it("picks a passage in the language and cuts it to the word count", () => {
    const result = buildCoherentText(passages, { ...random, wordCount: 3 }, createRng(1));
    expect(result).toEqual({ passageId: "a", text: "un deux trois" });
  });

  it("falls back to another complexity in the same language", () => {
    const result = buildCoherentText(
      passages,
      { ...random, language: "en", complexity: "EASY" },
      createRng(1)
    );
    expect(result?.passageId).toBe("b");
  });

  it("returns null when the language has no passage", () => {
    expect(buildCoherentText([], random, createRng(1))).toBeNull();
  });
});

describe("Bonus word edits (BONUS-02)", () => {
  it("appends words", () => {
    expect(countWords(appendWords("a b", random, 3, createRng(1)))).toBe(5);
  });

  it("removes trailing words but never the word being typed", () => {
    const text = "one two three four five";
    expect(removeTrailingWords(text, 0, 3)).toEqual({ text: "one two", removed: 3 });
    // Cursor inside "four": only "five" can go.
    expect(removeTrailingWords(text, 15, 3)).toEqual({ text: "one two three four", removed: 1 });
    expect(removeTrailingWords(text, 21, 3)).toEqual({ text, removed: 0 });
  });
});
