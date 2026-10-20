/**
 * Bot typists. A bot is a scheduled stream of keystrokes fed into the same
 * typing engine as humans, so its stats, ranking and bonuses follow the same
 * rules (BOT-04). Everything random comes from a seeded RNG: the same seed,
 * text and timeline always produce the same race (BOT-05).
 */

import type { BotLevel, ErrorMode } from "./config";
import { createRng, randomBetween, type Rng } from "./random";
import { applyKey, createTypingState, isTextComplete, type TypingState } from "./typing";

export interface BotProfile {
  minWpm: number;
  maxWpm: number;
  /** Probability that a keystroke is wrong. */
  errorRate: number;
}

/** Documented bot levels (BOT-01). */
export const BOT_PROFILES: Record<BotLevel, BotProfile> = {
  NOOB: { minWpm: 10, maxWpm: 20, errorRate: 0.12 },
  BEGINNER: { minWpm: 20, maxWpm: 35, errorRate: 0.08 },
  INTERMEDIATE: { minWpm: 35, maxWpm: 60, errorRate: 0.05 },
  EXPERT: { minWpm: 70, maxWpm: 100, errorRate: 0.02 },
  IMPOSSIBLE: { minWpm: 145, maxWpm: 175, errorRate: 0.005 },
};

const WRONG_KEYS = "etaoinsrhldcu";

export interface BotState {
  level: BotLevel;
  rng: Rng;
  /** Target speed drawn once per race inside the level's range. */
  baseWpm: number;
  /** Slow drift of the bot's form during the race (0.85 to 1.15). */
  mood: number;
  /** Speed factor of the current word (difficulty and random variation). */
  wordFactor: number;
  /** Next keystroke time, in ms on the race clock. */
  nextKeyAt: number;
  /** STRICT mode: the last keystroke was wrong and must be retyped. */
  mustCorrect: boolean;
  typing: TypingState;
}

export function createBot(level: BotLevel, seed: number, startAt = 0): BotState {
  const rng = createRng(seed);
  const profile = BOT_PROFILES[level];
  return {
    level,
    rng,
    baseWpm: randomBetween(rng, profile.minWpm, profile.maxWpm),
    mood: 1,
    wordFactor: 1,
    nextKeyAt: startAt + randomBetween(rng, 200, 600),
    mustCorrect: false,
    typing: createTypingState(),
  };
}

/** How much slower a word is to type: long words, capitals, digits and symbols. */
export function wordDifficulty(word: string): number {
  let factor = 1 + 0.06 * Math.max(0, word.length - 5);
  if (/[A-Z]/.test(word)) factor += 0.1;
  if (/[^\p{L}]/u.test(word)) factor += 0.25;
  return factor;
}

function currentWord(text: string, index: number): string {
  const end = text.indexOf(" ", index);
  return text.slice(index, end === -1 ? undefined : end);
}

/**
 * Keystroke rhythm is faster than the target speed: hesitations, hard words and
 * errors cost about a quarter of it, so the measured net WPM lands in range.
 */
const RHYTHM_CALIBRATION = 0.76;

function msPerChar(bot: BotState): number {
  return (60000 / (bot.baseWpm * 5)) * RHYTHM_CALIBRATION;
}

/**
 * Advances the bot to `now` (race clock, ms) and returns its new state.
 * `slowdown` > 1 slows it down, e.g. while blinded by a fog bonus.
 */
export function stepBot(
  bot: BotState,
  text: string,
  now: number,
  errorMode: ErrorMode,
  slowdown = 1
): BotState {
  const next = { ...bot };
  const profile = BOT_PROFILES[bot.level];

  while (next.nextKeyAt <= now && !isTextComplete(next.typing, text)) {
    const index = next.typing.typed.length;
    const expected = text[index];

    if (!next.mustCorrect && (index === 0 || text[index - 1] === " ")) {
      // New word: accelerate or slow down, sometimes hesitate (BOT-02).
      next.mood = Math.min(1.15, Math.max(0.85, next.mood + randomBetween(next.rng, -0.08, 0.08)));
      next.wordFactor =
        wordDifficulty(currentWord(text, index)) * randomBetween(next.rng, 0.8, 1.25);
      if (next.rng() < 0.06) next.nextKeyAt += randomBetween(next.rng, 250, 900);
    }

    const makesError = !next.mustCorrect && next.rng() < profile.errorRate;
    const wrong = WRONG_KEYS.replace(expected, "")[Math.floor(next.rng() * 12)];
    next.typing = applyKey(
      next.typing,
      text,
      { k: "c", c: makesError ? wrong : expected },
      errorMode
    );
    next.mustCorrect = makesError && errorMode === "STRICT";

    const interval = (msPerChar(next) * next.wordFactor * slowdown) / next.mood;
    // An error costs a reaction delay: retyping in STRICT mode, a stumble in FREE mode (BOT-03).
    const penalty = makesError
      ? randomBetween(
          next.rng,
          errorMode === "STRICT" ? 250 : 80,
          errorMode === "STRICT" ? 600 : 250
        )
      : 0;
    next.nextKeyAt += interval + penalty;
  }
  return next;
}
