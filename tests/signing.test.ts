import { describe, expect, it } from "bun:test";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { getAuthSecret, signPayload, verifyPayload } from "@/lib/signing";

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
    expect(verifyPayload(`${signPayload({ id: "g_1" }, SECRET)}.extra`, SECRET, schema)).toBeNull();
    // Correctly signed, but not JSON.
    const data = Buffer.from("not json").toString("base64url");
    const signature = createHmac("sha256", SECRET).update(data).digest("base64url");
    expect(verifyPayload(`${data}.${signature}`, SECRET, schema)).toBeNull();
  });

  it("reads the shared secret from the environment", () => {
    const saved = process.env.AUTH_SECRET;
    try {
      process.env.AUTH_SECRET = "from-env";
      expect(getAuthSecret()).toBe("from-env");
      delete process.env.AUTH_SECRET;
      expect(() => getAuthSecret()).toThrow("AUTH_SECRET is not set");
    } finally {
      process.env.AUTH_SECRET = saved;
    }
  });
});
