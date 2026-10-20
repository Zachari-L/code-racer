import { describe, expect, it } from "bun:test";
import { DEFAULT_ROOM_CONFIG, type RoomConfig } from "@/lib/game/config";
import type { KeyInput } from "@/lib/game/typing";
import { RaceSession, type RacerInit } from "@/server/realtime/race-session";

const TEXT = "le chat dort sur le mur au soleil du matin et la course commence enfin";
const human = (id: string): RacerInit => ({ id, name: id, userId: id, bot: null });
const bot = (id: string, level: "NOOB" | "IMPOSSIBLE" = "NOOB"): RacerInit => ({
  id,
  name: id,
  userId: null,
  bot: { level, seed: 1 },
});
const keys = (text: string): KeyInput[] => [...text].map((c) => ({ k: "c", c }));

function session(racers: RacerInit[], config: Partial<RoomConfig> = {}) {
  return new RaceSession({
    racers,
    text: TEXT,
    config: { ...DEFAULT_ROOM_CONFIG, bonuses: false, ...config },
    seed: 42,
    goAt: 1000,
  });
}

/** Types `text` in small batches spread over time, like a fast human. */
function typeSlowly(race: RaceSession, id: string, text: string, from: number, cps = 10) {
  let now = from;
  for (let i = 0; i < text.length; i += 2) {
    now += (2 / cps) * 1000;
    race.input(id, keys(text.slice(i, i + 2)), now);
    race.tick(now);
  }
  return now;
}

describe("Race session (COURSE-06, COURSE-09, COURSE-10)", () => {
  it("rejects input before the start and impossible bursts", () => {
    const race = session([human("a"), bot("b")]);
    expect(race.input("a", keys("le"), 500)).toBe("rejected");
    expect(race.input("a", keys(TEXT.slice(0, 40)), 1000)).toBe("rejected");
    expect(race.input("a", keys("le"), 1100)).toBe("ok");
  });

  it("ignores bots' and unknown racers' input", () => {
    const race = session([human("a"), bot("b")]);
    expect(race.input("b", keys("le"), 2000)).toBe("ignored");
    expect(race.input("zzz", keys("le"), 2000)).toBe("ignored");
  });

  it("finishes when everybody finished or abandoned, and ranks them", () => {
    const race = session([human("a"), human("b")]);
    const end = typeSlowly(race, "a", TEXT, 1000);
    expect(race.ended).toBe(false);
    race.abandon("b", end + 100);
    expect(race.tick(end + 200).ended).toBe(true);
    const [first, second] = race.results();
    expect([first.racerId, first.status, first.rank]).toEqual(["a", "FINISHED", 1]);
    expect([second.racerId, second.status]).toEqual(["b", "ABANDONED"]);
    expect(first.wpmSeries.length).toBeGreaterThan(3);
  });

  it("times out racers still typing when the limit is reached", () => {
    const race = session([human("a"), bot("b")], { timeLimitSec: 30 });
    race.input("a", keys("le chat"), 2000);
    expect(race.tick(31_000).ended).toBe(true);
    const rows = race.results();
    expect(rows.every((r) => r.status === "TIMEOUT")).toBe(true);
    expect(rows.find((r) => r.racerId === "a")?.durationMs).toBe(30_000);
  });

  it("moves bots on its own and reports the track", () => {
    const race = session([human("a"), bot("b", "IMPOSSIBLE")]);
    race.tick(11_000);
    const track = race.track(11_000);
    expect(track.find((t) => t.id === "b")!.progress).toBeGreaterThan(0.5);
    expect(track.find((t) => t.id === "a")!.progress).toBe(0);
  });

  it("gives catch-up bonuses that keep progress consistent (BONUS-01, BONUS-04)", () => {
    const race = session([human("leader"), human("late")], { bonuses: true });
    let now = 1000;
    const bonuses: string[] = [];
    for (let i = 0; i < 40; i += 2) {
      now += 200;
      race.input("leader", keys(TEXT.slice(i, i + 2)), now);
      bonuses.push(...race.tick(now).bonuses.map((b) => b.beneficiaryId));
    }
    expect(bonuses.length).toBeGreaterThan(0);
    expect(bonuses.every((id) => id === "late")).toBe(true);
    for (const entry of race.track(now)) {
      expect(entry.progress).toBeGreaterThanOrEqual(0);
      expect(entry.progress).toBeLessThanOrEqual(1);
    }
    const self = race.self("leader")!;
    expect(self.typed.length).toBeLessThanOrEqual(self.text.length);
  });

  it("exposes the racer's own state for reconnection (COURSE-08)", () => {
    const race = session([human("a"), bot("b")]);
    race.input("a", keys("le ch"), 2000);
    expect(race.self("a")).toMatchObject({ typed: "le ch", status: "RACING", text: TEXT });
  });
});
