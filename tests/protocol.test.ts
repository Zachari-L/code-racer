import { describe, expect, it } from "bun:test";
import { DEFAULT_ROOM_CONFIG } from "@/lib/game/config";
import { clientMessageSchema } from "@/lib/realtime/protocol";

const parse = (value: unknown) => clientMessageSchema.safeParse(value);

describe("Realtime client messages (TECH-07)", () => {
  it("accepts well-formed messages and normalizes room codes", () => {
    const join = parse({ type: "join", code: "ab3k9q" });
    expect(join.success && join.data).toEqual({
      type: "join",
      code: "AB3K9Q",
      asSpectator: false,
      leaveCurrent: false,
    });
    expect(parse({ type: "input", keys: [{ k: "c", c: "a" }, { k: "b" }] }).success).toBe(true);
    expect(parse({ type: "updateConfig", config: DEFAULT_ROOM_CONFIG }).success).toBe(true);
  });

  it("rejects unknown types, extra-long batches and multi-character keys", () => {
    expect(parse({ type: "hack" }).success).toBe(false);
    expect(parse({ type: "input", keys: [{ k: "c", c: "ab" }] }).success).toBe(false);
    const tooMany = Array.from({ length: 61 }, () => ({ k: "c", c: "a" }));
    expect(parse({ type: "input", keys: tooMany }).success).toBe(false);
    expect(parse({ type: "join", code: "000000" }).success).toBe(false);
  });

  it("rejects invalid configurations", () => {
    const config = { ...DEFAULT_ROOM_CONFIG, capacity: 99 };
    expect(parse({ type: "updateConfig", config }).success).toBe(false);
  });
});
