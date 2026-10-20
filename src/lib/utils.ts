import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates typing statistics
 * Standard WPM formula: (characters typed / 5) / (time in minutes)
 */
export function calculateWpm(correctChars: number, timeElapsedSec: number): number {
  if (timeElapsedSec <= 0) return 0;
  const words = correctChars / 5;
  const minutes = timeElapsedSec / 60;
  return Math.round((words / minutes) * 10) / 10;
}

/**
 * Calculates typing accuracy percentage
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  const accuracy = (correctChars / totalChars) * 100;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

/**
 * Counts characters of `typed` that match `target` at the same position.
 */
export function countCorrectChars(typed: string, target: string): number {
  let count = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) count++;
  }
  return count;
}
