import type { RoomConfig } from "@/lib/game/config";
import { createRng } from "@/lib/game/random";
import { buildCoherentText, generateRandomText, type Passage } from "@/lib/game/text";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 5 * 60_000;
let cache: { passages: Passage[]; loadedAt: number } | null = null;

async function loadPassages(): Promise<Passage[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.passages;
  const rows = await prisma.textPassage.findMany({
    select: { id: true, language: true, complexity: true, content: true },
  });
  const passages = rows.flatMap((row) =>
    isLocale(row.language) ? [{ ...row, language: row.language }] : []
  );
  cache = { passages, loadedAt: Date.now() };
  return passages;
}

/**
 * Text for a new race, drawn with the race seed (CONF-03). If coherent mode is
 * selected but the corpus has no passage in that language (e.g. the database
 * was never seeded), the race falls back to a random text instead of failing.
 */
export async function buildRaceText(
  config: RoomConfig,
  seed: number
): Promise<{ text: string; passageId: string | null }> {
  const rng = createRng(seed);
  if (config.textMode === "COHERENT") {
    const coherent = buildCoherentText(await loadPassages(), config, rng);
    if (coherent) return coherent;
    console.warn(`No "${config.language}" passage in the corpus: using a random text.`);
  }
  return { text: generateRandomText(config, rng), passageId: null };
}
