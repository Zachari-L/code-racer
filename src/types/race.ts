export type PlayerColor = "azure" | "tangerine" | "magenta" | "teal";

export const PLAYER_COLORS: Record<
  PlayerColor,
  { hex: string; name: string; bgClass: string; textClass: string; borderClass: string }
> = {
  azure: {
    hex: "#007BFF",
    name: "Azure Blue",
    bgClass: "bg-azure-blue",
    textClass: "text-azure-blue",
    borderClass: "border-azure-blue",
  },
  tangerine: {
    hex: "#FF7A00",
    name: "Tangerine Orange",
    bgClass: "bg-tangerine-orange",
    textClass: "text-tangerine-orange",
    borderClass: "border-tangerine-orange",
  },
  magenta: {
    hex: "#D9008D",
    name: "Arcade Magenta",
    bgClass: "bg-arcade-magenta",
    textClass: "text-arcade-magenta",
    borderClass: "border-arcade-magenta",
  },
  teal: {
    hex: "#00BFA5",
    name: "Victory Teal",
    bgClass: "bg-victory-teal",
    textClass: "text-victory-teal",
    borderClass: "border-victory-teal",
  },
};

export type RaceVisibility = "PUBLIC" | "SEMI_PUBLIC" | "PRIVATE";
export type RaceStatus = "WAITING" | "COUNTDOWN" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
export type ParticipantRole = "HOST" | "PARTICIPANT" | "SPECTATOR";
export type BotDifficulty = "EASY" | "MEDIUM" | "HARD" | "IMPOSSIBLE";

export interface ParticipantState {
  id: string;
  userId?: string | null;
  nickname: string;
  role: ParticipantRole;
  isBot: boolean;
  botDifficulty?: BotDifficulty | null;
  carColor: PlayerColor;
  progress: number; // 0 - 100
  currentWpm: number;
  accuracy: number;
  isFinished: boolean;
  finishRank?: number;
}

export interface RaceConfig {
  code: string;
  visibility: RaceVisibility;
  textLanguage: "fr" | "en";
  textCategory: "quotes" | "code" | "sentences" | "moliere";
  strictMode: boolean;
  maxDurationSec: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
}

export interface TypingTelemetry {
  participantId: string;
  charsTyped: number;
  correctChars: number;
  errorCount: number;
  currentWpm: number;
  accuracy: number;
  progress: number;
  keyErrors: Record<string, number>;
}
