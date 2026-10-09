/**
 * Driver progression and prestige leveling engine for CodeRacer
 */

import type { TranslationKey } from "@/lib/i18n";

export function calculateDriverLevel(totalRaces: number, totalWins: number): number {
  return Math.max(1, Math.floor((totalRaces + totalWins * 2) / 5) + 1);
}

/** Translation key of the prestige title earned at `level`. */
export function getDriverTitleKey(level: number): TranslationKey {
  if (level <= 2) return "title.apprentice";
  if (level <= 5) return "title.speedDriver";
  if (level <= 9) return "title.trackAce";
  if (level <= 14) return "title.keyVirtuoso";
  return "title.legend";
}
