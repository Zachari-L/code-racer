/**
 * Race text production: random texts from the dictionaries, corpus passages
 * adapted to the room options, complexity measurement and the word edits used
 * by catch-up bonuses. All randomness goes through a seeded `Rng`.
 */

import type { Locale } from "@/lib/i18n";
import type { Complexity, RoomConfig } from "./config";
import { pick, randomInt, type Rng } from "./random";
import { EN_WORDS } from "./words/en";
import { FR_WORDS } from "./words/fr";

export const DICTIONARIES: Record<Locale, readonly string[]> = { fr: FR_WORDS, en: EN_WORDS };

export type TextOptions = Pick<
  RoomConfig,
  "language" | "punctuation" | "numbers" | "capitals" | "accents"
>;

export type RandomTextOptions = TextOptions &
  Pick<RoomConfig, "wordCount" | "complexity" | "includeChars" | "excludeChars">;

/**
 * Measurable complexity criteria for random texts (CONF-05): frequency rank in
 * the dictionary and word length.
 */
export const RANDOM_COMPLEXITY_RULES: Record<
  Complexity,
  { maxRank: number; minLength: number; maxLength: number }
> = {
  EASY: { maxRank: 150, minLength: 1, maxLength: 5 },
  MEDIUM: { maxRank: 320, minLength: 2, maxLength: 8 },
  HARD: { maxRank: Infinity, minLength: 5, maxLength: Infinity },
};

const PUNCTUATION = /[.,;:!?"()[\]{}]/g;

/** Converts typographic characters to their keyboard equivalents and collapses whitespace. */
export function normalizeTypeable(text: string): string {
  return text
    .replace(/[‘’`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/…/g, "...")
    .replace(/[–—]/g, "-")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "Oe")
    .replace(/æ/g, "ae")
    .replace(/[\s  ]+/g, " ")
    .replace(/" ([^"]*) "/g, '"$1"')
    .trim();
}

export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Applies the punctuation / numbers / capitals / accents switches (CONF-06).
 * Apostrophes and hyphens inside words are kept: they belong to the word.
 */
export function applyTextOptions(text: string, options: TextOptions): string {
  let result = normalizeTypeable(text);
  if (!options.punctuation) result = result.replace(PUNCTUATION, " ");
  if (!options.numbers) result = result.replace(/\S*\d\S*/g, " ");
  if (!options.capitals) result = result.toLowerCase();
  if (!options.accents && options.language === "fr") result = stripAccents(result);
  return result
    .replace(/(^|\s)['-]+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function truncateToWords(text: string, wordCount: number): string {
  return text.trim().split(/\s+/).slice(0, wordCount).join(" ");
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Dictionary words matching the complexity and character filters, in frequency order. */
export function getWordPool(
  options: Pick<
    RandomTextOptions,
    "language" | "complexity" | "accents" | "includeChars" | "excludeChars"
  >
): string[] {
  const rules = RANDOM_COMPLEXITY_RULES[options.complexity];
  const words = DICTIONARIES[options.language]
    .filter((_, rank) => rank < rules.maxRank)
    .map((word) => (options.accents ? word : stripAccents(word)));

  const matchesFilters = (word: string) =>
    (!options.excludeChars || ![...options.excludeChars].some((c) => word.includes(c))) &&
    (!options.includeChars || [...options.includeChars].some((c) => word.includes(c)));
  const matchesLength = (word: string) =>
    word.length >= rules.minLength && word.length <= rules.maxLength;

  const pool = words.filter((w) => matchesLength(w) && matchesFilters(w));
  if (pool.length > 0) return [...new Set(pool)];
  // Filters too strict for this tier: relax the length rule, then the filters.
  const relaxed = words.filter(matchesFilters);
  return [...new Set(relaxed.length > 0 ? relaxed : words)];
}

/** Random text made of dictionary words (CONF-03 "random"). */
export function generateRandomText(options: RandomTextOptions, rng: Rng): string {
  const pool = getWordPool(options);
  const numberRate = options.complexity === "HARD" ? 0.15 : 0.08;
  const maxNumber = options.complexity === "HARD" ? 9999 : 99;
  const endings = options.complexity === "HARD" ? [".", "!", "?", ";"] : ["."];

  const tokens: string[] = [];
  let sentenceLength = 0;
  let sentenceTarget = randomInt(rng, 5, 12);

  for (let i = 0; i < options.wordCount; i++) {
    let word =
      options.numbers && rng() < numberRate
        ? String(randomInt(rng, 1, maxNumber))
        : pick(rng, pool);

    const startsSentence = sentenceLength === 0;
    if (options.capitals && (startsSentence || rng() < 0.05)) word = capitalize(word);

    sentenceLength++;
    const isLast = i === options.wordCount - 1;
    if (options.punctuation) {
      if (isLast || sentenceLength >= sentenceTarget) {
        word += pick(rng, endings);
        sentenceLength = 0;
        sentenceTarget = randomInt(rng, 5, 12);
      } else if (rng() < 0.12) {
        word += ",";
      }
    }
    tokens.push(word);
  }
  return tokens.join(" ");
}

export interface PassageMetrics {
  averageWordLength: number;
  longWordRatio: number;
  specialCharRatio: number;
}

export function measurePassage(text: string): PassageMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const letters = words.map((w) => w.replace(/[^\p{L}]/gu, ""));
  const totalLetters = letters.reduce((sum, w) => sum + w.length, 0);
  const nonSpace = text.replace(/\s/g, "");
  const special = nonSpace.replace(/[a-z]/g, "").length;
  return {
    averageWordLength: words.length ? totalLetters / words.length : 0,
    longWordRatio: words.length ? letters.filter((w) => w.length >= 8).length / words.length : 0,
    specialCharRatio: nonSpace.length ? special / nonSpace.length : 0,
  };
}

/**
 * Complexity of a corpus passage (CONF-05), from its average word length, its
 * share of long words (8+ letters) and its share of "special" characters
 * (anything other than unaccented lowercase letters: capitals, accents,
 * punctuation, digits).
 */
export function classifyPassage(text: string): Complexity {
  const m = measurePassage(text);
  if (m.averageWordLength >= 5.2 || m.longWordRatio >= 0.2 || m.specialCharRatio >= 0.1) {
    return "HARD";
  }
  if (m.averageWordLength <= 4.4 && m.longWordRatio <= 0.1 && m.specialCharRatio <= 0.06) {
    return "EASY";
  }
  return "MEDIUM";
}

export interface Passage {
  id: string;
  language: Locale;
  complexity: Complexity;
  content: string;
}

/**
 * Coherent text (CONF-03): a random passage in the language, preferring the
 * requested complexity, cut to the requested length at a word boundary. A
 * passage shorter than the length is followed by other passages of the same
 * pool. Character include/exclude filters do not apply to coherent texts (CONF-07).
 */
export function buildCoherentText(
  passages: readonly Passage[],
  options: TextOptions & Pick<RoomConfig, "wordCount" | "complexity">,
  rng: Rng
): { passageId: string; text: string } | null {
  const inLanguage = passages.filter((p) => p.language === options.language);
  if (inLanguage.length === 0) return null;
  const sameComplexity = inLanguage.filter((p) => p.complexity === options.complexity);
  const pool = sameComplexity.length > 0 ? sameComplexity : inLanguage;

  const first = pick(rng, pool);
  const others = pool.filter((p) => p.id !== first.id);
  const parts = [applyTextOptions(first.content, options)];
  while (countWords(parts.join(" ")) < options.wordCount && others.length > 0) {
    const [next] = others.splice(Math.floor(rng() * others.length), 1);
    parts.push(applyTextOptions(next.content, options));
  }
  return { passageId: first.id, text: truncateToWords(parts.join(" "), options.wordCount) };
}

/** Appends `count` dictionary words (bonus "+3 words" on the leader). */
export function appendWords(
  text: string,
  options: RandomTextOptions,
  count: number,
  rng: Rng
): string {
  const pool = getWordPool(options);
  const extra = Array.from({ length: count }, () => pick(rng, pool));
  return `${text} ${extra.join(" ")}`;
}

/**
 * Removes up to `count` words from the end of `text`, never touching the word
 * being typed or the space right after it. Returns the shortened text and how
 * many words were removed.
 */
export function removeTrailingWords(
  text: string,
  typedLength: number,
  count: number
): { text: string; removed: number } {
  const starts: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== " " && (i === 0 || text[i - 1] === " ")) starts.push(i);
  }
  const removable = starts.filter((start) => start > typedLength);
  const removed = Math.min(count, removable.length);
  if (removed === 0) return { text, removed: 0 };
  const cut = removable[removable.length - removed];
  return { text: text.slice(0, cut).trimEnd(), removed };
}
