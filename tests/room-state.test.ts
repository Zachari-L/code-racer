import { describe, expect, it } from "bun:test";
import { DEFAULT_ROOM_CONFIG } from "@/lib/game/config";
import type { RaceView, RoomSnapshot } from "@/lib/realtime/protocol";
import { INITIAL_ROOM_STATE, roomReducer } from "@/lib/realtime/room-state";

const room = (race: RaceView | null = null): RoomSnapshot => ({
  code: "AB3K9Q",
  phase: race ? "RACING" : "WAITING",
  config: DEFAULT_ROOM_CONFIG,
  members: [],
  bots: [],
  youId: "m1",
  invites: null,
  race,
});

const race = (goAt: number): RaceView => ({
  goAt,
  endsAt: null,
  text: "abc",
  errorMode: "FREE",
  racers: [],
  track: [{ id: "m1", progress: 0, wpm: 0, status: "RACING", bonuses: 0, fogged: false }],
  results: null,
});

const self = {
  text: "abc",
  typed: "a",
  keystrokes: 1,
  correctKeystrokes: 1,
  errors: 0,
  missedKeys: {},
  status: "RACING" as const,
  fogUntil: null,
};

describe("Room state reducer", () => {
  it("stores snapshots and clears join errors", () => {
    let state = roomReducer(INITIAL_ROOM_STATE, { type: "joinError", error: "full" });
    state = roomReducer(state, { type: "room", room: room(), serverNow: 0 });
    expect(state.room?.code).toBe("AB3K9Q");
    expect(state.joinError).toBeNull();
  });

  it("keeps personal state during a race and resets it for a new one", () => {
    let state = roomReducer(INITIAL_ROOM_STATE, {
      type: "room",
      room: room(race(1)),
      serverNow: 0,
    });
    state = roomReducer(state, { type: "self", self, reason: "resync" });
    state = roomReducer(state, { type: "room", room: room(race(1)), serverNow: 0 });
    expect(state.self).toEqual({ state: self, reason: "resync" });
    state = roomReducer(state, { type: "room", room: room(race(2)), serverNow: 0 });
    expect(state.self).toBeNull();
  });

  it("keeps personal state sent before the first snapshot (reconnection)", () => {
    let state = roomReducer(INITIAL_ROOM_STATE, { type: "self", self, reason: "resync" });
    state = roomReducer(state, { type: "room", room: room(race(1)), serverNow: 0 });
    expect(state.self).toEqual({ state: self, reason: "resync" });
  });

  it("keeps the latest bonus notices only", () => {
    let state = INITIAL_ROOM_STATE;
    for (let i = 0; i < 6; i++) {
      state = roomReducer(state, {
        type: "bonus",
        bonus: { type: "FOG", beneficiaryId: "a", targetId: "b", checkpoint: 0.25 },
      });
    }
    expect(state.notices.map((n) => n.key)).toEqual([3, 4, 5, 6]);
    state = roomReducer(state, { type: "dismissNotice", key: 3 });
    expect(state.notices).toHaveLength(3);
  });

  it("resets everything when kicked or when the room closes", () => {
    const state = roomReducer(
      roomReducer(INITIAL_ROOM_STATE, { type: "room", room: room(), serverNow: 0 }),
      { type: "kicked" }
    );
    expect(state).toEqual({ ...INITIAL_ROOM_STATE, ended: "kicked" });
  });
});
