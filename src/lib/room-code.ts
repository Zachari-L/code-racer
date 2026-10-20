import { z } from "zod";
import { i18nKey } from "@/lib/i18n";

/** Uppercase letters and digits without the ambiguous 0/O and 1/I/L (SALLE-02). */
export const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const ROOM_CODE_LENGTH = 6;

const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

/** Uppercases and strips spaces/dashes, so "ab3-k9q" and "AB3K9Q" are the same code. */
export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export function isRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value);
}

export const roomCodeSchema = z
  .string()
  .transform(normalizeRoomCode)
  .refine(isRoomCode, i18nKey("validation.roomCode"));

/**
 * Cryptographically random code. Rejection sampling keeps every character
 * equally likely (256 is not a multiple of the alphabet size).
 */
export function generateRoomCode(): string {
  const alphabetSize = ROOM_CODE_ALPHABET.length;
  const limit = 256 - (256 % alphabetSize);
  let code = "";
  while (code.length < ROOM_CODE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH * 2));
    for (const byte of bytes) {
      if (byte < limit && code.length < ROOM_CODE_LENGTH) {
        code += ROOM_CODE_ALPHABET[byte % alphabetSize];
      }
    }
  }
  return code;
}
