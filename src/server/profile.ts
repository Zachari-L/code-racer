import { parseStoredConfig, type BotLevel } from "@/lib/game/config";
import type { RaceResultsData, ResultRow } from "@/lib/realtime/protocol";
import { prisma } from "@/lib/prisma";
import { avatarUrlFor } from "@/lib/avatar-url";

export const HISTORY_PAGE_SIZE = 10;

export interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  memberSince: string;
  stats: {
    races: number;
    wins: number;
    bestWpm: number;
    averageWpm: number;
    averageAccuracy: number;
  };
  /** WPM of every race, oldest first (AUTH-06 chart). */
  progression: { playedAt: string; wpm: number }[];
  badges: string[];
}

/** Public profile: pseudonym, picture, statistics and badges only (protection of minors). */
export async function getProfile(username: string): Promise<ProfileData | null> {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    include: {
      avatar: { select: { updatedAt: true } },
      badges: { include: { badge: { select: { code: true } } } },
    },
  });
  if (!user) return null;

  const [aggregate, wins, progression] = await Promise.all([
    prisma.raceResult.aggregate({
      where: { userId: user.id },
      _count: true,
      _max: { wpm: true },
      _avg: { wpm: true, accuracy: true },
    }),
    prisma.raceResult.count({ where: { userId: user.id, rank: 1 } }),
    prisma.raceResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, wpm: true },
    }),
  ]);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? user.username,
    avatarUrl: user.avatar ? avatarUrlFor(user.id, user.avatar.updatedAt) : null,
    memberSince: user.createdAt.toISOString(),
    stats: {
      races: aggregate._count,
      wins,
      bestWpm: aggregate._max.wpm ?? 0,
      averageWpm: aggregate._avg.wpm ?? 0,
      averageAccuracy: aggregate._avg.accuracy ?? 0,
    },
    progression: progression.map((r) => ({ playedAt: r.createdAt.toISOString(), wpm: r.wpm })),
    badges: user.badges.map((b) => b.badge.code),
  };
}

export interface HistoryEntry {
  raceId: string;
  playedAt: string;
  rank: number;
  racers: number;
  wpm: number;
  accuracy: number;
  status: ResultRow["status"];
  isPersonalBest: boolean;
  language: string;
}

/** Finished races of a user, newest first, one page at a time (HIST-01). */
export async function getHistory(userId: string, page: number) {
  const [total, results] = await Promise.all([
    prisma.raceResult.count({ where: { userId } }),
    prisma.raceResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
      include: { race: { select: { config: true, _count: { select: { results: true } } } } },
    }),
  ]);
  const entries: HistoryEntry[] = results.map((r) => ({
    raceId: r.raceId,
    playedAt: r.createdAt.toISOString(),
    rank: r.rank,
    racers: r.race._count.results,
    wpm: r.wpm,
    accuracy: r.accuracy,
    status: r.status,
    isPersonalBest: r.isPersonalBest,
    language: parseStoredConfig(r.race.config).language,
  }));
  return { entries, total, pageCount: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)) };
}

const asSeries = (value: unknown): ResultRow["wpmSeries"] =>
  Array.isArray(value)
    ? value.filter(
        (p): p is { t: number; wpm: number } =>
          typeof p?.t === "number" && typeof p?.wpm === "number"
      )
    : [];

const asCounts = (value: unknown): Record<string, number> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number"
        )
      )
    : {};

const BONUS_VALUES = new Set(["SHORTCUT", "HEAVY_LOAD", "FOG"]);

/**
 * Full results of a stored race (HIST-02), only for people who raced in it.
 * Returns the viewer's row id so the page can highlight it.
 */
export async function getRaceResultsForUser(
  raceId: string,
  userId: string
): Promise<{ data: RaceResultsData; viewerId: string } | null> {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
    include: { results: { orderBy: { rank: "asc" } } },
  });
  const viewer = race?.results.find((r) => r.userId === userId);
  if (!race || !viewer) return null;

  return {
    viewerId: viewer.id,
    data: {
      raceId: race.id,
      startedAt: race.startedAt.toISOString(),
      text: race.text,
      language: parseStoredConfig(race.config).language,
      rows: race.results.map((r) => ({
        racerId: r.id,
        userId: r.userId,
        name: r.nickname,
        isBot: r.isBot,
        botLevel: (r.botLevel as BotLevel | null) ?? null,
        rank: r.rank,
        status: r.status,
        wpm: r.wpm,
        rawWpm: r.rawWpm,
        accuracy: r.accuracy,
        errors: r.errorsCount,
        durationMs: r.durationMs,
        progress: r.progress,
        bonuses: Array.isArray(r.bonuses)
          ? r.bonuses.filter(
              (b): b is "SHORTCUT" | "HEAVY_LOAD" | "FOG" =>
                typeof b === "string" && BONUS_VALUES.has(b)
            )
          : [],
        wpmSeries: asSeries(r.wpmSeries),
        missedKeys: asCounts(r.missedKeys),
        isPersonalBest: r.isPersonalBest,
      })),
    },
  };
}
