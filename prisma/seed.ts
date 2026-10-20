/**
 * Demo data (TECH-04): text corpus, badges, demo accounts and a race history.
 * Idempotent: running it again refreshes the same records.
 */

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { BADGES, BADGE_CODES, toBadgeRecord } from "../src/lib/badges";
import { createBot, stepBot } from "../src/lib/game/bots";
import { DEFAULT_ROOM_CONFIG, type BotLevel } from "../src/lib/game/config";
import { createRng, hashString } from "../src/lib/game/random";
import { rankRacers } from "../src/lib/game/ranking";
import { buildCoherentText, classifyPassage, countWords } from "../src/lib/game/text";
import { computeRaceStats } from "../src/lib/game/typing";
import { PASSAGES } from "./data/passages";

/** Credentials documented in the README. */
export const DEMO_PASSWORD = "demo1234";
const DEMO_USERS = [
  { username: "demo", displayName: "Demo Racer", level: "EXPERT" },
  { username: "pixel_pilot", displayName: "Pixel Pilot", level: "INTERMEDIATE" },
  { username: "nitro_nina", displayName: "Nitro Nina", level: "EXPERT" },
  { username: "turbo_tortue", displayName: "Turbo Tortue", level: "BEGINNER" },
] as const satisfies readonly { username: string; displayName: string; level: BotLevel }[];

const HISTORY_ROOM_CODE = "SEED42";
const HISTORY_RACES = 8;

async function seedPassages() {
  for (const passage of PASSAGES) {
    const data = {
      ...passage,
      complexity: classifyPassage(passage.content),
      wordCount: countWords(passage.content),
    };
    await prisma.textPassage.upsert({ where: { id: passage.id }, update: data, create: data });
  }
}

async function seedBadges() {
  for (const badge of BADGES) {
    const record = toBadgeRecord(badge);
    await prisma.badge.upsert({ where: { code: record.code }, update: record, create: record });
  }
  // Drop legacy badges that left the registry and nobody holds.
  await prisma.badge.deleteMany({
    where: { code: { notIn: [...BADGE_CODES] }, users: { none: {} } },
  });
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];
  for (const { username, displayName } of DEMO_USERS) {
    users.push(
      await prisma.user.upsert({
        where: { username },
        update: { displayName, passwordHash },
        create: { username, displayName, passwordHash },
      })
    );
  }
  return users;
}

interface SimulatedRacer {
  id: string;
  userId: string | null;
  nickname: string;
  level: BotLevel;
  isBot: boolean;
}

/** Plays a race with the bot engine and returns one result line per racer. */
function simulateRace(racers: SimulatedRacer[], text: string, seed: number) {
  const timeLimitMs = (DEFAULT_ROOM_CONFIG.timeLimitSec ?? 120) * 1000;
  const simulated = racers.map((racer) => {
    let bot = createBot(racer.level, seed ^ hashString(racer.id));
    const wpmSeries: { t: number; wpm: number }[] = [];
    let finishMs: number | null = null;
    for (let now = 1000; now <= timeLimitMs && finishMs === null; now += 1000) {
      bot = stepBot(bot, text, now, "FREE");
      wpmSeries.push({ t: now / 1000, wpm: computeRaceStats(bot.typing, text, now).wpm });
      if (bot.typing.typed.length >= text.length) finishMs = now;
    }
    const durationMs = finishMs ?? timeLimitMs;
    return {
      ...racer,
      typing: bot.typing,
      stats: computeRaceStats(bot.typing, text, durationMs),
      wpmSeries,
      finishMs,
      durationMs,
    };
  });

  return rankRacers(
    simulated.map((r) => ({
      ...r,
      status: r.finishMs !== null ? ("FINISHED" as const) : ("TIMEOUT" as const),
      progress: r.stats.progress,
    }))
  );
}

async function seedHistory(users: Awaited<ReturnType<typeof seedUsers>>) {
  await prisma.room.deleteMany({ where: { code: HISTORY_ROOM_CODE } });
  const [host] = users;
  const room = await prisma.room.create({
    data: {
      code: HISTORY_ROOM_CODE,
      hostId: host.id,
      visibility: "CODE",
      status: "CLOSED",
      capacity: DEFAULT_ROOM_CONFIG.capacity,
      config: DEFAULT_ROOM_CONFIG,
      language: DEFAULT_ROOM_CONFIG.language,
      complexity: DEFAULT_ROOM_CONFIG.complexity,
      closedAt: new Date(),
    },
  });

  const passages = await prisma.textPassage.findMany();
  const bestWpm = new Map<string, number>();
  const rng = createRng(2024);

  for (let i = 0; i < HISTORY_RACES; i++) {
    const seed = Math.floor(rng() * 2 ** 31);
    const startedAt = new Date(Date.now() - (HISTORY_RACES - i) * 2 * 86_400_000);
    const generated = buildCoherentText(
      passages.map((p) => ({ ...p, language: p.language === "en" ? "en" : "fr" })),
      DEFAULT_ROOM_CONFIG,
      createRng(seed)
    );
    if (!generated) throw new Error("No passage in the default language");

    const racers: SimulatedRacer[] = [
      ...users.map((user, index) => ({
        id: user.id,
        userId: user.id,
        nickname: user.displayName ?? user.username,
        level: DEMO_USERS[index].level,
        isBot: false,
      })),
      { id: `bot-${i}`, userId: null, nickname: "Bot Nova", level: "INTERMEDIATE", isBot: true },
    ];
    const ranked = simulateRace(racers, generated.text, seed);
    const endedAt = new Date(startedAt.getTime() + Math.max(...ranked.map((r) => r.durationMs)));

    await prisma.race.create({
      data: {
        roomId: room.id,
        seed,
        config: DEFAULT_ROOM_CONFIG,
        text: generated.text,
        passageId: generated.passageId,
        startedAt,
        endedAt,
        results: {
          create: ranked.map((r) => {
            const previousBest = r.userId ? (bestWpm.get(r.userId) ?? 0) : Infinity;
            if (r.userId) bestWpm.set(r.userId, Math.max(previousBest, r.stats.wpm));
            return {
              userId: r.userId,
              nickname: r.nickname,
              isBot: r.isBot,
              botLevel: r.isBot ? r.level : null,
              rank: r.rank,
              status: r.status,
              wpm: r.stats.wpm,
              rawWpm: r.stats.rawWpm,
              accuracy: r.stats.accuracy,
              errorsCount: r.stats.errors,
              durationMs: r.durationMs,
              progress: r.stats.progress,
              bonuses: [],
              wpmSeries: r.wpmSeries,
              missedKeys: r.typing.missedKeys,
              isPersonalBest: r.stats.wpm > previousBest,
              createdAt: endedAt,
            };
          }),
        },
      },
    });
  }
}

async function main() {
  console.log("Seeding CodeRacer...");
  await seedPassages();
  await seedBadges();
  const users = await seedUsers();
  await seedHistory(users);
  console.log(`Done. Demo login: demo / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
