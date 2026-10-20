"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { stripAccents } from "@/lib/game/text";
import { cn } from "@/lib/utils";

const LAYOUTS: Record<Locale, string[][]> = {
  fr: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["w", "x", "c", "v", "b", "n", ",", ";", ":", "!"],
  ],
  en: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "?"],
  ],
};

/** Accented letters count on their base key; other symbols stay as they are. */
export function aggregateMissedKeys(missed: Record<string, number>): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [key, count] of Object.entries(missed)) {
    const base = key === "space" ? key : stripAccents(key.toLowerCase());
    totals.set(base, (totals.get(base) ?? 0) + count);
  }
  return totals;
}

interface KeyboardHeatmapProps {
  missedKeys: Record<string, number>;
  layout: Locale;
}

/**
 * Most missed keys of the player (RES-03), as a keyboard heat map: one hue
 * from light to dark, plus a ranked list so the data never relies on colour.
 */
export function KeyboardHeatmap({ missedKeys, layout }: KeyboardHeatmapProps) {
  const { t } = useLanguage();
  const totals = aggregateMissedKeys(missedKeys);
  const max = Math.max(1, ...totals.values());
  const top = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const keyCell = (key: string, wide = false) => {
    const count = totals.get(key) ?? 0;
    const intensity = count / max;
    const label = key === "space" ? t("results.spaceKey") : key.toUpperCase();
    return (
      <li
        key={key}
        tabIndex={count > 0 ? 0 : -1}
        title={t("results.keyMisses", { key: label, count })}
        aria-label={t("results.keyMisses", { key: label, count })}
        className={cn(
          "flex h-9 items-center justify-center rounded-lg border-2 border-zinc-300 font-mono text-xs font-black focus-visible:outline-3 focus-visible:outline-[var(--chart-1)] dark:border-zinc-600",
          wide ? "w-full" : "w-9",
          intensity > 0.55 ? "text-white" : "text-slate-dark dark:text-zinc-100"
        )}
        style={{
          background:
            count === 0
              ? "var(--chart-surface)"
              : `color-mix(in oklab, var(--chart-3) ${20 + intensity * 80}%, var(--chart-surface))`,
        }}
      >
        {label}
      </li>
    );
  };

  return (
    <figure className="space-y-3">
      <div className="space-y-1 overflow-x-auto">
        {LAYOUTS[layout].map((row, index) => (
          <ul key={index} className="flex gap-1" style={{ paddingLeft: index * 10 }}>
            {row.map((key) => keyCell(key))}
          </ul>
        ))}
        <ul className="flex w-[22rem] max-w-full gap-1 pl-16">{keyCell("space", true)}</ul>
      </div>
      <figcaption className="text-sm font-bold">
        {top.length === 0 ? (
          t("results.noMissedKeys")
        ) : (
          <>
            <span>{t("results.mostMissed")} </span>
            <span className="font-mono">
              {top
                .map(([key, count]) =>
                  t("results.keyCount", {
                    key: key === "space" ? t("results.spaceKey") : key.toUpperCase(),
                    count,
                  })
                )
                .join(", ")}
            </span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
