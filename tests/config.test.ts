import { describe, expect, it } from "bun:test";
import { DEFAULT_ROOM_CONFIG, parseStoredConfig, roomConfigSchema } from "@/lib/game/config";

describe("Room configuration", () => {
  it("accepts the defaults", () => {
    expect(roomConfigSchema.safeParse(DEFAULT_ROOM_CONFIG).success).toBe(true);
  });

  it("allows no time limit or 30 s to 10 min (CONF-01)", () => {
    const parse = (timeLimitSec: number | null) =>
      roomConfigSchema.safeParse({ ...DEFAULT_ROOM_CONFIG, timeLimitSec }).success;
    expect(parse(null)).toBe(true);
    expect(parse(30)).toBe(true);
    expect(parse(600)).toBe(true);
    expect(parse(29)).toBe(false);
    expect(parse(601)).toBe(false);
  });

  it("limits capacity to 2-30 participants (SALLE-05)", () => {
    const parse = (capacity: number) =>
      roomConfigSchema.safeParse({ ...DEFAULT_ROOM_CONFIG, capacity }).success;
    expect(parse(1)).toBe(false);
    expect(parse(2)).toBe(true);
    expect(parse(30)).toBe(true);
    expect(parse(31)).toBe(false);
  });

  it("normalizes character filters to unique lowercase characters", () => {
    const result = roomConfigSchema.parse({ ...DEFAULT_ROOM_CONFIG, excludeChars: "Q q z Z" });
    expect(result.excludeChars).toBe("qz");
  });

  it("fills missing stored fields with defaults and rejects garbage", () => {
    expect(parseStoredConfig({ capacity: 12 }).capacity).toBe(12);
    expect(parseStoredConfig({ capacity: 12 }).errorMode).toBe(DEFAULT_ROOM_CONFIG.errorMode);
    expect(parseStoredConfig("nope")).toEqual(DEFAULT_ROOM_CONFIG);
    expect(parseStoredConfig({ capacity: 999 })).toEqual(DEFAULT_ROOM_CONFIG);
  });
});
