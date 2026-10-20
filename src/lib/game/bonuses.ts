/**
 * Catch-up bonuses (BONUS-01, BONUS-02). Exact rule:
 *
 * - Checkpoints are reached when the leader (highest progress) first passes
 *   25 %, 50 % and 75 % of their text.
 * - At each checkpoint, every racer still typing who is lagging receives one
 *   bonus. Lagging = last of the racers still typing, or more than 25
 *   percentage points behind the leader. The leader never lags.
 * - A racer receives at most 3 bonuses per race.
 * - The type is drawn with the race RNG. Bonuses that hurt the leader (heavy
 *   load, fog) only hit a leader who is still typing, at most once per
 *   checkpoint; otherwise the lagging racer gets a shortcut instead.
 */

import { pick, type Rng } from "./random";
import type { RacerStatus } from "./ranking";

export const BONUS_TYPES = ["SHORTCUT", "HEAVY_LOAD", "FOG"] as const;
export type BonusType = (typeof BONUS_TYPES)[number];

/** -3 words for the lagging racer, +3 words for the leader. */
export const BONUS_WORD_COUNT = 3;
export const FOG_DURATION_MS = 5000;
/** Bots cannot be blinded, so fog slows them down by this factor instead. */
export const FOG_BOT_SLOWDOWN = 1.6;
export const CHECKPOINTS = [0.25, 0.5, 0.75] as const;
export const MAX_BONUSES_PER_RACER = 3;
export const LAG_THRESHOLD = 0.25;

/** Whether the bonus targets the leader rather than helping the lagging racer. */
export function targetsLeader(type: BonusType): boolean {
  return type !== "SHORTCUT";
}

export interface BonusRacer {
  id: string;
  status: RacerStatus;
  progress: number;
  bonusesReceived: number;
}

export interface BonusActivation {
  checkpoint: number;
  type: BonusType;
  /** Lagging racer who earned the bonus. */
  beneficiaryId: string;
  /** Racer affected: the beneficiary for a shortcut, the leader otherwise. */
  targetId: string;
}

export interface BonusEvaluation {
  reachedCheckpoints: number[];
  activations: BonusActivation[];
}

function findLeader(racers: readonly BonusRacer[]): BonusRacer | undefined {
  return racers.reduce<BonusRacer | undefined>(
    (best, racer) => (!best || racer.progress > best.progress ? racer : best),
    undefined
  );
}

export function findLaggingRacers(racers: readonly BonusRacer[]): BonusRacer[] {
  const leader = findLeader(racers);
  if (!leader) return [];
  const typing = racers.filter((r) => r.status === "RACING" && r.id !== leader.id);
  if (typing.length === 0) return [];
  const lastProgress = Math.min(
    ...racers.filter((r) => r.status === "RACING").map((r) => r.progress)
  );
  return typing.filter(
    (r) => r.progress === lastProgress || leader.progress - r.progress > LAG_THRESHOLD
  );
}

/** Checks for newly reached checkpoints and decides which bonuses they trigger. */
export function evaluateBonuses(
  reachedCheckpoints: readonly number[],
  racers: readonly BonusRacer[],
  rng: Rng
): BonusEvaluation {
  const leader = findLeader(racers);
  if (!leader) return { reachedCheckpoints: [...reachedCheckpoints], activations: [] };

  const reached = [...reachedCheckpoints];
  const activations: BonusActivation[] = [];
  const received = new Map(racers.map((r) => [r.id, r.bonusesReceived]));

  for (const checkpoint of CHECKPOINTS) {
    if (reached.includes(checkpoint) || leader.progress < checkpoint) continue;
    reached.push(checkpoint);
    let leaderHit = false;

    for (const racer of findLaggingRacers(racers)) {
      const count = received.get(racer.id) ?? 0;
      if (count >= MAX_BONUSES_PER_RACER) continue;

      let type = pick(rng, BONUS_TYPES);
      if (targetsLeader(type) && (leaderHit || leader.status !== "RACING")) type = "SHORTCUT";
      if (targetsLeader(type)) leaderHit = true;

      received.set(racer.id, count + 1);
      activations.push({
        checkpoint,
        type,
        beneficiaryId: racer.id,
        targetId: targetsLeader(type) ? leader.id : racer.id,
      });
    }
  }
  return { reachedCheckpoints: reached, activations };
}
