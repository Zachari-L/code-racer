/** Client-side view of a room, folded from server messages. Pure, so it is unit-tested. */

import type {
  ActionError,
  BonusEvent,
  JoinError,
  RoomSnapshot,
  SelfState,
  ServerMessage,
  TrackEntry,
} from "./protocol";

export interface BonusNotice {
  key: number;
  bonus: BonusEvent;
}

export interface RoomState {
  room: RoomSnapshot | null;
  track: TrackEntry[];
  /** Latest personal race state and how to apply it (see the "self" message). */
  self: { state: SelfState; reason: "resync" | "text" } | null;
  joinError: { error: JoinError; currentRoom?: string; retryAfterMs?: number } | null;
  actionError: ActionError | null;
  ended: "kicked" | "closed" | "left" | null;
  notices: BonusNotice[];
}

export const INITIAL_ROOM_STATE: RoomState = {
  room: null,
  track: [],
  self: null,
  joinError: null,
  actionError: null,
  ended: null,
  notices: [],
};

const MAX_NOTICES = 4;

export type RoomAction =
  | ServerMessage
  | { type: "dismissNotice"; key: number }
  | { type: "dismissOldestNotice" }
  | { type: "clearErrors" };

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "room": {
      const race = action.room.race;
      // A first snapshot is not a "new" race: a reconnection may get its state first.
      const isNewRace = state.room !== null && race?.goAt !== state.room.race?.goAt;
      return {
        ...state,
        room: action.room,
        joinError: null,
        ended: null,
        track: race?.track ?? [],
        // A new race starts from a clean personal state.
        self: isNewRace ? null : state.self,
        notices: isNewRace ? [] : state.notices,
      };
    }
    case "track":
      return { ...state, track: action.track };
    case "self":
      return { ...state, self: { state: action.self, reason: action.reason } };
    case "bonus": {
      const key = (state.notices.at(-1)?.key ?? 0) + 1;
      return {
        ...state,
        notices: [...state.notices, { key, bonus: action.bonus }].slice(-MAX_NOTICES),
      };
    }
    case "dismissOldestNotice":
      return { ...state, notices: state.notices.slice(1) };
    case "dismissNotice":
      return { ...state, notices: state.notices.filter((n) => n.key !== action.key) };
    case "joinError":
      return {
        ...state,
        joinError: {
          error: action.error,
          currentRoom: action.currentRoom,
          retryAfterMs: action.retryAfterMs,
        },
      };
    case "actionError":
      return { ...state, actionError: action.error };
    case "clearErrors":
      return { ...state, actionError: null, joinError: null };
    case "kicked":
    case "closed":
    case "left":
      return { ...INITIAL_ROOM_STATE, ended: action.type };
    default:
      return state;
  }
}
