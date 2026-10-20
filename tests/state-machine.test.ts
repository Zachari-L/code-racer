import { describe, expect, it } from "bun:test";
import { canStartRace, isJoinable, transition } from "@/lib/game/state-machine";

describe("Race state machine (COURSE-01)", () => {
  it("follows the documented happy path", () => {
    expect(transition("WAITING", "START")).toBe("COUNTDOWN");
    expect(transition("COUNTDOWN", "GO")).toBe("RACING");
    expect(transition("RACING", "END")).toBe("RESULTS");
    expect(transition("RESULTS", "RESTART")).toBe("WAITING");
    expect(transition("RESULTS", "CLOSE")).toBe("CLOSED");
  });

  it("rejects transitions that skip a phase", () => {
    expect(transition("WAITING", "END")).toBeNull();
    expect(transition("RACING", "RESTART")).toBeNull();
    expect(transition("CLOSED", "RESTART")).toBeNull();
  });

  it("only lets people join while waiting or on results (SALLE-09)", () => {
    expect(isJoinable("WAITING")).toBe(true);
    expect(isJoinable("RESULTS")).toBe(true);
    expect(isJoinable("COUNTDOWN")).toBe(false);
    expect(isJoinable("RACING")).toBe(false);
    expect(isJoinable("CLOSED")).toBe(false);
  });
});

describe("Start conditions (COURSE-02)", () => {
  it("needs two participants including one human; bots count", () => {
    expect(canStartRace({ humanParticipants: 1, bots: 1 })).toEqual({ ok: true });
    expect(canStartRace({ humanParticipants: 2, bots: 0 })).toEqual({ ok: true });
    expect(canStartRace({ humanParticipants: 1, bots: 0 }).ok).toBe(false);
    expect(canStartRace({ humanParticipants: 0, bots: 5 })).toEqual({
      ok: false,
      reason: "noHuman",
    });
  });
});
