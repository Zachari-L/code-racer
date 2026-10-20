import { describe, expect, it } from "bun:test";
import { guestSessionSchema, identityKey, nicknameSchema } from "@/lib/identity";

describe("Guest nicknames (AUTH-02)", () => {
  it("accepts 3 to 20 characters, accents included", () => {
    expect(nicknameSchema.safeParse("Zoé").success).toBe(true);
    expect(nicknameSchema.safeParse("Turbo Tortue_42").success).toBe(true);
    expect(nicknameSchema.safeParse("ab").success).toBe(false);
    expect(nicknameSchema.safeParse("x".repeat(21)).success).toBe(false);
  });

  it("trims spaces and rejects symbols", () => {
    expect(nicknameSchema.parse("  Ace  ")).toBe("Ace");
    expect(nicknameSchema.safeParse("<script>").success).toBe(false);
  });

  it("validates the guest cookie payload", () => {
    expect(guestSessionSchema.safeParse({ id: "g_1234567890ab", nickname: "Ace" }).success).toBe(
      true
    );
    expect(guestSessionSchema.safeParse({ id: "user-1", nickname: "Ace" }).success).toBe(false);
  });

  it("keys identities by kind so users and guests never collide", () => {
    expect(identityKey({ kind: "user", id: "1" })).not.toBe(
      identityKey({ kind: "guest", id: "1" })
    );
  });
});
