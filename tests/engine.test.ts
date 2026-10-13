import { describe, expect, it } from "bun:test";
import {
  calculateWpm,
  calculateAccuracy,
  computeTypingStats,
  countCorrectChars,
  generateLobbyCode,
} from "../src/lib/utils";

describe("CodeRacer Typing Engine Calculations", () => {
  it("calculates WPM accurately based on standard 5 characters per word formula", () => {
    // 250 characters typed correctly in 60 seconds = 50 words / 1 min = 50 WPM
    const wpm = calculateWpm(250, 60);
    expect(wpm).toBe(50);
  });

  it("handles 30 seconds elapsed time correctly", () => {
    // 150 characters in 30 seconds = 30 words / 0.5 min = 60 WPM
    const wpm = calculateWpm(150, 30);
    expect(wpm).toBe(60);
  });

  it("returns 0 WPM when no time elapsed", () => {
    const wpm = calculateWpm(100, 0);
    expect(wpm).toBe(0);
  });

  it("calculates accuracy percentage accurately", () => {
    // 95 correct out of 100 total characters = 95%
    const acc = calculateAccuracy(95, 100);
    expect(acc).toBe(95);
  });

  it("handles 0 total characters safely without division by zero", () => {
    const acc = calculateAccuracy(0, 0);
    expect(acc).toBe(100);
  });

  it("generates a valid 6-digit lobby code", () => {
    const code = generateLobbyCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("counts position-matching characters, including partial input", () => {
    expect(countCorrectChars("hellp", "hello")).toBe(4);
    expect(countCorrectChars("he", "hello")).toBe(2);
    expect(countCorrectChars("", "hello")).toBe(0);
  });

  it("computes integer race telemetry from typed input", () => {
    // 250 chars in 60s, 5 wrong: net 245/5 = 49 WPM, gross 50 WPM, 98% accuracy
    const target = "a".repeat(250);
    const typed = "b".repeat(5) + "a".repeat(245);
    expect(computeTypingStats(typed, target, 60)).toEqual({
      correctChars: 245,
      errorsCount: 5,
      wpm: 49,
      rawWpm: 50,
      accuracy: 98,
    });
  });

  it("reports a neutral state before any typing", () => {
    expect(computeTypingStats("", "hello", 0)).toEqual({
      correctChars: 0,
      errorsCount: 0,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
    });
  });
});
