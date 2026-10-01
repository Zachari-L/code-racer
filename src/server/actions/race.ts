"use server";

import { prisma } from "@/lib/prisma";
import { generateLobbyCode } from "@/lib/utils";
import {
  createLobbySchema,
  joinLobbySchema,
  type CreateLobbyInput,
  type JoinLobbyInput,
} from "@/lib/validations/race";
import type { PlayerColor } from "@/types/race";

const CAR_COLORS: PlayerColor[] = ["azure", "tangerine", "magenta", "teal"];

const DEFAULT_SAMPLE_TEXTS: Record<string, string> = {
  quotes:
    "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
  code: "function calculateWpm(chars: number, minutes: number): number { return Math.round((chars / 5) / minutes); }",
  moliere:
    "Le petit chat est mort. Que voulez-vous que je dise de plus ? La fortune se joue ainsi de nos desseins.",
  sentences:
    "Les bolides rugissent sur la piste tandis que les doigts pianotent à la vitesse de l'éclair pour décrocher la victoire.",
};

export async function createLobby(input: CreateLobbyInput, hostUserId?: string) {
  const result = createLobbySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message ?? "Configuration de salon invalide",
    };
  }

  const { visibility, textLanguage, textCategory, strictMode, maxDurationSec, hostNickname } =
    result.data;

  try {
    // Generate unique 6-digit lobby code
    let code = generateLobbyCode();
    let existing = await prisma.race.findUnique({ where: { code } });
    while (existing) {
      code = generateLobbyCode();
      existing = await prisma.race.findUnique({ where: { code } });
    }

    // Host user fallback: if no logged-in user, create or find an anonymous host account
    let userId = hostUserId;
    if (!userId) {
      const anonHost = await prisma.user.upsert({
        where: { username: `host_${code}` },
        update: {},
        create: {
          username: `host_${code}`,
          name: hostNickname,
        },
      });
      userId = anonHost.id;
    }

    const textToType = DEFAULT_SAMPLE_TEXTS[textCategory] || DEFAULT_SAMPLE_TEXTS.quotes;

    const race = await prisma.race.create({
      data: {
        code,
        hostId: userId,
        visibility,
        status: "WAITING",
        text: textToType,
        textLanguage,
        textCategory,
        strictMode,
        maxDurationSec,
        estimatedDifficulty: "MEDIUM",
        participants: {
          create: {
            userId: hostUserId ? userId : null,
            guestNickname: hostUserId ? null : hostNickname,
            role: "HOST",
            carColor: CAR_COLORS[0],
          },
        },
      },
      include: {
        participants: true,
      },
    });

    return { success: true, code: race.code, raceId: race.id };
  } catch (error) {
    console.error("Erreur lors de la création du salon:", error);
    return { success: false, error: "Impossible de créer le salon" };
  }
}

export async function joinLobby(input: JoinLobbyInput, userId?: string) {
  const result = joinLobbySchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? "Paramètres invalides" };
  }

  const { code, nickname, isSpectator } = result.data;

  try {
    const race = await prisma.race.findUnique({
      where: { code },
      include: {
        participants: true,
      },
    });

    if (!race) {
      return { success: false, error: "Salon introuvable. Vérifiez le code à 6 chiffres." };
    }

    if (race.status === "FINISHED" || race.status === "CANCELLED") {
      return { success: false, error: "Cette course est déjà terminée." };
    }

    // Max 100 players according to specs
    if (race.participants.length >= 100) {
      return {
        success: false,
        error: "Ce salon a atteint la capacité maximale de 100 participants.",
      };
    }

    // If race has already started, force spectator mode (COURSE-5)
    const effectiveRole =
      race.status === "IN_PROGRESS" || isSpectator ? "SPECTATOR" : "PARTICIPANT";

    // Cycle through player car colors
    const colorIndex = race.participants.length % CAR_COLORS.length;
    const assignedColor = CAR_COLORS[colorIndex];

    const participant = await prisma.participant.create({
      data: {
        raceId: race.id,
        userId: userId ?? null,
        guestNickname: userId ? null : nickname,
        role: effectiveRole,
        carColor: assignedColor,
      },
    });

    return {
      success: true,
      code: race.code,
      raceId: race.id,
      participantId: participant.id,
      role: effectiveRole,
      color: assignedColor,
    };
  } catch (error) {
    console.error("Erreur pour rejoindre le salon:", error);
    return { success: false, error: "Impossible de rejoindre le salon" };
  }
}

export async function getRaceByCode(code: string) {
  try {
    const race = await prisma.race.findUnique({
      where: { code },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
        results: {
          orderBy: { rank: "asc" },
        },
      },
    });

    return race;
  } catch (error) {
    console.error("Erreur lors de la récupération de la course:", error);
    return null;
  }
}
