/**
 * Final ranking (COURSE-10):
 * 1. finishers, by finish time;
 * 2. racers still typing when the time ran out, by progress;
 * 3. racers who gave up, by progress at the moment they gave up.
 */

export const RACER_STATUSES = ["RACING", "FINISHED", "TIMEOUT", "ABANDONED"] as const;
export type RacerStatus = (typeof RACER_STATUSES)[number];

export interface RankableRacer {
  id: string;
  status: RacerStatus;
  progress: number;
  /** Milliseconds since the start, for finishers. */
  finishMs: number | null;
}

const STATUS_ORDER: Record<RacerStatus, number> = {
  FINISHED: 0,
  RACING: 1,
  TIMEOUT: 1,
  ABANDONED: 2,
};

export function compareRacers(a: RankableRacer, b: RankableRacer): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;
  if (a.status === "FINISHED") {
    return (a.finishMs ?? Infinity) - (b.finishMs ?? Infinity) || a.id.localeCompare(b.id);
  }
  return b.progress - a.progress || a.id.localeCompare(b.id);
}

/** Racers in final order, each with its 1-based rank. */
export function rankRacers<T extends RankableRacer>(
  racers: readonly T[]
): (T & { rank: number })[] {
  return [...racers].sort(compareRacers).map((racer, index) => ({ ...racer, rank: index + 1 }));
}
