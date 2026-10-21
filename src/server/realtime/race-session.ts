/**
 * One race, held in memory by the realtime server, which is the source of
 * truth for start/end times, progress, ranking and bonuses (COURSE-06).
 * No I/O here: the caller passes the clock, so the whole race is unit-tested.
 */

import {
  BONUS_WORD_COUNT,
  FOG_BOT_SLOWDOWN,
  FOG_DURATION_MS,
  evaluateBonuses,
  type BonusType,
} from "@/lib/game/bonuses";
import { createBot, stepBot, type BotState } from "@/lib/game/bots";
import type { BotLevel, RoomConfig } from "@/lib/game/config";
import { createRng, type Rng } from "@/lib/game/random";
import { rankRacers, type RacerStatus } from "@/lib/game/ranking";
import { appendWords, removeTrailingWords } from "@/lib/game/text";
import {
  applyKeys,
  computeRaceStats,
  consumeChars,
  createRateBucket,
  createTypingState,
  errorPenaltyMs,
  isTextComplete,
  retargetText,
  type KeyInput,
  type RateBucket,
  type TypingState,
} from "@/lib/game/typing";
import type { BonusEvent, ResultRow, SelfState, TrackEntry } from "@/lib/realtime/protocol";

export interface RacerInit {
  id: string;
  name: string;
  userId: string | null;
  bot: { level: BotLevel; seed: number } | null;
}

interface RacerState {
  init: RacerInit;
  text: string;
  typing: TypingState;
  status: RacerStatus;
  finishMs: number | null;
  /** Race time (ms) when the racer stopped: finish, abandon or time out. */
  stoppedMs: number | null;
  /** Time added to the finish for uncorrected errors (FREE mode). */
  penaltyMs: number;
  bonuses: BonusType[];
  fogUntil: number | null;
  bot: BotState | null;
  bucket: RateBucket;
  wpmSeries: { t: number; wpm: number }[];
}

export interface TickResult {
  bonuses: BonusEvent[];
  /** Human racers whose personal state changed (text edited, fog). */
  changed: string[];
  ended: boolean;
}

export type InputResult = "ok" | "rejected" | "ignored";

export class RaceSession {
  readonly goAt: number;
  readonly endsAt: number | null;
  readonly baseText: string;
  private readonly config: RoomConfig;
  private readonly racers = new Map<string, RacerState>();
  private readonly bonusRng: Rng;
  private readonly wordRng: Rng;
  private reachedCheckpoints: number[] = [];
  private nextSampleSec = 1;
  private endedAtMs: number | null = null;

  constructor(options: {
    racers: RacerInit[];
    text: string;
    config: RoomConfig;
    seed: number;
    goAt: number;
  }) {
    this.goAt = options.goAt;
    this.endsAt =
      options.config.timeLimitSec === null
        ? null
        : options.goAt + options.config.timeLimitSec * 1000;
    this.baseText = options.text;
    this.config = options.config;
    this.bonusRng = createRng(options.seed ^ 0x51ed27);
    this.wordRng = createRng(options.seed ^ 0x9e3779);
    for (const init of options.racers) {
      this.racers.set(init.id, {
        init,
        text: options.text,
        typing: createTypingState(),
        status: "RACING",
        finishMs: null,
        stoppedMs: null,
        penaltyMs: 0,
        bonuses: [],
        fogUntil: null,
        bot: init.bot ? createBot(init.bot.level, init.bot.seed) : null,
        bucket: createRateBucket(options.goAt),
        wpmSeries: [],
      });
    }
  }

  get ended(): boolean {
    return this.endedAtMs !== null;
  }

  hasRacer(id: string): boolean {
    return this.racers.has(id);
  }

  racerIds(): string[] {
    return [...this.racers.keys()];
  }

  /**
   * Applies a human's keystrokes. Rejects the whole batch if it arrives before
   * the start or faster than humanly possible; the client then resyncs.
   */
  input(id: string, keys: readonly KeyInput[], now: number): InputResult {
    const racer = this.racers.get(id);
    if (!racer || racer.bot || racer.status !== "RACING" || this.ended) return "ignored";
    if (now < this.goAt) return "rejected";

    const chars = keys.filter((key) => key.k === "c").length;
    const bucket = consumeChars(racer.bucket, chars, now);
    if (!bucket) return "rejected";
    racer.bucket = bucket;

    racer.typing = applyKeys(racer.typing, racer.text, keys, this.config.errorMode);
    if (isTextComplete(racer.typing, racer.text)) this.stop(racer, "FINISHED", now);
    return "ok";
  }

  /** Gives up (COURSE-07) or is dropped after a long disconnection (COURSE-08). */
  abandon(id: string, now: number): void {
    const racer = this.racers.get(id);
    if (racer?.status === "RACING") this.stop(racer, "ABANDONED", now);
  }

  /** Advances bots, the clock, bonuses and the end condition (COURSE-09). */
  tick(now: number): TickResult {
    const result: TickResult = { bonuses: [], changed: [], ended: false };
    if (this.ended || now < this.goAt) return result;
    const raceMs = now - this.goAt;

    for (const racer of this.racers.values()) {
      if (!racer.bot || racer.status !== "RACING") continue;
      const fogged = racer.fogUntil !== null && now < racer.fogUntil;
      racer.bot = stepBot(
        racer.bot,
        racer.text,
        raceMs,
        this.config.errorMode,
        fogged ? FOG_BOT_SLOWDOWN : 1
      );
      racer.typing = racer.bot.typing;
      if (isTextComplete(racer.typing, racer.text)) this.stop(racer, "FINISHED", now);
    }

    while (this.nextSampleSec * 1000 <= raceMs) {
      for (const racer of this.racers.values()) {
        if (racer.status !== "RACING") continue;
        const { wpm } = computeRaceStats(racer.typing, racer.text, this.nextSampleSec * 1000);
        racer.wpmSeries.push({ t: this.nextSampleSec, wpm });
      }
      this.nextSampleSec++;
    }

    if (this.config.bonuses) this.applyBonuses(now, result);

    if (this.endsAt !== null && now >= this.endsAt) {
      for (const racer of this.racers.values()) {
        if (racer.status === "RACING") this.stop(racer, "TIMEOUT", this.endsAt);
      }
    }
    if ([...this.racers.values()].every((r) => r.status !== "RACING")) {
      this.endedAtMs = Math.max(...[...this.racers.values()].map((r) => r.stoppedMs ?? raceMs));
      result.ended = true;
    }
    return result;
  }

  private stop(racer: RacerState, status: Exclude<RacerStatus, "RACING">, now: number) {
    let raceMs = Math.max(0, now - this.goAt);
    if (status === "FINISHED") {
      // The penalty counts as race time: it sets the finish time, the rank and the WPM.
      racer.penaltyMs = errorPenaltyMs(racer.typing, racer.text, this.config.errorMode);
      const limitMs = this.endsAt === null ? null : this.endsAt - this.goAt;
      if (limitMs !== null && raceMs + racer.penaltyMs > limitMs) {
        // Finishing early with errors must not beat the clock: it is a time out.
        racer.penaltyMs = Math.max(0, limitMs - raceMs);
        status = "TIMEOUT";
      }
      raceMs += racer.penaltyMs;
    }
    racer.status = status;
    racer.stoppedMs = raceMs;
    if (status === "FINISHED") racer.finishMs = raceMs;
    // Final sample, so the chart ends where the racer stopped.
    const t = Math.round(raceMs / 100) / 10;
    if (t > 0 && racer.wpmSeries.at(-1)?.t !== t) {
      racer.wpmSeries.push({ t, wpm: computeRaceStats(racer.typing, racer.text, raceMs).wpm });
    }
  }

  private applyBonuses(now: number, result: TickResult) {
    const all = [...this.racers.values()];
    const evaluation = evaluateBonuses(
      this.reachedCheckpoints,
      all.map((r) => ({
        id: r.init.id,
        status: r.status,
        progress: computeRaceStats(r.typing, r.text, 1).progress,
        bonusesReceived: r.bonuses.length,
      })),
      this.bonusRng
    );
    this.reachedCheckpoints = evaluation.reachedCheckpoints;

    for (const activation of evaluation.activations) {
      const beneficiary = this.racers.get(activation.beneficiaryId);
      const target = this.racers.get(activation.targetId);
      if (!beneficiary || !target) continue;
      beneficiary.bonuses.push(activation.type);

      if (activation.type === "SHORTCUT") {
        target.text = removeTrailingWords(
          target.text,
          target.typing.typed.length,
          BONUS_WORD_COUNT
        ).text;
      } else if (activation.type === "HEAVY_LOAD") {
        target.text = appendWords(target.text, this.config, BONUS_WORD_COUNT, this.wordRng);
      } else {
        target.fogUntil = now + FOG_DURATION_MS;
      }
      // Keep bots and typed buffers consistent with the edited text (BONUS-04).
      target.typing = retargetText(target.typing, target.text);
      if (target.bot) target.bot = { ...target.bot, typing: target.typing };
      if (!target.bot) result.changed.push(target.init.id);
      result.bonuses.push({ ...activation });
    }
  }

  track(now: number): TrackEntry[] {
    return [...this.racers.values()].map((r) => {
      const elapsed = r.stoppedMs ?? Math.max(0, now - this.goAt);
      const stats = computeRaceStats(r.typing, r.text, elapsed);
      return {
        id: r.init.id,
        progress: stats.progress,
        wpm: Math.round(stats.wpm),
        status: r.status,
        bonuses: r.bonuses.length,
        fogged: r.fogUntil !== null && now < r.fogUntil,
      };
    });
  }

  self(id: string): SelfState | null {
    const r = this.racers.get(id);
    if (!r) return null;
    return {
      text: r.text,
      typed: r.typing.typed,
      keystrokes: r.typing.keystrokes,
      correctKeystrokes: r.typing.correctKeystrokes,
      errors: r.typing.errors,
      missedKeys: r.typing.missedKeys,
      status: r.status,
      fogUntil: r.fogUntil,
    };
  }

  /** Final table, ranked (COURSE-10). Personal bests are filled in on save. */
  results(): ResultRow[] {
    const rows = [...this.racers.values()].map((r) => {
      const durationMs = r.stoppedMs ?? this.endedAtMs ?? 0;
      const stats = computeRaceStats(r.typing, r.text, durationMs);
      return {
        id: r.init.id,
        status: r.status,
        // Racers who did not finish rank by correct text only, so mashing keys does not help.
        progress: r.status === "FINISHED" ? 1 : stats.correctProgress,
        finishMs: r.finishMs,
        racer: r,
        stats,
        durationMs,
      };
    });
    return rankRacers(rows).map(({ racer, stats, durationMs, rank, status, progress }) => ({
      racerId: racer.init.id,
      userId: racer.init.userId,
      name: racer.init.name,
      isBot: racer.bot !== null,
      botLevel: racer.init.bot?.level ?? null,
      rank,
      status: status === "RACING" ? "TIMEOUT" : status,
      wpm: Math.round(stats.wpm * 10) / 10,
      rawWpm: Math.round(stats.rawWpm * 10) / 10,
      accuracy: stats.accuracy,
      errors: stats.errors,
      durationMs,
      penaltyMs: racer.penaltyMs,
      progress,
      bonuses: racer.bonuses,
      wpmSeries: racer.wpmSeries,
      missedKeys: racer.typing.missedKeys,
      isPersonalBest: false,
    }));
  }
}
