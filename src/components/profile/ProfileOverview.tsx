"use client";

import * as React from "react";
import { Car, Flag, Lock, Target, Trophy, Wind, Zap } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { LineChart } from "@/components/charts/LineChart";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { BADGES, type BadgeDefinition } from "@/lib/badges";
import { formatMonthYear } from "@/lib/i18n";
import type { ProfileData } from "@/server/profile";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<BadgeDefinition["icon"], typeof Flag> = {
  flag: Flag,
  wind: Wind,
  zap: Zap,
  target: Target,
  trophy: Trophy,
  car: Car,
};

/** Profile header, statistics, WPM progression and badges (AUTH-06). */
export function ProfileOverview({ profile }: { profile: ProfileData }) {
  const { t, language } = useLanguage();
  const number = React.useMemo(
    () => new Intl.NumberFormat(language, { maximumFractionDigits: 1 }),
    [language]
  );
  const date = React.useMemo(
    () => new Intl.DateTimeFormat(language, { dateStyle: "medium" }),
    [language]
  );
  const { stats } = profile;
  const tiles = [
    { label: t("profile.bestWpm"), value: number.format(stats.bestWpm) },
    { label: t("profile.avgWpm"), value: number.format(stats.averageWpm) },
    {
      label: t("profile.avgAccuracy"),
      value: t("results.percent", { value: number.format(stats.averageAccuracy) }),
    },
    { label: t("profile.races"), value: number.format(stats.races) },
    { label: t("profile.wins"), value: number.format(stats.wins) },
  ];
  const points = profile.progression.map((p, index) => ({ x: index + 1, y: p.wpm }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar seed={profile.id} name={profile.displayName} src={profile.avatarUrl} size={80} />
        <div>
          <h1 className="text-3xl font-black uppercase">{profile.displayName}</h1>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            @{profile.username} ·{" "}
            {t("profile.memberSince", { date: formatMonthYear(language, profile.memberSince) })}
          </p>
        </div>
      </header>

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          {t("profile.statsTitle")}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tiles.map((tile) => (
            <Card key={tile.label} className="p-4">
              <dt className="text-xs font-black text-zinc-700 uppercase dark:text-zinc-300">
                {tile.label}
              </dt>
              <dd className="font-mono text-2xl font-black">{tile.value}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <Card>
        <h2 className="mb-3 text-lg font-black uppercase">{t("profile.progressTitle")}</h2>
        {points.length < 2 ? (
          <p className="text-sm font-bold">{t("profile.progressEmpty")}</p>
        ) : (
          <LineChart
            series={[{ id: "wpm", label: t("race.wpmShort"), color: "var(--chart-1)", points }]}
            ariaLabel={t("profile.progressAria", { count: points.length })}
            formatX={(x) => {
              const race = profile.progression[Math.round(x) - 1];
              return race ? date.format(new Date(race.playedAt)) : "";
            }}
            formatY={(y) => number.format(Math.round(y))}
          />
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-black uppercase">{t("profile.badges")}</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {BADGES.map((badge) => {
            const unlocked = profile.badges.includes(badge.code);
            const Icon = unlocked ? BADGE_ICONS[badge.icon] : Lock;
            return (
              <li
                key={badge.code}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 p-3",
                  unlocked
                    ? "border-slate-dark bg-electric-lime/20 dark:border-zinc-600"
                    : "border-dashed border-zinc-300 opacity-70 dark:border-zinc-700"
                )}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-black">{t(badge.titleKey)}</p>
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {unlocked
                      ? t(badge.descriptionKey)
                      : t("profile.badgeLocked", { goal: t(badge.descriptionKey) })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
