import { describe, expect, it } from "bun:test";
import {
  checkInvite,
  clientIp,
  countParticipants,
  generateInviteToken,
  pickNextHost,
  pickQuickRace,
  type InviteRecord,
} from "@/lib/rooms";

const unused: InviteRecord = {
  usedAt: null,
  usedIp: null,
  usedByUserId: null,
  usedByGuestId: null,
  revokedAt: null,
};

describe("Invitation links (SALLE-04)", () => {
  it("uses 128-bit random tokens", () => {
    const token = generateInviteToken();
    expect(Buffer.from(token, "base64url")).toHaveLength(16);
    expect(generateInviteToken()).not.toBe(token);
  });

  it("is claimed once, then only reusable by the same person and IP", () => {
    const visitor = { kind: "guest" as const, id: "g_1", ip: "1.2.3.4" };
    expect(checkInvite(unused, visitor)).toBe("claim");
    const claimed = { ...unused, usedAt: new Date(), usedIp: "1.2.3.4", usedByGuestId: "g_1" };
    expect(checkInvite(claimed, visitor)).toBe("reuse");
    expect(checkInvite(claimed, { ...visitor, ip: "5.6.7.8" })).toBe("used");
    expect(checkInvite(claimed, { ...visitor, id: "g_2" })).toBe("used");
    expect(checkInvite(claimed, { kind: "user", id: "g_1", ip: "1.2.3.4" })).toBe("used");
  });

  it("refuses revoked links", () => {
    expect(
      checkInvite({ ...unused, revokedAt: new Date() }, { kind: "user", id: "u", ip: "x" })
    ).toBe("revoked");
  });
});

describe("Host succession (SALLE-08)", () => {
  const at = (minutes: number) => new Date(2025, 0, 1, 10, minutes);
  const members = [
    { id: "host", userId: "u0", joinedAt: at(0) },
    { id: "guest", userId: null, joinedAt: at(1) },
    { id: "late", userId: "u2", joinedAt: at(5) },
    { id: "early", userId: "u1", joinedAt: at(2) },
  ];

  it("picks the signed-in person present the longest, never a guest", () => {
    expect(pickNextHost(members, "host")?.id).toBe("early");
  });

  it("returns null when only guests remain", () => {
    expect(pickNextHost(members.slice(0, 2), "host")).toBeNull();
  });
});

describe("Capacity (SALLE-05)", () => {
  it("counts participants and bots, not spectators", () => {
    expect(
      countParticipants(
        [{ role: "PARTICIPANT" }, { role: "SPECTATOR" }, { role: "PARTICIPANT" }],
        3
      )
    ).toBe(5);
  });
});

describe("Quick race (JOIN-03)", () => {
  const room = (code: string, participants: number, capacity: number, minute = 0) => ({
    code,
    participants,
    capacity,
    phase: "WAITING" as const,
    createdAt: new Date(2025, 0, 1, 10, minute),
  });

  it("picks the open room closest to capacity, oldest first on ties", () => {
    expect(pickQuickRace([room("A", 1, 8), room("B", 5, 8), room("C", 3, 4, 5)])).toBe("C");
    expect(pickQuickRace([room("NEW", 3, 4, 9), room("OLD", 3, 4, 1)])).toBe("OLD");
  });

  it("skips full rooms and races in progress", () => {
    expect(
      pickQuickRace([room("FULL", 4, 4), { ...room("RUN", 1, 4), phase: "RACING" }])
    ).toBeNull();
    expect(pickQuickRace([{ ...room("DONE", 1, 4), phase: "RESULTS" }])).toBe("DONE");
  });
});

describe("Client IP", () => {
  it("only trusts proxy headers behind a proxy", () => {
    const headers = { "x-forwarded-for": "9.9.9.9, 10.0.0.1" };
    expect(clientIp(headers, "127.0.0.1", true)).toBe("9.9.9.9");
    expect(clientIp(headers, "127.0.0.1", false)).toBe("127.0.0.1");
    expect(clientIp({ "fly-client-ip": "8.8.8.8", ...headers }, undefined, true)).toBe("8.8.8.8");
  });
});
