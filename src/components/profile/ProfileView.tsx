"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Gauge,
  Flag,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  Zap,
  Swords,
  LogIn,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RacerCar } from "@/components/animated/RacerCar";
import { useLanguage } from "@/context/LanguageContext";
import {
  type UserProfileData,
  type ProfileRacerResult,
  type GetUserProfileResult,
} from "@/server/actions/profile";
import type { PlayerColor } from "@/types/race";

const DEMO_SELF_PROFILE: UserProfileData = {
  username: "TurboTypist",
  isSelf: true,
  level: 18,
  title: "Pilote Vitesse Grand V",
  memberSince: "Février 2025",
  bestWpm: 108,
  averageWpm: 76,
  accuracy: 98.4,
  totalRaces: 284,
  victories: 64,
  podiums: 138,
  carColor: "azure",
  recentRaces: [
    {
      id: "r1",
      date: "Il y a 2h",
      category: "Code TypeScript",
      wpm: 104,
      accuracy: 99.2,
      rank: 1,
      durationMs: 14000,
      errorsCount: 1,
    },
    {
      id: "r2",
      date: "Il y a 5h",
      category: "Citations",
      wpm: 88,
      accuracy: 97.8,
      rank: 2,
      durationMs: 18000,
      errorsCount: 3,
    },
    {
      id: "r3",
      date: "Hier",
      category: "Théâtre Molière",
      wpm: 82,
      accuracy: 98.5,
      rank: 1,
      durationMs: 22000,
      errorsCount: 2,
    },
    {
      id: "r4",
      date: "Il y a 2 jours",
      category: "Code TypeScript",
      wpm: 96,
      accuracy: 96.9,
      rank: 3,
      durationMs: 16000,
      errorsCount: 4,
    },
  ],
  badges: [
    {
      code: "SPEED_100",
      name: "Club 100 WPM",
      description: "Dépassé les 100 WPM",
      iconName: "Flame",
    },
    {
      code: "PERFECT_ACCURACY",
      name: "Précision Parfaite",
      description: "100% de précision",
      iconName: "ShieldCheck",
    },
    {
      code: "FIRST_VICTORY",
      name: "Roi de l'Arène",
      description: "Première victoire",
      iconName: "Trophy",
    },
    {
      code: "VETERAN_5",
      name: "Pilote Assidu",
      description: "5 courses complétées",
      iconName: "Flag",
    },
  ],
};

const DEMO_OTHER_PROFILE: UserProfileData = {
  username: "PixelDriver",
  isSelf: false,
  level: 14,
  title: "As du Clavier",
  memberSince: "Janvier 2025",
  bestWpm: 92,
  averageWpm: 68,
  accuracy: 97.1,
  totalRaces: 195,
  victories: 38,
  podiums: 89,
  carColor: "tangerine",
  recentRaces: [
    {
      id: "r1",
      date: "Il y a 1h",
      category: "Citations",
      wpm: 75,
      accuracy: 96.5,
      rank: 2,
      durationMs: 17000,
      errorsCount: 4,
    },
    {
      id: "r2",
      date: "Il y a 3h",
      category: "Code TypeScript",
      wpm: 88,
      accuracy: 98.0,
      rank: 1,
      durationMs: 15000,
      errorsCount: 2,
    },
    {
      id: "r3",
      date: "Hier",
      category: "Phrases Rapides",
      wpm: 70,
      accuracy: 97.2,
      rank: 2,
      durationMs: 21000,
      errorsCount: 3,
    },
    {
      id: "r4",
      date: "Il y a 3 jours",
      category: "Citations",
      wpm: 78,
      accuracy: 95.8,
      rank: 4,
      durationMs: 19000,
      errorsCount: 5,
    },
  ],
  badges: [
    {
      code: "PERFECT_ACCURACY",
      name: "Précision Parfaite",
      description: "100% de précision",
      iconName: "ShieldCheck",
    },
    {
      code: "FIRST_VICTORY",
      name: "Roi de l'Arène",
      description: "Première victoire",
      iconName: "Trophy",
    },
  ],
};

interface ProfileViewProps {
  initialUsername?: string;
  initialProfileResult?: GetUserProfileResult;
}

export function ProfileView({ initialProfileResult }: ProfileViewProps) {
  const { t } = useLanguage();

  const [profileData] = React.useState<UserProfileData | null>(initialProfileResult?.data ?? null);
  const [isGuest] = React.useState<boolean>(
    initialProfileResult?.isGuest ?? !initialProfileResult?.data
  );
  const [errorMessage] = React.useState<string | null>(
    initialProfileResult?.success === false
      ? (initialProfileResult.error ?? "Erreur lors du chargement")
      : null
  );
  const [demoMode, setDemoMode] = React.useState<"none" | "self" | "other">("none");
  const [equippedColor, setEquippedColor] = React.useState<PlayerColor>(
    initialProfileResult?.data?.carColor ?? "azure"
  );

  // Determine active profile to render
  const activeProfile: UserProfileData = React.useMemo(() => {
    if (demoMode === "self") return DEMO_SELF_PROFILE;
    if (demoMode === "other") return DEMO_OTHER_PROFILE;
    if (profileData) return profileData;
    return DEMO_SELF_PROFILE;
  }, [demoMode, profileData]);

  const isShowingDemo = demoMode !== "none" || (!profileData && !errorMessage);

  if (errorMessage && demoMode === "none") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <div className="border-slate-dark arcade-shadow flex h-16 w-16 items-center justify-center rounded-3xl border-3 bg-rose-50 text-rose-500 dark:border-zinc-700 dark:bg-zinc-800">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-slate-dark text-2xl font-black uppercase dark:text-white">
          {errorMessage}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="lime" size="md" onClick={() => setDemoMode("self")}>
            <Sparkles className="h-4 w-4" /> {t("profile.demoMode")}
          </Button>
          <Link href="/">
            <Button variant="outline" size="md">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Guest Notice Banner (if visitor is an unauthenticated guest) */}
      {(isGuest || isShowingDemo) && (
        <div className="border-slate-dark arcade-shadow flex flex-col items-center justify-between gap-4 rounded-3xl border-3 bg-white p-5 sm:flex-row dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3.5">
            <div className="bg-electric-lime/40 border-slate-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 dark:border-zinc-700">
              <Sparkles className="text-slate-dark h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-dark text-sm font-black uppercase dark:text-white">
                {t("profile.guestBannerTitle")}
              </h3>
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                {t("profile.guestBannerDesc")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/login">
              <Button variant="lime" size="sm" className="gap-2 text-xs">
                <LogIn className="h-4 w-4" /> {t("profile.loginAction")}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Perspective / Demo Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-100/70 p-3 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        <span className="flex items-center gap-1.5 font-black text-zinc-700 uppercase dark:text-zinc-200">
          <Sparkles className="text-tangerine-orange h-4 w-4" />
          {t("profile.previewTag")}
        </span>
        <div className="flex items-center gap-2">
          {profileData && (
            <button
              type="button"
              onClick={() => setDemoMode("none")}
              className={`cursor-pointer rounded-full px-3 py-1 font-black transition-all ${
                demoMode === "none"
                  ? "bg-electric-lime border-slate-dark border-2 text-[#111112] shadow-xs dark:border-zinc-700 dark:text-[#111112]"
                  : "bg-white text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              📊 Données Réelles ({profileData.username})
            </button>
          )}
          <button
            type="button"
            onClick={() => setDemoMode("self")}
            className={`cursor-pointer rounded-full px-3 py-1 font-black transition-all ${
              demoMode === "self"
                ? "bg-electric-lime border-slate-dark border-2 text-[#111112] shadow-xs dark:border-zinc-700 dark:text-[#111112]"
                : "bg-white text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {t("profile.myProfile")}
          </button>
          <button
            type="button"
            onClick={() => setDemoMode("other")}
            className={`cursor-pointer rounded-full px-3 py-1 font-black transition-all ${
              demoMode === "other"
                ? "bg-azure-blue border-slate-dark border-2 text-white shadow-xs dark:border-zinc-700"
                : "bg-white text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {t("profile.otherProfile")}
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="border-slate-dark arcade-shadow flex flex-col items-center justify-between gap-6 rounded-3xl border-3 bg-white p-6 transition-colors duration-150 sm:p-8 md:flex-row dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* Driver Avatar / Equipped Car */}
          <div className="border-slate-dark arcade-shadow relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-3 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
            <RacerCar
              color={activeProfile.isSelf ? equippedColor : activeProfile.carColor}
              width={80}
              height={40}
              showSmoke={false}
              showHeadlight={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-slate-dark text-3xl font-black uppercase sm:text-4xl dark:text-white">
                {activeProfile.username}
              </h1>
              <Badge variant={activeProfile.isSelf ? "lime" : "azure"} className="text-xs">
                {t("profile.level")} {activeProfile.level}
              </Badge>
            </div>

            <p className="text-slate-dark text-sm font-black dark:text-zinc-200">
              {activeProfile.title}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-zinc-500 sm:justify-start dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {t("profile.memberSince")} {activeProfile.memberSince}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="text-victory-teal h-3.5 w-3.5" />
                {t("profile.verified")}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {activeProfile.isSelf ? (
            <Link href="/lobby">
              <Button variant="lime" size="md" pulse={true} className="gap-2 text-xs">
                <Zap className="fill-slate-dark h-4 w-4" /> {t("profile.joinRace")}
              </Button>
            </Link>
          ) : (
            <Link href="/lobby">
              <Button variant="azure" size="md" className="gap-2 text-xs">
                <Swords className="h-4 w-4" /> {t("profile.challengeDuel")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Arcade Key Stats Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {/* Record WPM */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="bg-electric-lime/40 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
            <Flame className="text-slate-dark h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase dark:text-zinc-400">
            {t("profile.recordWpm")}
          </span>
          <span className="text-slate-dark font-mono text-2xl font-black dark:text-white">
            {activeProfile.bestWpm} <span className="text-xs text-zinc-400">WPM</span>
          </span>
        </div>

        {/* Average WPM */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="bg-azure-blue/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
            <Gauge className="text-azure-blue h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase dark:text-zinc-400">
            {t("profile.average")}
          </span>
          <span className="text-slate-dark font-mono text-2xl font-black dark:text-white">
            {activeProfile.averageWpm} <span className="text-xs text-zinc-400">WPM</span>
          </span>
        </div>

        {/* Accuracy */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="bg-victory-teal/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
            <ShieldCheck className="text-victory-teal h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase dark:text-zinc-400">
            {t("profile.precision")}
          </span>
          <span className="text-slate-dark font-mono text-2xl font-black dark:text-white">
            {activeProfile.accuracy}%
          </span>
        </div>

        {/* Total Races */}
        <div className="border-slate-dark arcade-shadow flex flex-col rounded-2xl border-3 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="bg-tangerine-orange/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
            <Flag className="text-tangerine-orange h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase dark:text-zinc-400">
            {t("profile.races")}
          </span>
          <span className="text-slate-dark font-mono text-2xl font-black dark:text-white">
            {activeProfile.totalRaces}
          </span>
        </div>

        {/* Victories */}
        <div className="border-slate-dark arcade-shadow col-span-2 flex flex-col rounded-2xl border-3 bg-white p-4 md:col-span-1 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="bg-arcade-magenta/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
            <Trophy className="text-arcade-magenta h-5 w-5" />
          </div>
          <span className="text-[11px] font-black text-zinc-500 uppercase dark:text-zinc-400">
            {t("profile.victories")}
          </span>
          <span className="text-slate-dark font-mono text-2xl font-black dark:text-white">
            {activeProfile.victories}
          </span>
        </div>
      </div>

      {/* Driver Garage & Customization (when viewing own profile) */}
      {activeProfile.isSelf && (
        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-xl">{t("profile.garageTitle")}</CardTitle>
            <CardDescription>{t("profile.garageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(
                [
                  { id: "azure", name: "Bolide Azure", color: "azure" },
                  { id: "tangerine", name: "Turbo Tangerine", color: "tangerine" },
                  { id: "magenta", name: "Fantôme Magenta", color: "magenta" },
                  { id: "teal", name: "Foudre Teal", color: "teal" },
                ] as const
              ).map((car) => {
                const isSelected = equippedColor === car.color;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setEquippedColor(car.color)}
                    className={`border-slate-dark arcade-shadow flex cursor-pointer flex-col items-center rounded-2xl border-3 p-4 transition-all dark:border-zinc-700 ${
                      isSelected
                        ? "bg-electric-lime/20 ring-electric-lime dark:bg-electric-lime/15 ring-3"
                        : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className="mb-2 flex h-14 w-full items-center justify-center">
                      <RacerCar
                        color={car.color}
                        width={68}
                        height={34}
                        showSmoke={false}
                        showHeadlight={false}
                      />
                    </div>
                    <span className="text-slate-dark text-xs font-black uppercase dark:text-zinc-100">
                      {car.name}
                    </span>
                    <Badge variant={isSelected ? "lime" : "outline"} className="mt-2 text-[10px]">
                      {isSelected ? t("profile.equipped") : t("profile.equip")}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Race History Table */}
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="text-tangerine-orange h-5 w-5" />
            {t("profile.historyTitle")}
          </CardTitle>
          <CardDescription>{t("profile.historyDesc")}</CardDescription>
        </CardHeader>

        <CardContent>
          {activeProfile.recentRaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="border-slate-dark arcade-shadow flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <Flag className="text-azure-blue h-6 w-6" />
              </div>
              <h4 className="text-slate-dark text-sm font-black uppercase dark:text-zinc-200">
                {t("profile.emptyHistoryTitle")}
              </h4>
              <p className="max-w-md text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t("profile.emptyHistoryDesc")}
              </p>
              <Link href="/lobby">
                <Button variant="lime" size="sm" className="mt-2 text-xs">
                  {t("profile.joinRace")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-zinc-200 text-zinc-400 uppercase dark:border-zinc-800 dark:text-zinc-500">
                    <th className="py-2.5 pr-4 font-black">{t("profile.thDate")}</th>
                    <th className="py-2.5 pr-4 font-black">{t("profile.thCategory")}</th>
                    <th className="py-2.5 pr-4 font-black">{t("profile.thSpeed")}</th>
                    <th className="py-2.5 pr-4 font-black">{t("profile.thAccuracy")}</th>
                    <th className="py-2.5 font-black">{t("profile.thRank")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-bold dark:divide-zinc-800">
                  {activeProfile.recentRaces.map((race: ProfileRacerResult) => (
                    <tr key={race.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{race.date}</td>
                      <td className="py-3 pr-4 font-black text-slate-900 dark:text-white">
                        {race.category}
                      </td>
                      <td className="py-3 pr-4 font-mono font-black text-slate-900 dark:text-white">
                        <span className="text-azure-blue">{race.wpm}</span> WPM
                      </td>
                      <td className="text-victory-teal py-3 pr-4 font-mono font-black">
                        {race.accuracy}%
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={race.rank === 1 ? "lime" : race.rank === 2 ? "azure" : "outline"}
                          className="text-[11px]"
                        >
                          {race.rank === 1
                            ? "1er 🥇"
                            : race.rank === 2
                              ? "2e 🥈"
                              : `${race.rank}e 🥉`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges and Achievements Gallery */}
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Award className="text-arcade-magenta h-5 w-5" />
            {t("profile.achievementsTitle")}
          </CardTitle>
          <CardDescription>{t("profile.achievementsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                {
                  code: "SPEED_100",
                  icon: "⚡",
                  title: t("profile.ach100Title"),
                  desc: t("profile.ach100Desc"),
                },
                {
                  code: "PERFECT_ACCURACY",
                  icon: "🎯",
                  title: t("profile.achAccTitle"),
                  desc: t("profile.achAccDesc"),
                },
                {
                  code: "FIRST_VICTORY",
                  icon: "🏆",
                  title: t("profile.achKingTitle"),
                  desc: t("profile.achKingDesc"),
                },
                {
                  code: "VETERAN_5",
                  icon: "🏎️",
                  title: t("profile.achDedTitle"),
                  desc: t("profile.achDedDesc"),
                },
              ] as const
            ).map((ach) => {
              const isUnlocked = activeProfile.badges.some((b) => b.code === ach.code);

              return (
                <div
                  key={ach.code}
                  className={`border-slate-dark flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all dark:border-zinc-700 ${
                    isUnlocked
                      ? "bg-electric-lime/10 dark:bg-electric-lime/15 shadow-xs"
                      : "bg-zinc-50/60 opacity-55 grayscale dark:bg-zinc-800/40"
                  }`}
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-slate-dark text-xs font-black uppercase dark:text-zinc-100">
                      {ach.title}
                    </span>
                    {!isUnlocked && <HelpCircle className="h-3 w-3 text-zinc-400" />}
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    {ach.desc}
                  </span>
                  <Badge
                    variant={isUnlocked ? "lime" : "outline"}
                    className="mt-2 text-[9px] uppercase"
                  >
                    {isUnlocked ? "Débloqué" : "Verrouillé"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
