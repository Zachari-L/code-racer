"use server";

import { z } from "zod";
import { DEFAULT_ROOM_CONFIG, parseStoredConfig, roomConfigSchema } from "@/lib/game/config";
import { translateZodError } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/room-code";
import { countParticipants, pickQuickRace } from "@/lib/rooms";
import { getCurrentIdentity } from "@/server/identity";
import { getRealtimeBridge } from "@/server/realtime/bridge";

const createRoomSchema = z.object({
  config: roomConfigSchema,
  /** The host may only watch (SALLE-01). */
  hostRole: z.enum(["PARTICIPANT", "SPECTATOR"]),
  leaveCurrent: z.boolean().default(false),
});

export type CreateRoomResult =
  { success: true; code: string } | { success: false; error: string; currentRoom?: string };

/** Creates a room hosted by the signed-in user. Guests cannot (AUTH-03). */
export async function createRoom(input: unknown): Promise<CreateRoomResult> {
  const t = await getTranslator();
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: translateZodError(t, parsed.error, "errors.invalidLobbyConfig"),
    };
  }
  const identity = await getCurrentIdentity();
  if (identity?.kind !== "user") return { success: false, error: t("errors.signInToHost") };

  const { config, hostRole, leaveCurrent } = parsed.data;
  if (config.bots.length + (hostRole === "PARTICIPANT" ? 1 : 0) > config.capacity) {
    return { success: false, error: t("validation.capacityRange") };
  }

  try {
    const current = await prisma.roomMember.findUnique({
      where: { userId: identity.id },
      include: { room: { select: { code: true } } },
    });
    if (current) {
      // One room at a time (SALLE-06).
      if (!leaveCurrent) {
        return { success: false, error: t("errors.alreadyInRoom"), currentRoom: current.room.code };
      }
      const bridge = getRealtimeBridge();
      if (bridge) await bridge.leaveCurrentRoom(identity);
      else await prisma.roomMember.deleteMany({ where: { id: current.id } });
    }

    let code = generateRoomCode();
    while (await prisma.room.findUnique({ where: { code }, select: { id: true } })) {
      code = generateRoomCode();
    }
    await prisma.room.create({
      data: {
        code,
        hostId: identity.id,
        visibility: config.visibility,
        capacity: config.capacity,
        config,
        language: config.language,
        complexity: config.complexity,
        members: { create: { userId: identity.id, nickname: identity.name, role: hostRole } },
      },
    });
    await getRealtimeBridge()?.roomCreated(code);
    return { success: true, code };
  } catch (error) {
    console.error("createRoom failed:", error);
    return { success: false, error: t("errors.lobbyCreateFailed") };
  }
}

/** Public room to join right away (JOIN-03), or `null` if none is available. */
export async function findQuickRace(): Promise<
  { success: true; code: string | null } | { success: false; error: string }
> {
  try {
    const rooms = await prisma.room.findMany({
      where: { visibility: "PUBLIC", status: { in: ["WAITING", "RESULTS"] } },
      include: { members: { select: { role: true } } },
    });
    const code = pickQuickRace(
      rooms.map((room) => ({
        code: room.code,
        phase: room.status,
        capacity: room.capacity,
        createdAt: room.createdAt,
        participants: countParticipants(room.members, parseStoredConfig(room.config).bots.length),
      }))
    );
    return { success: true, code };
  } catch (error) {
    console.error("findQuickRace failed:", error);
    const t = await getTranslator();
    return { success: false, error: t("errors.lobbyJoinFailed") };
  }
}

/** Creates a public room with the default configuration (JOIN-03 fallback). */
export async function createDefaultPublicRoom(leaveCurrent = false): Promise<CreateRoomResult> {
  return createRoom({
    config: { ...DEFAULT_ROOM_CONFIG, visibility: "PUBLIC" },
    hostRole: "PARTICIPANT",
    leaveCurrent,
  });
}
