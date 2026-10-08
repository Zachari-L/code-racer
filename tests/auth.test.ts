import { describe, expect, it } from "bun:test";
import { registerSchema, loginSchema } from "../src/lib/validations/auth";

describe("Authentication Validations (AUTH-1, AUTH-2, AUTH-3)", () => {
  it("validates compliant registration payload", () => {
    const valid = registerSchema.safeParse({
      username: "SpeedDemon_99",
      password: "secretpassword123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects username shorter than 3 characters", () => {
    const invalid = registerSchema.safeParse({
      username: "ab",
      password: "secretpassword123",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects username longer than 20 characters", () => {
    const invalid = registerSchema.safeParse({
      username: "thisusernameiswaytoolongtofitinthelimit",
      password: "secretpassword123",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects special characters in username violating student privacy/safety", () => {
    const invalid = registerSchema.safeParse({
      username: "user@email.com",
      password: "secretpassword123",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const invalid = registerSchema.safeParse({
      username: "RacerOne",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates correct login payload", () => {
    const valid = loginSchema.safeParse({
      username: "TurboTypist",
      password: "anyvalidpassword",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects empty login credentials", () => {
    const invalid = loginSchema.safeParse({
      username: "",
      password: "",
    });
    expect(invalid.success).toBe(false);
  });
});
