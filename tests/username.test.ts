import { describe, expect, it } from "bun:test";
import { USERNAME_PATTERN, toUsernameCandidate, withSuffix } from "@/lib/username";

describe("OAuth usernames", () => {
  it("keeps valid handles and strips invalid characters", () => {
    expect(toUsernameCandidate("octo-cat_42")).toBe("octo-cat_42");
    expect(toUsernameCandidate("Zoé.Dupont!")).toBe("ZoeDupont");
  });

  it("pads handles that are too short and cuts long ones", () => {
    expect(toUsernameCandidate("a")).toBe("racera");
    expect(toUsernameCandidate(undefined)).toBe("racer");
    expect(toUsernameCandidate("x".repeat(40))).toHaveLength(20);
  });

  it("always produces a valid username, even with a suffix", () => {
    for (const handle of ["a", "Zoé.Dupont!", "x".repeat(40), "日本語"]) {
      expect(toUsernameCandidate(handle)).toMatch(USERNAME_PATTERN);
      expect(withSuffix(toUsernameCandidate(handle), 12)).toMatch(USERNAME_PATTERN);
    }
    expect(withSuffix("x".repeat(20), 12)).toBe("x".repeat(18) + "12");
  });
});
