"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { PlayerColor } from "@/types/race";

export interface ProfileRacerResult {
  id: string;
  date: string;
  category: string;
  wpm: number;
  accuracy: number;
  rank: number;
  durationMs: number;
  errorsCount: number;
}

export interface ProfileBadgeInfo {
  code: string;
  name: string;
  description: string;
  iconName: string;
}

export interface UserProfileData {
  username: string;
  isSelf: boolean;
  level: number;
  title: string;
  memberSince: string;
  bestWpm: number;
  averageWpm: number;
  accuracy: number;
  totalRaces: number;
  victories: number;
  podiums: number;
  carColor: PlayerColor;
  recentRaces: ProfileRacerResult[];
  badges: ProfileBadgeInfo[];
}

import { calculateDriverLevel, getDriverTitle } from "@/lib/progression";

export interface GetUserProfileResult {
  success: boolean;
  error?: string;
  isGuest?: boolean;
  data?: UserProfileData;
}

function formatDateFr(date: Date): string {
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatRelativeDate(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
}

export async function getUserProfile(requestedUsername?: string): Promise<GetUserProfileResult> {
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
        error: "Pilote introuvable dans les archives CodeRacer",
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
    const title = getDriverTitle(level);

    const recentRaces: ProfileRacerResult[] = user.results.map((r) => {
      const catMap: Record<string, string> = {
        quotes: "Citations",
        code: "Code TypeScript",
        moliere: "Théâtre Molière",
        sentences: "Phrases Rapides",
      };
      return {
        id: r.id,
        date: formatRelativeDate(r.createdAt),
        category: catMap[r.race?.textCategory ?? "quotes"] ?? "Citations",
        wpm: Math.round(r.wpm),
        accuracy: Number(r.accuracy.toFixed(1)),
        rank: r.rank,
        durationMs: r.durationMs,
        errorsCount: r.errorsCount,
      };
    });

    const badges: ProfileBadgeInfo[] = user.badges.map((ub) => ({
      code: ub.badge.code,
      name: ub.badge.name,
      description: ub.badge.description,
      iconName: ub.badge.iconName,
    }));

    return {
      success: true,
      isGuest: false,
      data: {
        username: user.username,
        isSelf,
        level,
        title,
        memberSince: formatDateFr(user.createdAt),
        bestWpm: Math.round(stats?.bestWpm ?? 0),
        averageWpm: Math.round(stats?.averageWpm ?? 0),
        accuracy: Number((stats?.averageAccuracy ?? 100).toFixed(1)),
        totalRaces,
        victories,
        podiums,
        carColor: "azure",
        recentRaces,
        badges,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return {
      success: false,
      error: "Impossible de charger les données du profil",
    };
  }
}
