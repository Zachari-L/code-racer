import { getEarnedBadges, toBadgeRecord } from "@/lib/badges";
import { prisma } from "@/lib/prisma";
import type { ResultRow } from "@/lib/realtime/protocol";

/**
 * Stores every racer's result (RES-05), flags personal bests (RES-04) and
 * unlocks badges. Returns the rows with `isPersonalBest` filled in.
 */
export async function saveRaceResults(
  raceId: string,
  rows: ResultRow[],
  endedAt: Date
): Promise<ResultRow[]> {
  const userIds = rows.flatMap((r) => (r.userId ? [r.userId] : []));
  const previous = await prisma.raceResult.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _max: { wpm: true },
  });
  const bestByUser = new Map(previous.map((p) => [p.userId, p._max.wpm ?? 0]));

  // A record is only "beaten" if there was one before (RES-04).
  const withBests = rows.map((row) => {
    const best = row.userId ? bestByUser.get(row.userId) : undefined;
    return { ...row, isPersonalBest: best !== undefined && row.wpm > best };
  });

  await prisma.$transaction([
    prisma.raceResult.createMany({
      data: withBests.map((row) => ({
        raceId,
        userId: row.userId,
        nickname: row.name,
        isBot: row.isBot,
        botLevel: row.botLevel,
        rank: row.rank,
        status: row.status,
        wpm: row.wpm,
        rawWpm: row.rawWpm,
        accuracy: row.accuracy,
        errorsCount: row.errors,
        durationMs: Math.round(row.durationMs),
        progress: row.progress,
        bonuses: row.bonuses,
        wpmSeries: row.wpmSeries,
        missedKeys: row.missedKeys,
        isPersonalBest: row.isPersonalBest,
        createdAt: endedAt,
      })),
    }),
    prisma.race.update({ where: { id: raceId }, data: { endedAt } }),
  ]);

  for (const row of withBests) {
    if (row.userId) await unlockBadges(row.userId, row);
  }
  return withBests;
}

async function unlockBadges(userId: string, row: ResultRow) {
  const totalRaces = await prisma.raceResult.count({ where: { userId } });
  const earned = getEarnedBadges({
    wpm: row.wpm,
    accuracy: row.accuracy,
    rank: row.rank,
    totalRaces,
  });
  for (const definition of earned) {
    const record = toBadgeRecord(definition);
    const badge = await prisma.badge.upsert({
      where: { code: record.code },
      create: record,
      update: {},
    });
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }
}
