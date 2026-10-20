import { describe, expect, it } from "bun:test";
import {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  isRoomCode,
  normalizeRoomCode,
  roomCodeSchema,
} from "@/lib/room-code";

describe("Room codes (SALLE-02)", () => {
  it("never uses ambiguous characters", () => {
    for (const ambiguous of ["0", "O", "1", "I", "L"]) {
      expect(ROOM_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });

  it("generates 6-character codes from the alphabet", () => {
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(isRoomCode(code)).toBe(true);
    }
  });

  it("normalizes user input", () => {
    expect(normalizeRoomCode(" ab3-k9q ")).toBe("AB3K9Q");
  });

  it("rejects codes with ambiguous or missing characters", () => {
    expect(isRoomCode("AB3K9O")).toBe(false);
    expect(isRoomCode("AB3K9")).toBe(false);
    expect(roomCodeSchema.safeParse("ab3k9q").data).toBe("AB3K9Q");
    expect(roomCodeSchema.safeParse("ABC1EF").success).toBe(false);
  });
});
