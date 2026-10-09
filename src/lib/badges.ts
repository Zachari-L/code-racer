/**
 * Single source of truth for CodeRacer badges: codes, unlock rules, icons and
 * display strings. Used by the seed, `saveRaceResult` and the profile page.
 */

import { createTranslator, DEFAULT_LOCALE, type TranslationKey } from "@/lib/i18n";

/** Stats of a just-finished race, plus the driver's race count including it. */
export interface BadgeContext {
  wpm: number;
  accuracy: number;
  rank: number;
  totalRaces: number;
}

export interface BadgeDefinition {
  code: string;
  icon: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  isEarned: (ctx: BadgeContext) => boolean;
}

export const BADGES = [
  {
    code: "FIRST_RACE",
    icon: "🏁",
    titleKey: "badge.firstRace.title",
    descriptionKey: "badge.firstRace.desc",
    isEarned: (ctx) => ctx.totalRaces >= 1,
  },
  {
    code: "SPEED_50",
    icon: "💨",
    titleKey: "badge.speed50.title",
    descriptionKey: "badge.speed50.desc",
    isEarned: (ctx) => ctx.wpm >= 50,
  },
  {
    code: "SPEED_100",
    icon: "⚡",
    titleKey: "badge.speed100.title",
    descriptionKey: "badge.speed100.desc",
    isEarned: (ctx) => ctx.wpm >= 100,
  },
  {
    code: "PERFECT_ACCURACY",
    icon: "🎯",
    titleKey: "badge.perfectAccuracy.title",
    descriptionKey: "badge.perfectAccuracy.desc",
    isEarned: (ctx) => ctx.accuracy >= 100,
  },
  {
    code: "FIRST_VICTORY",
    icon: "🏆",
    titleKey: "badge.firstVictory.title",
    descriptionKey: "badge.firstVictory.desc",
    isEarned: (ctx) => ctx.rank === 1,
  },
  {
    code: "VETERAN_5",
    icon: "🏎️",
    titleKey: "badge.veteran5.title",
    descriptionKey: "badge.veteran5.desc",
    isEarned: (ctx) => ctx.totalRaces >= 5,
  },
] as const satisfies readonly BadgeDefinition[];

export type BadgeCode = (typeof BADGES)[number]["code"];

export const BADGE_CODES: readonly BadgeCode[] = BADGES.map((badge) => badge.code);

export function getEarnedBadges(ctx: BadgeContext): BadgeDefinition[] {
  return BADGES.filter((badge) => badge.isEarned(ctx));
}

/**
 * Row stored in the `Badge` table. The UI renders badges from this registry by
 * code; the stored name/description (default locale) are for DB tooling only.
 */
export function toBadgeRecord(badge: BadgeDefinition) {
  const t = createTranslator(DEFAULT_LOCALE);
  return {
    code: badge.code,
    name: t(badge.titleKey),
    description: t(badge.descriptionKey),
    iconName: badge.icon,
  };
}
