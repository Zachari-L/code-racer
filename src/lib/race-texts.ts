/**
 * Single source of truth for the texts players race on. Used by `createLobby`,
 * the lobby preview and the seed (which mirrors them into `TextSnippet`).
 */

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { CreateLobbyInput } from "@/lib/validations/race";

export type RaceTextCategory = CreateLobbyInput["textCategory"];

export interface RaceText {
  /** Stable id, also used as the `TextSnippet` primary key by the seed. */
  id: string;
  title: string;
  content: string;
  language: Locale;
  category: RaceTextCategory;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

/**
 * The first text of each language/category pair is the one races use by default.
 * Texts must be single-line: the race input cannot type newlines.
 */
export const RACE_TEXTS: readonly RaceText[] = [
  {
    id: "fr-quotes-courage",
    title: "Citation — Le courage de continuer",
    content:
      "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    language: "fr",
    category: "quotes",
    difficulty: "EASY",
  },
  {
    id: "fr-code-calculate-wpm",
    title: "Code TypeScript — Calcul du WPM",
    content:
      "function calculateWpm(chars: number, minutes: number): number { return Math.round((chars / 5) / minutes); }",
    language: "fr",
    category: "code",
    difficulty: "HARD",
  },
  {
    id: "fr-moliere-petit-chat",
    title: "Molière — L'École des femmes",
    content:
      "Le petit chat est mort. Que voulez-vous que je dise de plus ? La fortune se joue ainsi de nos desseins.",
    language: "fr",
    category: "moliere",
    difficulty: "MEDIUM",
  },
  {
    id: "fr-sentences-bolides",
    title: "Phrases — Les bolides",
    content:
      "Les bolides rugissent sur la piste tandis que les doigts pianotent à la vitesse de l'éclair pour décrocher la victoire.",
    language: "fr",
    category: "sentences",
    difficulty: "MEDIUM",
  },
  {
    id: "fr-quotes-ligne-arrivee",
    title: "Citation — Motivation et Persévérance",
    content:
      "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte pour franchir la ligne d'arrivée.",
    language: "fr",
    category: "quotes",
    difficulty: "EASY",
  },
  {
    id: "fr-code-update-position",
    title: "Code TypeScript — Algorithme de Course",
    content:
      "function updatePosition(progress: number, wpm: number): { x: number; y: number } { return { x: progress * 10, y: Math.sin(progress) * 2 }; }",
    language: "fr",
    category: "code",
    difficulty: "HARD",
  },
  {
    id: "fr-moliere-avare",
    title: "Molière — L'Avare",
    content:
      "Au voleur ! au voleur ! à l'assassin ! au meurtrier ! Justice, juste Ciel ! je suis perdu, je suis assassiné, on m'a coupé la gorge, on m'a dérobé mon argent.",
    language: "fr",
    category: "moliere",
    difficulty: "MEDIUM",
  },
  {
    id: "fr-sentences-whisky",
    title: "Phrases d'échauffement",
    content:
      "Portez ce vieux whisky au juge blond qui fume. Les bolides vrombissent sur l'asphalte tandis que le départ est donné.",
    language: "fr",
    category: "sentences",
    difficulty: "MEDIUM",
  },
  {
    id: "en-code-async-countdown",
    title: "Python Code — Async Racing Loop",
    content:
      "async def start_countdown(seconds: int): return [await broadcast({'event': 'tick', 'remaining': s}) for s in range(seconds, 0, -1)]",
    language: "en",
    category: "code",
    difficulty: "HARD",
  },
];

/**
 * Default text for a race. Falls back to the default locale when no text
 * exists in `language`, then to the default locale's quotes.
 */
export function getRaceText(category: RaceTextCategory, language: Locale): RaceText {
  const find = (lang: Locale, cat: RaceTextCategory) =>
    RACE_TEXTS.find((text) => text.language === lang && text.category === cat);

  const text =
    find(language, category) ?? find(DEFAULT_LOCALE, category) ?? find(DEFAULT_LOCALE, "quotes");
  if (!text) throw new Error("RACE_TEXTS has no default-locale quote");
  return text;
}
