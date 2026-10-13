"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateLobbyCode } from "@/lib/utils";
import { getEarnedBadges, toBadgeRecord } from "@/lib/badges";
import { getRaceText } from "@/lib/race-texts";
import {
  createLobbySchema,
  joinLobbySchema,
  saveRaceResultSchema,
  type CreateLobbyInput,
  type JoinLobbyInput,
  type SaveRaceResultInput,
} from "@/lib/validations/race";
import { translateZodError } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n/server";
import type { PlayerColor } from "@/types/race";

const CAR_COLORS: PlayerColor[] = ["azure", "tangerine", "magenta", "teal"];

export async function createLobby(input: CreateLobbyInput, hostUserId?: string) {
  const t = await getTranslator();
  const result = createLobbySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: translateZodError(t, result.error, "errors.invalidLobbyConfig"),
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

    const textToType = getRaceText(textCategory, textLanguage).content;

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
    return { success: false, error: t("errors.lobbyCreateFailed") };
  }
}

export async function joinLobby(input: JoinLobbyInput, userId?: string) {
  const t = await getTranslator();
  const result = joinLobbySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: translateZodError(t, result.error, "errors.invalidParams"),
    };
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
      return { success: false, error: t("errors.lobbyNotFound") };
    }

    if (race.status === "FINISHED" || race.status === "CANCELLED") {
      return { success: false, error: t("errors.raceAlreadyFinished") };
    }

    // Max 100 players according to specs
    if (race.participants.length >= 100) {
      return {
        success: false,
        error: t("errors.lobbyFull"),
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
    return { success: false, error: t("errors.lobbyJoinFailed") };
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

export async function startRace(code: string, hostUserId?: string) {
  const t = await getTranslator();
  try {
    const race = await prisma.race.findUnique({
      where: { code },
      include: { participants: true },
    });

    if (!race) {
      return { success: false, error: t("errors.raceNotFound") };
    }

    if (race.status === "IN_PROGRESS" || race.status === "COUNTDOWN") {
      return { success: true, code: race.code, status: race.status };
    }

    const session = await auth();
    const currentUserId = hostUserId || session?.user?.id;

    // Check host permissions if authenticated user ID is present
    if (currentUserId && race.hostId && race.hostId !== currentUserId) {
      const isHostParticipant = race.participants.some(
        (p) => p.userId === currentUserId && p.role === "HOST"
      );
      if (!isHostParticipant) {
        return { success: false, error: t("errors.onlyHostCanStart") };
      }
    }

    const updated = await prisma.race.update({
      where: { code },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return {
      success: true,
      code: updated.code,
      status: updated.status,
      startedAt: updated.startedAt,
    };
  } catch (error) {
    console.error("Erreur lors du démarrage de la course:", error);
    return { success: false, error: t("errors.raceStartFailed") };
  }
}

export async function getRaceStatus(code: string) {
  const t = await getTranslator();
  try {
    const race = await prisma.race.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        status: true,
        startedAt: true,
        hostId: true,
        textCategory: true,
        textLanguage: true,
        strictMode: true,
        maxDurationSec: true,
        participants: {
          select: {
            id: true,
            userId: true,
            guestNickname: true,
            role: true,
            carColor: true,
            isBot: true,
            botDifficulty: true,
          },
        },
      },
    });

    if (!race) {
      return { success: false, error: t("errors.raceNotFound") };
    }

    return { success: true, race };
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error);
    return { success: false, error: t("errors.raceStatusFailed") };
  }
}

export async function saveRaceResult(input: SaveRaceResultInput) {
  const t = await getTranslator();
  const result = saveRaceResultSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: translateZodError(t, result.error, "errors.invalidResult"),
    };
  }

  const session = await auth();
  const userId = session?.user?.id;
  const username = session?.user?.username ?? session?.user?.name ?? "Invité";

  // Per specifications (PLAY-9):
  // Authenticated users get their results permanently stored and tracked.
  // Guests are only tracked during the current active session.
  if (!userId) {
    return {
      success: true,
      saved: false,
      isGuest: true,
      message: t("errors.guestResultNotSaved"),
    };
  }

  const {
    code = "482910",
    raceId: givenRaceId,
    wpm,
    rawWpm,
    accuracy,
    errorsCount,
    durationMs,
    rank,
    category,
    language,
    heatmapData,
  } = result.data;

  try {
    // 1. Ensure a Race record exists
    let race = givenRaceId
      ? await prisma.race.findUnique({ where: { id: givenRaceId } })
      : await prisma.race.findUnique({ where: { code } });

    if (!race) {
      race = await prisma.race.create({
        data: {
          code,
          hostId: userId,
          visibility: "SEMI_PUBLIC",
          status: "FINISHED",
          textCategory: category,
          textLanguage: language,
          text: "Course enregistrée",
        },
      });
    }

    // 2. Ensure a Participant record exists for this user in this race
    let participant = await prisma.participant.findFirst({
      where: {
        raceId: race.id,
        userId,
      },
    });

    if (!participant) {
      participant = await prisma.participant.create({
        data: {
          raceId: race.id,
          userId,
          role: "PARTICIPANT",
          carColor: "azure",
          progress: 100,
          currentWpm: wpm,
          isFinished: true,
        },
      });
    }

    // 3. Create RaceResult
    const raceResult = await prisma.raceResult.create({
      data: {
        raceId: race.id,
        participantId: participant.id,
        userId,
        nickname: username,
        rank,
        wpm,
        rawWpm,
        accuracy,
        errorsCount,
        durationMs,
        heatmapData: heatmapData ?? undefined,
      },
    });

    // 4. Update or create UserStats
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const prevRaces = currentStats?.totalRaces ?? 0;
    const prevWins = currentStats?.totalWins ?? 0;
    const prevBestWpm = currentStats?.bestWpm ?? 0;
    const prevAvgWpm = currentStats?.averageWpm ?? 0;
    const prevAvgAcc = currentStats?.averageAccuracy ?? 0;
    const prevPlayTime = currentStats?.totalPlayTimeSec ?? 0;

    const newRaces = prevRaces + 1;
    const newWins = rank === 1 ? prevWins + 1 : prevWins;
    const newBestWpm = Math.max(prevBestWpm, wpm);
    const newAvgWpm = Number(((prevAvgWpm * prevRaces + wpm) / newRaces).toFixed(1));
    const newAvgAcc = Number(((prevAvgAcc * prevRaces + accuracy) / newRaces).toFixed(1));
    const newPlayTime = prevPlayTime + Math.round(durationMs / 1000);

    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalRaces: newRaces,
        totalWins: newWins,
        bestWpm: newBestWpm,
        averageWpm: newAvgWpm,
        averageAccuracy: newAvgAcc,
        totalPlayTimeSec: newPlayTime,
      },
      update: {
        totalRaces: newRaces,
        totalWins: newWins,
        bestWpm: newBestWpm,
        averageWpm: newAvgWpm,
        averageAccuracy: newAvgAcc,
        totalPlayTimeSec: newPlayTime,
      },
    });

    // 5. Automatic Badge Unlocks (PLAY-10)
    const earnedBadges = getEarnedBadges({ wpm, accuracy, rank, totalRaces: newRaces });

    for (const earned of earnedBadges) {
      const record = toBadgeRecord(earned);
      const badge = await prisma.badge.upsert({
        where: { code: record.code },
        create: record,
        update: record,
      });

      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
        create: {
          userId,
          badgeId: badge.id,
        },
        update: {},
      });
    }

    return {
      success: true,
      saved: true,
      isGuest: false,
      resultId: raceResult.id,
    };
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du résultat:", error);
    return {
      success: false,
      error: t("errors.resultSaveFailed"),
    };
  }
}
