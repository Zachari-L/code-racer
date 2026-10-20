/**
 * Keystroke engine shared by the server (authoritative), the client (instant
 * feedback) and bots. Formulas follow Annex A of the specification:
 * - net WPM = (correctly typed characters / 5) / minutes
 * - raw WPM = (typed characters / 5) / minutes
 * - accuracy = correct keystrokes / keystrokes * 100
 * - progress = validated characters / text length (spaces count)
 */

import { calculateAccuracy, calculateWpm, countCorrectChars } from "@/lib/utils";
import type { ErrorMode } from "./config";

/** `c` types one character, `b` is a backspace. */
export type KeyInput = { k: "c"; c: string } | { k: "b" };

export interface TypingState {
  typed: string;
  /** Character keystrokes (backspaces excluded). */
  keystrokes: number;
  correctKeystrokes: number;
  /** Wrong keystrokes; each one counts as an error even if corrected later. */
  errors: number;
  /** Expected character -> number of times it was missed (heatmap, RES-03). */
  missedKeys: Record<string, number>;
}

export function createTypingState(): TypingState {
  return { typed: "", keystrokes: 0, correctKeystrokes: 0, errors: 0, missedKeys: {} };
}

/**
 * Applies one key. In STRICT mode a wrong character is counted but not
 * inserted, so the player cannot advance until they type the right one
 * (CONF-08). In FREE mode it is inserted and the player may go on.
 */
export function applyKey(
  state: TypingState,
  text: string,
  key: KeyInput,
  errorMode: ErrorMode
): TypingState {
  if (key.k === "b") {
    return state.typed.length === 0 ? state : { ...state, typed: state.typed.slice(0, -1) };
  }
  if (state.typed.length >= text.length) return state;

  const expected = text[state.typed.length];
  const correct = key.c === expected;
  const next: TypingState = {
    ...state,
    keystrokes: state.keystrokes + 1,
    correctKeystrokes: state.correctKeystrokes + (correct ? 1 : 0),
  };
  if (!correct) {
    const missed = expected === " " ? "space" : expected.toLowerCase();
    next.errors = state.errors + 1;
    next.missedKeys = { ...state.missedKeys, [missed]: (state.missedKeys[missed] ?? 0) + 1 };
    if (errorMode === "STRICT") return next;
  }
  next.typed = state.typed + key.c;
  return next;
}

export function applyKeys(
  state: TypingState,
  text: string,
  keys: readonly KeyInput[],
  errorMode: ErrorMode
): TypingState {
  return keys.reduce((current, key) => applyKey(current, text, key, errorMode), state);
}

export function typingProgress(state: TypingState, text: string): number {
  return text.length === 0 ? 1 : Math.min(1, state.typed.length / text.length);
}

export function isTextComplete(state: TypingState, text: string): boolean {
  return state.typed.length >= text.length;
}

export interface RaceStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  errors: number;
  progress: number;
}

export function computeRaceStats(state: TypingState, text: string, elapsedMs: number): RaceStats {
  const elapsedSec = elapsedMs / 1000;
  const correctChars = countCorrectChars(state.typed, text);
  return {
    wpm: calculateWpm(correctChars, elapsedSec),
    rawWpm: calculateWpm(state.keystrokes, elapsedSec),
    accuracy: calculateAccuracy(state.correctKeystrokes, state.keystrokes),
    correctChars,
    errors: state.errors,
    progress: typingProgress(state, text),
  };
}

/**
 * Text after a bonus edit: keeps what was already typed valid by trimming the
 * typed buffer if the new text is shorter (BONUS-04).
 */
export function retargetText(state: TypingState, newText: string): TypingState {
  return state.typed.length <= newText.length
    ? state
    : { ...state, typed: state.typed.slice(0, newText.length) };
}

/**
 * Token bucket limiting typed characters (COURSE-06). 25 chars/s is 300 WPM,
 * above any human record over a race; the burst absorbs network batching.
 */
export const MAX_CHARS_PER_SECOND = 25;
export const MAX_CHAR_BURST = 20;

export interface RateBucket {
  tokens: number;
  updatedAt: number;
}

export function createRateBucket(now: number): RateBucket {
  return { tokens: MAX_CHAR_BURST, updatedAt: now };
}

/** Returns the updated bucket, or `null` if `chars` exceeds the allowed rate. */
export function consumeChars(bucket: RateBucket, chars: number, now: number): RateBucket | null {
  const refill = ((now - bucket.updatedAt) / 1000) * MAX_CHARS_PER_SECOND;
  const tokens = Math.min(MAX_CHAR_BURST, bucket.tokens + refill);
  if (chars > tokens) return null;
  return { tokens: tokens - chars, updatedAt: now };
}
