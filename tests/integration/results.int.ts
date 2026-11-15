import { afterAll, describe, expect, it } from "bun:test";
import type { Identity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";
import type { ResultRow } from "@/lib/realtime/protocol";
import { getHistory, getProfile, getRaceResultsForUser } from "@/server/profile";
import { buildRaceText } from "@/server/race-text";
import { saveRaceResults } from "@/server/realtime/persistence";
import { TEST_CONFIG, cleanup, createRoom, createUser } from "./helpers";

const PASSAGE_ID = "integration-test-passage";

afterAll(async () => {
  await prisma.textPassage.deleteMany({ where: { id: PASSAGE_ID } });
  await cleanup();
});

function row(identity: Identity | null, overrides: Partial<ResultRow> = {}): ResultRow {
  return {
    racerId: identity?.id ?? "bot-1",
    userId: identity?.kind === "user" ? identity.id : null,
    name: identity?.name ?? "Bot",
    isBot: identity === null,
    botLevel: identity === null ? "NOOB" : null,
    rank: 1,
    status: "FINISHED",
    wpm: 40,
    rawWpm: 42,
    accuracy: 95,
    errors: 2,
    durationMs: 30_000,
    penaltyMs: 0,
    progress: 1,
    bonuses: [],
    wpmSeries: [{ t: 1, wpm: 40 }],
    missedKeys: { e: 2 },
    isPersonalBest: false,
    ...overrides,
  };
}

async function storedRace(host: Identity, rows: (host: Identity) => ResultRow[]) {
  const room = await createRoom(host, {}, { status: "RESULTS", hostIsMember: false });
  const race = await prisma.race.create({
    data: {
      roomId: room.id,
      seed: 1,
      config: TEST_CONFIG,
      text: "le chat dort",
      startedAt: new Date(),
    },
  });
  const saved = await saveRaceResults(race.id, rows(host), new Date());
  return { race, saved };
}

describe("Saving results (RES-04, RES-05)", () => {
  it("stores every racer and only flags a beaten record as a personal best", async () => {
    const user = await createUser("speedy");
    const first = await storedRace(user, (u) => [
      row(u, { wpm: 40 }),
      row(null, { rank: 2, status: "TIMEOUT", progress: 0.5 }),
    ]);
    // A first race sets the record but does not "beat" one.
    expect(first.saved[0].isPersonalBest).toBe(false);
    expect(await prisma.raceResult.count({ where: { raceId: first.race.id } })).toBe(2);

    const slower = await storedRace(user, (u) => [row(u, { wpm: 30, rank: 2 })]);
    expect(slower.saved[0].isPersonalBest).toBe(false);
    const faster = await storedRace(user, (u) => [row(u, { wpm: 55, penaltyMs: 3000 })]);
    expect(faster.saved[0].isPersonalBest).toBe(true);
    const stored = await prisma.raceResult.findFirstOrThrow({
      where: { raceId: faster.race.id },
    });
    expect(stored).toMatchObject({ wpm: 55, penaltyMs: 3000, isPersonalBest: true });
  });

  it("unlocks badges once, from the race that earned them", async () => {
    const user = await createUser("badger");
    await storedRace(user, (u) => [row(u, { wpm: 60, accuracy: 100, rank: 1 })]);
    await storedRace(user, (u) => [row(u, { wpm: 60, accuracy: 100, rank: 1 })]);
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    });
    expect(badges.map((b) => b.badge.code).sort()).toEqual([
      "FIRST_RACE",
      "FIRST_VICTORY",
      "PERFECT_ACCURACY",
      "SPEED_50",
    ]);
  });
});

describe("Profile and history (AUTH-06, HIST-01, HIST-02)", () => {
  it("sums up a racer's statistics without private data", async () => {
    const user = await createUser("stats");
    await storedRace(user, (u) => [row(u, { wpm: 40, accuracy: 90, rank: 1 })]);
    await storedRace(user, (u) => [row(u, { wpm: 60, accuracy: 100, rank: 2 })]);

    const profile = await getProfile(user.name.toUpperCase());
    expect(profile?.stats).toEqual({
      races: 2,
      wins: 1,
      bestWpm: 60,
      averageWpm: 50,
      averageAccuracy: 95,
    });
    expect(profile?.progression.map((p) => p.wpm)).toEqual([40, 60]);
    expect(Object.keys(profile!)).not.toContain("passwordHash");
    expect(await getProfile("nobody-has-this-name")).toBeNull();
  });

  it("pages the history, newest first", async () => {
    const user = await createUser("history");
    for (let wpm = 1; wpm <= 12; wpm++) await storedRace(user, (u) => [row(u, { wpm })]);
    const page1 = await getHistory(user.id, 1);
    expect(page1.total).toBe(12);
    expect(page1.pageCount).toBe(2);
    expect(page1.entries[0].wpm).toBe(12);
    const page2 = await getHistory(user.id, 2);
    expect(page2.entries.map((e) => e.wpm)).toEqual([2, 1]);
  });

  it("shows a stored race only to the people who raced in it", async () => {
    const racer = await createUser("racer");
    const stranger = await createUser("stranger");
    const { race } = await storedRace(racer, (u) => [
      row(u, { penaltyMs: 6000 }),
      row(null, { rank: 2, status: "ABANDONED", progress: 0.2 }),
    ]);

    const visible = await getRaceResultsForUser(race.id, racer.id);
    expect(visible?.data.rows.map((r) => [r.name, r.rank, r.penaltyMs])).toEqual([
      [racer.name, 1, 6000],
      ["Bot", 2, 0],
    ]);
    expect(visible?.data.rows[0].wpmSeries).toEqual([{ t: 1, wpm: 40 }]);
    expect(await getRaceResultsForUser(race.id, stranger.id)).toBeNull();
    expect(await getRaceResultsForUser("missing", racer.id)).toBeNull();
  });
});

describe("Race texts (CONF-03)", () => {
  it("draws coherent texts from the stored corpus and random ones from the dictionary", async () => {
    await prisma.textPassage.upsert({
      where: { id: PASSAGE_ID },
      update: {},
      create: {
        id: PASSAGE_ID,
        language: "fr",
        title: "Test",
        author: "Test",
        complexity: "HARD",
        wordCount: 14,
        content: "Le vent du soir glisse sur les toits et la ville se tait doucement avant minuit.",
      },
    });
    const coherentConfig = {
      ...TEST_CONFIG,
      textMode: "COHERENT" as const,
      complexity: "HARD" as const,
    };
    const coherent = await buildRaceText(coherentConfig, 7);
    expect(coherent.text.split(" ")).toHaveLength(10);
    const passage = await prisma.textPassage.findUnique({ where: { id: coherent.passageId! } });
    expect(passage).toMatchObject({ language: "fr" });
    // Same seed, same text: everyone in the race types the same thing.
    expect(await buildRaceText(coherentConfig, 7)).toEqual(coherent);

    const random = await buildRaceText(TEST_CONFIG, 7);
    expect(random.passageId).toBeNull();
    expect(random.text.split(" ")).toHaveLength(10);
  });
});
