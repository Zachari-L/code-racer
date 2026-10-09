import { DEFAULT_LOCALE, type Locale } from "./config";
import { en } from "./messages/en";
import { fr, type TranslationKey } from "./messages/fr";

export type { TranslationKey };

export type TranslationParams = Record<string, string | number>;

export type Translator = (key: TranslationKey, params?: TranslationParams) => string;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { fr, en };

export function isTranslationKey(value: unknown): value is TranslationKey {
  return typeof value === "string" && Object.hasOwn(fr, value);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

export function createTranslator(locale: Locale): Translator {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return (key, params) => interpolate(dict[key] ?? fr[key] ?? key, params);
}

const ordinalRules = new Map<Locale, Intl.PluralRules>();

/** Formats a rank as a localized ordinal: 1 → "1er" / "1st", 2 → "2e" / "2nd". */
export function formatOrdinal(locale: Locale, n: number): string {
  let rules = ordinalRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale, { type: "ordinal" });
    ordinalRules.set(locale, rules);
  }
  const category = rules.select(n);
  const key: TranslationKey =
    category === "one" || category === "two" || category === "few"
      ? `ordinal.${category}`
      : "ordinal.other";
  return createTranslator(locale)(key, { n });
}

/** "février 2025" / "February 2025" */
export function formatMonthYear(locale: Locale, date: Date | string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(date));
}

/** "il y a 5 minutes" / "5 minutes ago", "hier" / "yesterday"; falls back to a short date after a week. */
export function formatRelativeTime(locale: Locale, date: Date | string, now = Date.now()): string {
  const then = new Date(date);
  const diffSec = Math.round((then.getTime() - now) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSec < 60) return rtf.format(0, "second");
  if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (absSec < 7 * 86400) return rtf.format(Math.round(diffSec / 86400), "day");
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(then);
}

/**
 * Translates the first Zod issue. Schemas use translation keys as messages;
 * built-in Zod messages (no custom key) fall back to `fallbackKey`.
 */
export function translateZodError(
  t: Translator,
  error: { issues: readonly { message: string }[] },
  fallbackKey: TranslationKey
): string {
  const message = error.issues[0]?.message;
  return t(isTranslationKey(message) ? message : fallbackKey);
}

/** Marks a string as a translation key at compile time, e.g. for Zod schema messages. */
export function i18nKey(key: TranslationKey): TranslationKey {
  return key;
}
