import { describe, expect, it } from "bun:test";
import { calculateWpm, calculateAccuracy, countCorrectChars } from "../src/lib/utils";

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

  it("counts position-matching characters, including partial input", () => {
    expect(countCorrectChars("hellp", "hello")).toBe(4);
    expect(countCorrectChars("he", "hello")).toBe(2);
    expect(countCorrectChars("", "hello")).toBe(0);
  });
});
