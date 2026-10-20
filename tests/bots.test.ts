import { describe, expect, it } from "bun:test";
import { BOT_PROFILES, createBot, stepBot, wordDifficulty } from "@/lib/game/bots";
import { BOT_LEVELS } from "@/lib/game/config";
import { computeRaceStats } from "@/lib/game/typing";

const TEXT = Array.from(
  { length: 60 },
  (_, i) => ["voiture", "piste", "le", "clavier", "vitesse", "un", "Champion,", "course"][i % 8]
).join(" ");

/** Runs a bot to completion with ticks of `tickMs`, returning finish time and samples. */
function race(level: (typeof BOT_LEVELS)[number], seed: number, tickMs = 100) {
  let bot = createBot(level, seed);
  const samples: number[] = [];
  let now = 0;
  while (bot.typing.typed.length < TEXT.length && now < 30 * 60 * 1000) {
    now += tickMs;
    const before = bot.typing.typed.length;
    bot = stepBot(bot, TEXT, now, "FREE");
    samples.push(bot.typing.typed.length - before);
  }
  return { bot, now, samples };
}

describe("Bots (BOT-01 to BOT-05)", () => {
  it("is deterministic for a seed, whatever the tick rate (BOT-05)", () => {
    const a = race("INTERMEDIATE", 7, 100);
    const b = race("INTERMEDIATE", 7, 100);
    expect(b.bot.typing).toEqual(a.bot.typing);
    const coarse = race("INTERMEDIATE", 7, 250);
    expect(coarse.bot.typing.typed).toBe(a.bot.typing.typed);
    expect(coarse.bot.typing.errors).toBe(a.bot.typing.errors);
  });

  it("types within its level's speed range (BOT-01)", () => {
    for (const level of BOT_LEVELS) {
      const { bot, now } = race(level, 11);
      const { rawWpm } = computeRaceStats(bot.typing, TEXT, now);
      const profile = BOT_PROFILES[level];
      // Word difficulty and errors slow bots down, so allow a margin below the range.
      expect({
        level,
        ok: rawWpm >= profile.minWpm * 0.6 && rawWpm <= profile.maxWpm * 1.15,
      }).toEqual({ level, ok: true });
    }
  });

  it("does not type at a constant speed (BOT-02)", () => {
    const { samples } = race("EXPERT", 3, 500);
    const active = samples.slice(1, -1);
    expect(new Set(active).size).toBeGreaterThan(2);
  });

  it("slows down on difficult words", () => {
    expect(wordDifficulty("Champion,")).toBeGreaterThan(wordDifficulty("piste"));
  });

  it("makes errors, more often at low levels (BOT-03)", () => {
    const noob = race("NOOB", 5).bot.typing;
    const pro = race("IMPOSSIBLE", 5).bot.typing;
    expect(noob.errors).toBeGreaterThan(0);
    expect(noob.errors / noob.keystrokes).toBeGreaterThan(pro.errors / pro.keystrokes);
  });

  it("corrects every error in STRICT mode", () => {
    let bot = createBot("NOOB", 9);
    for (let now = 0; bot.typing.typed.length < TEXT.length; now += 200) {
      bot = stepBot(bot, TEXT, now, "STRICT");
    }
    expect(bot.typing.typed).toBe(TEXT);
    expect(bot.typing.errors).toBeGreaterThan(0);
  });

  it("is slower when slowed down (fog bonus)", () => {
    const normal = stepBot(createBot("EXPERT", 1), TEXT, 10000, "FREE");
    const fogged = stepBot(createBot("EXPERT", 1), TEXT, 10000, "FREE", 1.6);
    expect(fogged.typing.typed.length).toBeLessThan(normal.typing.typed.length);
  });
});
