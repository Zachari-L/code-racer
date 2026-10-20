import { describe, expect, it } from "bun:test";
import {
  MAX_BONUSES_PER_RACER,
  evaluateBonuses,
  findLaggingRacers,
  type BonusRacer,
} from "@/lib/game/bonuses";
import { createRng } from "@/lib/game/random";

const racer = (id: string, progress: number, overrides: Partial<BonusRacer> = {}): BonusRacer => ({
  id,
  progress,
  status: "RACING",
  bonusesReceived: 0,
  ...overrides,
});

describe("Lagging racers (BONUS-01)", () => {
  it("includes the last racer and anyone more than 25 points behind the leader", () => {
    const racers = [
      racer("leader", 0.6),
      racer("close", 0.5),
      racer("far", 0.3),
      racer("last", 0.2),
    ];
    expect(findLaggingRacers(racers).map((r) => r.id)).toEqual(["far", "last"]);
  });

  it("never includes the leader or racers who stopped typing", () => {
    const racers = [racer("leader", 0.9), racer("done", 0.2, { status: "ABANDONED" })];
    expect(findLaggingRacers(racers)).toEqual([]);
  });
});

describe("Checkpoints (BONUS-01, BONUS-02)", () => {
  it("does nothing before the leader passes 25 %", () => {
    const result = evaluateBonuses([], [racer("a", 0.2), racer("b", 0.1)], createRng(1));
    expect(result).toEqual({ reachedCheckpoints: [], activations: [] });
  });

  it("gives one bonus per lagging racer at each checkpoint, once", () => {
    const racers = [racer("leader", 0.3), racer("b", 0.1)];
    const first = evaluateBonuses([], racers, createRng(1));
    expect(first.reachedCheckpoints).toEqual([0.25]);
    expect(first.activations).toHaveLength(1);
    expect(first.activations[0].beneficiaryId).toBe("b");

    const again = evaluateBonuses(first.reachedCheckpoints, racers, createRng(1));
    expect(again.activations).toEqual([]);
  });

  it("triggers every checkpoint passed since the last check", () => {
    const result = evaluateBonuses([], [racer("leader", 0.8), racer("b", 0.1)], createRng(1));
    expect(result.reachedCheckpoints).toEqual([0.25, 0.5, 0.75]);
    expect(result.activations.map((a) => a.checkpoint)).toEqual([0.25, 0.5, 0.75]);
  });

  it("caps bonuses at 3 per racer", () => {
    const racers = [racer("leader", 0.8), racer("b", 0.1, { bonusesReceived: 2 })];
    const result = evaluateBonuses([], racers, createRng(1));
    expect(result.activations).toHaveLength(MAX_BONUSES_PER_RACER - 2);
  });

  it("hits the leader at most once per checkpoint and only while they type", () => {
    const racers = [racer("leader", 0.3), ...["b", "c", "d", "e"].map((id) => racer(id, 0))];
    for (let seed = 0; seed < 20; seed++) {
      const { activations } = evaluateBonuses([], racers, createRng(seed));
      expect(activations.filter((a) => a.targetId === "leader").length).toBeLessThanOrEqual(1);
    }
    const finished = [racer("leader", 1, { status: "FINISHED" }), racer("b", 0.1)];
    const { activations } = evaluateBonuses([], finished, createRng(1));
    expect(activations.every((a) => a.type === "SHORTCUT" && a.targetId === "b")).toBe(true);
  });

  it("uses every bonus type across seeds", () => {
    const types = new Set<string>();
    for (let seed = 0; seed < 30; seed++) {
      const { activations } = evaluateBonuses(
        [],
        [racer("leader", 0.3), racer("b", 0)],
        createRng(seed)
      );
      activations.forEach((a) => types.add(a.type));
    }
    expect([...types].sort()).toEqual(["FOG", "HEAVY_LOAD", "SHORTCUT"]);
  });
});
