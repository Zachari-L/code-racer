/**
 * WebSocket protocol between browsers and the realtime server (see the message
 * flow in docs/ARCHITECTURE.md). Client messages are validated with Zod before
 * anything else happens (TECH-07); server messages are plain typed JSON.
 */

import { z } from "zod";
import { roomConfigSchema, type BotLevel, type RoomConfig } from "@/lib/game/config";
import type { BonusType } from "@/lib/game/bonuses";
import type { RacerStatus } from "@/lib/game/ranking";
import type { RoomPhase } from "@/lib/game/state-machine";
import { roomCodeSchema } from "@/lib/room-code";

export const REALTIME_PATH = "/ws";

/** At most 10 input messages per second per player (PERF-02). */
export const INPUT_FLUSH_MS = 100;
/** Track updates broadcast to the room, 5 per second (COURSE-05). */
export const TRACK_BROADCAST_MS = 200;
/** Disconnected people keep their place this long (COURSE-08). */
export const RECONNECT_GRACE_MS = 30_000;

const keyInputSchema = z.discriminatedUnion("k", [
  z.object({ k: z.literal("c"), c: z.string().length(1) }),
  z.object({ k: z.literal("b") }),
]);

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auth"), ticket: z.string().max(2000).nullable() }),
  z.object({ type: z.literal("ping"), t: z.number() }),
  z.object({
    type: z.literal("join"),
    code: roomCodeSchema,
    asSpectator: z.boolean().default(false),
    invite: z.string().max(64).optional(),
    leaveCurrent: z.boolean().default(false),
  }),
  z.object({ type: z.literal("leave") }),
  z.object({ type: z.literal("setRole"), role: z.enum(["PARTICIPANT", "SPECTATOR"]) }),
  z.object({ type: z.literal("updateConfig"), config: roomConfigSchema }),
  z.object({ type: z.literal("createInvite") }),
  z.object({ type: z.literal("kick"), memberId: z.string().min(1).max(40) }),
  z.object({ type: z.literal("start") }),
  z.object({
    type: z.literal("input"),
    keys: z.array(keyInputSchema).min(1).max(60),
  }),
  z.object({ type: z.literal("abandon") }),
  z.object({ type: z.literal("restart") }),
  z.object({ type: z.literal("close") }),
  z.object({ type: z.literal("subscribeExplorer") }),
]);

export type ClientMessage = z.input<typeof clientMessageSchema>;
export type ParsedClientMessage = z.output<typeof clientMessageSchema>;

/** Reasons a join can fail; each has a `room.error.<code>` translation. */
export const JOIN_ERRORS = [
  "notSignedIn",
  "notFound",
  "closed",
  "inProgress",
  "full",
  "private",
  "banned",
  "inviteInvalid",
  "inviteUsed",
  "rateLimited",
  "alreadyInRoom",
] as const;
export type JoinError = (typeof JOIN_ERRORS)[number];

/** Reasons a room action can be refused; each has a `room.actionError.<code>` translation. */
export const ACTION_ERRORS = [
  "notHost",
  "notInRoom",
  "wrongPhase",
  "notEnoughParticipants",
  "noHuman",
  "overCapacity",
  "invalid",
  "noText",
] as const;
export type ActionError = (typeof ACTION_ERRORS)[number];

export interface MemberView {
  id: string;
  name: string;
  kind: "user" | "guest";
  role: "PARTICIPANT" | "SPECTATOR";
  isHost: boolean;
  connected: boolean;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface BotView {
  id: string;
  name: string;
  level: BotLevel;
}

export interface InviteView {
  id: string;
  url: string;
  createdAt: string;
  usedByName: string | null;
  revoked: boolean;
}

export interface RacerView {
  id: string;
  name: string;
  isBot: boolean;
  botLevel: BotLevel | null;
  avatarUrl: string | null;
  colorIndex: number;
}

export interface TrackEntry {
  id: string;
  progress: number;
  wpm: number;
  status: RacerStatus;
  bonuses: number;
  fogged: boolean;
}

export interface ResultRow {
  racerId: string;
  userId: string | null;
  name: string;
  isBot: boolean;
  botLevel: BotLevel | null;
  rank: number;
  status: Exclude<RacerStatus, "RACING">;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  durationMs: number;
  progress: number;
  bonuses: BonusType[];
  wpmSeries: { t: number; wpm: number }[];
  missedKeys: Record<string, number>;
  isPersonalBest: boolean;
}

export interface RaceResultsData {
  raceId: string | null;
  startedAt: string;
  text: string;
  language: RoomConfig["language"];
  rows: ResultRow[];
}

export interface RaceView {
  /** Server time (ms) at which typing opens. */
  goAt: number;
  /** Server time (ms) at which the time limit ends the race, if any. */
  endsAt: number | null;
  text: string;
  errorMode: RoomConfig["errorMode"];
  racers: RacerView[];
  track: TrackEntry[];
  results: RaceResultsData | null;
}

export interface RoomSnapshot {
  code: string;
  phase: RoomPhase;
  config: RoomConfig;
  members: MemberView[];
  bots: BotView[];
  /** Id of the viewer's member record. */
  youId: string;
  /** Only sent to the host (SALLE-04). */
  invites: InviteView[] | null;
  race: RaceView | null;
}

export interface SelfState {
  text: string;
  typed: string;
  keystrokes: number;
  correctKeystrokes: number;
  errors: number;
  missedKeys: Record<string, number>;
  status: RacerStatus;
  fogUntil: number | null;
}

export interface BonusEvent {
  type: BonusType;
  beneficiaryId: string;
  targetId: string;
  checkpoint: number;
}

export interface ExplorerRoom {
  code: string;
  hostName: string;
  participants: number;
  capacity: number;
  language: RoomConfig["language"];
  complexity: RoomConfig["complexity"];
  phase: RoomPhase;
  createdAt: string;
}

export type ServerMessage =
  | { type: "hello"; serverNow: number; signedIn: boolean }
  | { type: "pong"; t: number; serverNow: number }
  | { type: "joinError"; error: JoinError; currentRoom?: string; retryAfterMs?: number }
  | { type: "actionError"; error: ActionError; detail?: string }
  | { type: "room"; room: RoomSnapshot; serverNow: number }
  | { type: "track"; track: TrackEntry[]; serverNow: number }
  | { type: "self"; self: SelfState }
  | { type: "bonus"; bonus: BonusEvent }
  | { type: "left" }
  | { type: "kicked" }
  | { type: "closed" }
  | { type: "explorer"; rooms: ExplorerRoom[] };
