"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslator } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import type { PlayerColor } from "@/lib/game/colors";

export interface ProfileRacerResult {
  id: string;
  /** ISO timestamp, formatted in the viewer's locale by the client. */
  playedAt: string;
  /** Text category code (`quotes`, `code`, `moliere`, `sentences`). */
  category: string;
  wpm: number;
  accuracy: number;
  rank: number;
  durationMs: number;
  errorsCount: number;
}

export interface UserProfileData {
  username: string;
  isSelf: boolean;
  level: number;
  titleKey: TranslationKey;
  /** ISO timestamp of account creation. */
  memberSince: string;
  bestWpm: number;
  averageWpm: number;
  accuracy: number;
  totalRaces: number;
  victories: number;
  podiums: number;
  carColor: PlayerColor;
  recentRaces: ProfileRacerResult[];
  /** Codes of unlocked badges; see `BADGES` in `@/lib/badges` for display data. */
  unlockedBadges: string[];
}

import { calculateDriverLevel, getDriverTitleKey } from "@/lib/progression";

export interface GetUserProfileResult {
  success: boolean;
  error?: string;
  isGuest?: boolean;
  data?: UserProfileData;
}

export async function getUserProfile(requestedUsername?: string): Promise<GetUserProfileResult> {
  const t = await getTranslator();
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const currentUsername = session?.user?.username;

    // Target username to inspect
    let targetUsername = requestedUsername?.trim();

    // If no username is specified, default to the logged-in user
    if (!targetUsername) {
      if (!currentUsername && !currentUserId) {
        return {
          success: true,
          isGuest: true,
          data: undefined,
        };
      }
      targetUsername = currentUsername;
    }

    // Query user in DB
    const user = await prisma.user.findFirst({
      where: targetUsername
        ? { username: { equals: targetUsername, mode: "insensitive" } }
        : { id: currentUserId },
      include: {
        stats: true,
        results: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            race: true,
          },
        },
        badges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: t("errors.driverNotFound"),
      };
    }

    const isSelf = Boolean(
      (currentUserId && user.id === currentUserId) ||
      (currentUsername && user.username.toLowerCase() === currentUsername.toLowerCase())
    );

    const stats = user.stats;
    const totalRaces = stats?.totalRaces ?? user.results.length;
    const victories = stats?.totalWins ?? user.results.filter((r) => r.rank === 1).length;
    const podiums = user.results.filter((r) => r.rank <= 3).length;
    const level = calculateDriverLevel(totalRaces, victories);
    const titleKey = getDriverTitleKey(level);

    const recentRaces: ProfileRacerResult[] = user.results.map((r) => ({
      id: r.id,
      playedAt: r.createdAt.toISOString(),
      category: r.race?.textCategory ?? "quotes",
      wpm: Math.round(r.wpm),
      accuracy: Number(r.accuracy.toFixed(1)),
      rank: r.rank,
      durationMs: r.durationMs,
      errorsCount: r.errorsCount,
    }));

    const unlockedBadges = user.badges.map((ub) => ub.badge.code);

    return {
      success: true,
      isGuest: false,
      data: {
        username: user.username,
        isSelf,
        level,
        titleKey,
        memberSince: user.createdAt.toISOString(),
        bestWpm: Math.round(stats?.bestWpm ?? 0),
        averageWpm: Math.round(stats?.averageWpm ?? 0),
        accuracy: Number((stats?.averageAccuracy ?? 100).toFixed(1)),
        totalRaces,
        victories,
        podiums,
        carColor: "azure",
        recentRaces,
        unlockedBadges,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return {
      success: false,
      error: t("errors.profileLoadFailed"),
    };
  }
}
