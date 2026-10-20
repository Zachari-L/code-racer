import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { signPayload, verifyPayload } from "@/lib/signing";

const schema = z.object({ id: z.string() });
const SECRET = "test-secret";

describe("Signed payloads", () => {
  it("round-trips a payload", () => {
    const token = signPayload({ id: "g_1" }, SECRET);
    expect(verifyPayload(token, SECRET, schema)).toEqual({ id: "g_1" });
  });

  it("rejects a tampered payload or a wrong secret", () => {
    const token = signPayload({ id: "g_1" }, SECRET);
    const [, signature] = token.split(".");
    const forged = `${Buffer.from(JSON.stringify({ id: "admin" })).toString("base64url")}.${signature}`;
    expect(verifyPayload(forged, SECRET, schema)).toBeNull();
    expect(verifyPayload(token, "other-secret", schema)).toBeNull();
  });

  it("rejects malformed tokens and payloads that do not match the schema", () => {
    expect(verifyPayload(undefined, SECRET, schema)).toBeNull();
    expect(verifyPayload("garbage", SECRET, schema)).toBeNull();
    expect(verifyPayload(signPayload({ id: 3 }, SECRET), SECRET, schema)).toBeNull();
  });
});
