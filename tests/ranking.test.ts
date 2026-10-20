import { describe, expect, it } from "bun:test";
import { rankRacers, type RankableRacer } from "@/lib/game/ranking";

describe("Final ranking (COURSE-10)", () => {
  const racers: RankableRacer[] = [
    { id: "quit-far", status: "ABANDONED", progress: 0.9, finishMs: null },
    { id: "slow-finish", status: "FINISHED", progress: 1, finishMs: 50000 },
    { id: "timeout-low", status: "TIMEOUT", progress: 0.3, finishMs: null },
    { id: "fast-finish", status: "FINISHED", progress: 1, finishMs: 40000 },
    { id: "timeout-high", status: "TIMEOUT", progress: 0.8, finishMs: null },
    { id: "quit-early", status: "ABANDONED", progress: 0.1, finishMs: null },
  ];

  it("orders finishers by time, then timeouts and abandons by progress", () => {
    expect(rankRacers(racers).map((r) => [r.rank, r.id])).toEqual([
      [1, "fast-finish"],
      [2, "slow-finish"],
      [3, "timeout-high"],
      [4, "timeout-low"],
      [5, "quit-far"],
      [6, "quit-early"],
    ]);
  });
});
