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
 * Generates a 6-digit lobby code
 */
export function generateLobbyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
