import { z } from "zod";

export const joinLobbySchema = z.object({
  code: z
    .string()
    .length(6, "Le code de salon doit comporter exactement 6 chiffres")
    .regex(/^\d{6}$/, "Le code de salon doit être composé de 6 chiffres"),
  nickname: z
    .string()
    .min(2, "Le pseudonyme doit comporter au moins 2 caractères")
    .max(20, "Le pseudonyme ne peut pas dépasser 20 caractères"),
  isSpectator: z.boolean().default(false),
});

export const createLobbySchema = z.object({
  visibility: z.enum(["PUBLIC", "SEMI_PUBLIC", "PRIVATE"]).default("SEMI_PUBLIC"),
  textLanguage: z.enum(["fr", "en"]).default("fr"),
  textCategory: z.enum(["quotes", "code", "sentences", "moliere"]).default("quotes"),
  strictMode: z.boolean().default(false),
  maxDurationSec: z.number().min(30).max(300).default(120),
  hostNickname: z.string().min(2).max(20),
});

export const typingUpdateSchema = z.object({
  raceId: z.string().cuid(),
  participantId: z.string().cuid(),
  charsTyped: z.number().nonnegative(),
  correctChars: z.number().nonnegative(),
  errorCount: z.number().nonnegative(),
  timeElapsedSec: z.number().nonnegative(),
});

export const saveRaceResultSchema = z.object({
  code: z.string().optional(),
  raceId: z.string().optional(),
  wpm: z.number().nonnegative(),
  rawWpm: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  errorsCount: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
  rank: z.number().min(1),
  category: z.string().default("quotes"),
  language: z.string().default("fr"),
  heatmapData: z.record(z.string(), z.number()).optional(),
});

export type JoinLobbyInput = z.infer<typeof joinLobbySchema>;
export type CreateLobbyInput = z.infer<typeof createLobbySchema>;
export type TypingUpdateInput = z.infer<typeof typingUpdateSchema>;
export type SaveRaceResultInput = z.infer<typeof saveRaceResultSchema>;
