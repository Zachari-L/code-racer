/**
 * Room configuration (CONF-01 to CONF-11). One Zod schema validates it
 * everywhere: the create-room action, realtime `updateConfig` messages and the
 * JSON stored on `Room.config`.
 */

import { z } from "zod";
import { LOCALES, i18nKey } from "@/lib/i18n";

export const VISIBILITIES = ["PUBLIC", "CODE", "PRIVATE"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const TEXT_MODES = ["COHERENT", "RANDOM"] as const;
export type TextMode = (typeof TEXT_MODES)[number];

export const COMPLEXITIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const ERROR_MODES = ["STRICT", "FREE"] as const;
export type ErrorMode = (typeof ERROR_MODES)[number];

export const BOT_LEVELS = ["NOOB", "BEGINNER", "INTERMEDIATE", "EXPERT", "IMPOSSIBLE"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];

export const MIN_CAPACITY = 2;
export const MAX_CAPACITY = 30;
export const MIN_TIME_LIMIT_SEC = 30;
export const MAX_TIME_LIMIT_SEC = 600;
export const MIN_WORD_COUNT = 10;
export const MAX_WORD_COUNT = 150;
export const MAX_CHAR_FILTER_LENGTH = 30;

const charFilterSchema = z
  .string()
  .max(MAX_CHAR_FILTER_LENGTH, i18nKey("validation.charFilterTooLong"))
  .transform((value) => [...new Set(value.replace(/\s/g, "").toLowerCase())].join(""));

export const botSchema = z.object({
  id: z.string().min(1).max(40),
  level: z.enum(BOT_LEVELS),
});
export type BotConfig = z.infer<typeof botSchema>;

export const roomConfigSchema = z.object({
  visibility: z.enum(VISIBILITIES),
  capacity: z
    .number()
    .int()
    .min(MIN_CAPACITY, i18nKey("validation.capacityRange"))
    .max(MAX_CAPACITY, i18nKey("validation.capacityRange")),
  /** `null` means no time limit (CONF-01). */
  timeLimitSec: z
    .number()
    .int()
    .min(MIN_TIME_LIMIT_SEC, i18nKey("validation.timeLimitRange"))
    .max(MAX_TIME_LIMIT_SEC, i18nKey("validation.timeLimitRange"))
    .nullable(),
  /** Language of the race text, independent of the UI language (CONF-02). */
  language: z.enum(LOCALES),
  textMode: z.enum(TEXT_MODES),
  wordCount: z
    .number()
    .int()
    .min(MIN_WORD_COUNT, i18nKey("validation.wordCountRange"))
    .max(MAX_WORD_COUNT, i18nKey("validation.wordCountRange")),
  complexity: z.enum(COMPLEXITIES),
  punctuation: z.boolean(),
  numbers: z.boolean(),
  capitals: z.boolean(),
  /** Only meaningful for French texts. */
  accents: z.boolean(),
  /** Random mode only (CONF-07): every word contains at least one of these characters. */
  includeChars: charFilterSchema,
  /** Random mode only (CONF-07): no word contains any of these characters. */
  excludeChars: charFilterSchema,
  errorMode: z.enum(ERROR_MODES),
  bonuses: z.boolean(),
  bots: z.array(botSchema).max(MAX_CAPACITY - 1),
});

export type RoomConfig = z.infer<typeof roomConfigSchema>;

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  visibility: "PUBLIC",
  capacity: 8,
  timeLimitSec: 120,
  language: "fr",
  textMode: "COHERENT",
  wordCount: 30,
  complexity: "MEDIUM",
  punctuation: true,
  numbers: false,
  capitals: true,
  accents: true,
  includeChars: "",
  excludeChars: "",
  errorMode: "FREE",
  bonuses: true,
  bots: [],
};

/**
 * Reads a stored config, filling fields added after the room was created with
 * their defaults. Falls back to the defaults if the stored JSON is invalid.
 */
export function parseStoredConfig(value: unknown): RoomConfig {
  const merged =
    typeof value === "object" && value !== null
      ? { ...DEFAULT_ROOM_CONFIG, ...value }
      : DEFAULT_ROOM_CONFIG;
  const result = roomConfigSchema.safeParse(merged);
  return result.success ? result.data : DEFAULT_ROOM_CONFIG;
}
