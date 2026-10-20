/**
 * Room/race lifecycle (COURSE-01):
 *
 *   WAITING --start--> COUNTDOWN --go--> RACING --end--> RESULTS --restart--> WAITING
 *      \                   \                \               \
 *       `------------------ close (host leaves with no successor / host closes) --> CLOSED
 */

export const ROOM_PHASES = ["WAITING", "COUNTDOWN", "RACING", "RESULTS", "CLOSED"] as const;
export type RoomPhase = (typeof ROOM_PHASES)[number];

export type RoomEvent = "START" | "GO" | "END" | "RESTART" | "CLOSE";

const TRANSITIONS: Record<RoomPhase, Partial<Record<RoomEvent, RoomPhase>>> = {
  WAITING: { START: "COUNTDOWN", CLOSE: "CLOSED" },
  COUNTDOWN: { GO: "RACING", CLOSE: "CLOSED" },
  RACING: { END: "RESULTS", CLOSE: "CLOSED" },
  RESULTS: { RESTART: "WAITING", CLOSE: "CLOSED" },
  CLOSED: {},
};

/** Next phase, or `null` if the event is not allowed in `phase`. */
export function transition(phase: RoomPhase, event: RoomEvent): RoomPhase | null {
  return TRANSITIONS[phase][event] ?? null;
}

/** People can only join a waiting room or one showing results (SALLE-09). */
export function isJoinable(phase: RoomPhase): boolean {
  return phase === "WAITING" || phase === "RESULTS";
}

export const COUNTDOWN_MS = 3000;

export interface StartCheckInput {
  humanParticipants: number;
  bots: number;
}

export type StartCheck = { ok: true } | { ok: false; reason: "notEnoughParticipants" | "noHuman" };

/** At least 2 participants including 1 human; bots count, spectators do not (COURSE-02). */
export function canStartRace({ humanParticipants, bots }: StartCheckInput): StartCheck {
  if (humanParticipants < 1) return { ok: false, reason: "noHuman" };
  if (humanParticipants + bots < 2) return { ok: false, reason: "notEnoughParticipants" };
  return { ok: true };
}
