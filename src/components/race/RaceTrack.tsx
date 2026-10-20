"use client";

import * as React from "react";
import { Bot, CloudFog, Flag, Zap } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { RacerCar } from "@/components/animated/RacerCar";
import { useLanguage } from "@/context/LanguageContext";
import { CHECKPOINTS } from "@/lib/game/bonuses";
import { colorForIndex } from "@/lib/game/colors";
import { formatOrdinal } from "@/lib/i18n";
import type { BonusNotice } from "@/lib/realtime/room-state";
import type { RacerView, TrackEntry } from "@/lib/realtime/protocol";
import { cn } from "@/lib/utils";

const BAR_COLORS = {
  azure: "bg-azure-blue",
  tangerine: "bg-tangerine-orange",
  magenta: "bg-arcade-magenta",
  teal: "bg-victory-teal",
  lime: "bg-electric-lime",
} as const;

/** Live order: finishers first, then by progress. */
export function trackPositions(track: readonly TrackEntry[]): Map<string, number> {
  const order = [...track].sort(
    (a, b) =>
      Number(b.status === "FINISHED") - Number(a.status === "FINISHED") ||
      Number(a.status === "ABANDONED") - Number(b.status === "ABANDONED") ||
      b.progress - a.progress
  );
  return new Map(order.map((entry, index) => [entry.id, index + 1]));
}

interface RaceTrackProps {
  racers: RacerView[];
  track: TrackEntry[];
  youId: string;
  notices: BonusNotice[];
}

/**
 * The progress track (COURSE-05): one lane per racer with avatar, name,
 * position and live WPM. Positions arrive 5 times per second and the cars
 * glide between them with a CSS transition, so motion stays smooth.
 */
export function RaceTrack({ racers, track, youId, notices }: RaceTrackProps) {
  const { t, language } = useLanguage();
  const positions = trackPositions(track);
  const byId = new Map(track.map((entry) => [entry.id, entry]));
  // Many racers: thinner lanes and no smoke, to keep 30 cars fluid (PERF-03).
  const compact = racers.length > 8;

  return (
    <section aria-labelledby="track-title" className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2
          id="track-title"
          className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase"
        >
          <Flag className="text-azure-blue h-4 w-4" aria-hidden />
          {t("race.trackTitle")}
        </h2>
        <span className="font-mono text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
          {t("race.checkpointsHint")}
        </span>
      </div>

      <ol className="border-slate-dark relative space-y-1 rounded-2xl border-3 bg-[#1c1d22] p-2 dark:border-zinc-700">
        {/* Bonus checkpoints, shared by every lane. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-2 right-14 left-52">
          {CHECKPOINTS.map((checkpoint) => (
            <div
              key={checkpoint}
              className="absolute inset-y-0 border-l-2 border-dashed border-white/25"
              style={{ left: `${checkpoint * 100}%` }}
            />
          ))}
        </div>

        {racers.map((racer) => {
          const entry = byId.get(racer.id);
          const progress = entry?.progress ?? 0;
          const isYou = racer.id === youId;
          const color = isYou ? "lime" : colorForIndex(racer.colorIndex);
          const notice = notices.findLast((n) => n.bonus.targetId === racer.id);
          const position = positions.get(racer.id) ?? racers.length;

          return (
            <li
              key={racer.id}
              className={cn(
                "relative flex items-center gap-2 rounded-xl px-2",
                compact ? "h-8" : "h-12",
                isYou ? "bg-electric-lime/15 ring-electric-lime ring-2" : "bg-white/5",
                entry?.status === "ABANDONED" && "opacity-60"
              )}
            >
              {/* Racer label */}
              <div className="flex w-48 shrink-0 items-center gap-1.5 text-white">
                <span className="w-7 text-right font-mono text-[11px] font-black">
                  {formatOrdinal(language, position)}
                </span>
                {!compact && (
                  <Avatar
                    seed={racer.id}
                    name={racer.name}
                    src={racer.avatarUrl}
                    size={24}
                    className="border-white/60"
                  />
                )}
                <span className="truncate text-xs font-black">
                  {racer.name}
                  {isYou && <span className="text-electric-lime"> {t("lobby.you")}</span>}
                </span>
                {racer.isBot && (
                  <span
                    className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase"
                    title={t("race.botTag")}
                  >
                    <Bot className="h-3 w-3" aria-hidden />
                    {t("race.botTag")}
                  </span>
                )}
              </div>

              {/* Road */}
              <div className="relative h-full flex-1">
                <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-200 ease-linear",
                      BAR_COLORS[color]
                    )}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 z-10 -translate-y-1/2 transition-[left] duration-200 ease-linear"
                  style={{ left: `calc(${progress} * (100% - ${compact ? 36 : 52}px))` }}
                >
                  <RacerCar
                    color={color}
                    wpm={entry?.wpm ?? 0}
                    width={compact ? 36 : 52}
                    height={compact ? 18 : 26}
                    showSmoke={!compact && entry?.status === "RACING" && progress > 0.02}
                    showHeadlight={!compact}
                  />
                </div>
                {entry?.fogged && (
                  <CloudFog
                    className="absolute top-1/2 z-20 h-5 w-5 -translate-y-1/2 text-white/90"
                    style={{ left: `calc(${progress} * (100% - 52px) + 40px)` }}
                    aria-label={t("bonus.FOG.title")}
                  />
                )}
                {entry && entry.status !== "RACING" && (
                  <span className="absolute -top-1 left-0 z-30 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#111112] uppercase">
                    {t(`race.status.${entry.status}`)}
                  </span>
                )}
                {notice && (
                  <span
                    role="status"
                    className="bg-electric-lime text-slate-dark absolute -top-1 right-0 z-30 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                  >
                    <Zap className="h-3 w-3" aria-hidden />
                    {t(`bonus.${notice.bonus.type}.title`)}
                  </span>
                )}
              </div>

              {/* Speed and finish */}
              <div className="flex w-12 shrink-0 items-center justify-end gap-1 text-white">
                <span className="font-mono text-[11px] font-black">{entry?.wpm ?? 0}</span>
                <span className="text-[9px] font-bold text-white/70">{t("race.wpmShort")}</span>
              </div>
              <div
                aria-hidden
                className="absolute inset-y-1 right-14 w-1.5 bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:6px_6px]"
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
