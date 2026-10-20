"use client";

import * as React from "react";
import { Bot, Medal, Trophy } from "lucide-react";
import { KeyboardHeatmap } from "@/components/charts/KeyboardHeatmap";
import { LineChart, seriesColor } from "@/components/charts/LineChart";
import { useLanguage } from "@/context/LanguageContext";
import type { RaceResultsData, ResultRow } from "@/lib/realtime/protocol";
import { cn } from "@/lib/utils";

interface ResultsViewProps {
  data: RaceResultsData;
  /** `racerId` of the person looking at the page, if they raced. */
  viewerId: string | null;
  /** Host controls or navigation, shown under the podium. */
  actions?: React.ReactNode;
}

const PODIUM_STYLE = [
  { height: "h-28", bg: "bg-electric-lime text-[#111112]", order: "order-2" },
  { height: "h-20", bg: "bg-azure-deep text-white", order: "order-1" },
  { height: "h-14", bg: "bg-tangerine-orange text-[#111112]", order: "order-3" },
];

export function ResultsView({ data, viewerId, actions }: ResultsViewProps) {
  const { t, language } = useLanguage();
  const number = React.useMemo(
    () => new Intl.NumberFormat(language, { maximumFractionDigits: 1 }),
    [language]
  );
  const seconds = (ms: number) => t("results.seconds", { value: number.format(ms / 1000) });
  const viewer = data.rows.find((row) => row.racerId === viewerId) ?? null;
  const podium = data.rows.slice(0, 3);

  // The viewer is drawn in ink; the others take palette slots in table order.
  const others = data.rows.filter((row) => row.racerId !== viewerId);
  const series = data.rows.map((row) => ({
    id: row.racerId,
    label: row.name,
    color: row.racerId === viewerId ? "var(--chart-ink)" : seriesColor(others.indexOf(row)),
    emphasized: row.racerId === viewerId,
    points: row.wpmSeries.map((p) => ({ x: p.t, y: p.wpm })),
  }));

  const statusLabel = (row: ResultRow) => t(`race.status.${row.status}`);

  return (
    <div className="space-y-6">
      {viewer?.isPersonalBest && (
        <p
          role="status"
          className="bg-electric-lime border-slate-dark arcade-shadow flex items-center justify-center gap-2 rounded-2xl border-3 px-4 py-3 text-base font-black text-[#111112] uppercase"
        >
          <Trophy className="h-5 w-5" aria-hidden />
          {t("results.personalBest", { wpm: number.format(viewer.wpm) })}
        </p>
      )}

      {/* Podium (RES-01) */}
      <section aria-labelledby="podium-title">
        <h2 id="podium-title" className="mb-3 text-lg font-black uppercase">
          {t("results.podium")}
        </h2>
        <ol className="flex items-end justify-center gap-3">
          {podium.map((row, index) => (
            <li
              key={row.racerId}
              className={cn(
                "flex w-28 flex-col items-center gap-1 sm:w-36",
                PODIUM_STYLE[index].order
              )}
            >
              <span className="max-w-full truncate text-sm font-black">{row.name}</span>
              <span className="font-mono text-xs font-bold">
                {t("race.wpmValue", { wpm: number.format(row.wpm) })}
              </span>
              <div
                className={cn(
                  "border-slate-dark flex w-full items-start justify-center rounded-t-2xl border-3 pt-2 dark:border-zinc-700",
                  PODIUM_STYLE[index].height,
                  PODIUM_STYLE[index].bg
                )}
              >
                <span className="flex items-center gap-1 text-2xl font-black">
                  <Medal className="h-5 w-5" aria-hidden />
                  {row.rank}
                </span>
              </div>
            </li>
          ))}
        </ol>
        {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
      </section>

      {/* Full table (RES-02) */}
      <section aria-labelledby="table-title" className="overflow-x-auto">
        <h2 id="table-title" className="mb-3 text-lg font-black uppercase">
          {t("results.tableTitle")}
        </h2>
        <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-sm">
          <thead className="text-xs font-black uppercase">
            <tr>
              {(
                [
                  "rank",
                  "racer",
                  "wpm",
                  "rawWpm",
                  "accuracy",
                  "errors",
                  "time",
                  "status",
                  "bonuses",
                ] as const
              ).map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="border-slate-dark border-b-3 px-2 py-2 dark:border-zinc-600"
                >
                  {t(`results.col.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-semibold">
            {data.rows.map((row) => (
              <tr
                key={row.racerId}
                className={cn(row.racerId === viewerId && "bg-electric-lime/25")}
              >
                <td className="border-b border-zinc-200 px-2 py-2 font-black dark:border-zinc-700">
                  {row.rank}
                </td>
                <th
                  scope="row"
                  className="border-b border-zinc-200 px-2 py-2 font-black dark:border-zinc-700"
                >
                  <span className="flex items-center gap-1.5">
                    {row.name}
                    {row.isBot && (
                      <span className="flex items-center gap-0.5 rounded-full bg-zinc-200 px-1.5 text-[10px] uppercase dark:bg-zinc-700">
                        <Bot className="h-3 w-3" aria-hidden />
                        {t("race.botTag")}
                      </span>
                    )}
                  </span>
                </th>
                <td className="border-b border-zinc-200 px-2 py-2 font-mono dark:border-zinc-700">
                  {number.format(row.wpm)}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 font-mono dark:border-zinc-700">
                  {number.format(row.rawWpm)}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 font-mono dark:border-zinc-700">
                  {t("results.percent", { value: number.format(row.accuracy) })}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 font-mono dark:border-zinc-700">
                  {row.errors}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 font-mono dark:border-zinc-700">
                  {seconds(row.durationMs)}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 dark:border-zinc-700">
                  {statusLabel(row)}
                  {row.status !== "FINISHED" && (
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {" "}
                      ({t("results.percent", { value: number.format(row.progress * 100) })})
                    </span>
                  )}
                </td>
                <td className="border-b border-zinc-200 px-2 py-2 dark:border-zinc-700">
                  {row.bonuses.length === 0
                    ? "-"
                    : row.bonuses.map((type) => t(`bonus.${type}.title`)).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Charts (RES-03) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="wpm-chart-title">
          <h2 id="wpm-chart-title" className="mb-3 text-lg font-black uppercase">
            {t("results.wpmChart")}
          </h2>
          <LineChart
            series={series}
            ariaLabel={t("results.wpmChartAria")}
            formatX={(x) => seconds(x * 1000)}
            formatY={(y) => number.format(Math.round(y))}
          />
        </section>
        {viewer && (
          <section aria-labelledby="heatmap-title">
            <h2 id="heatmap-title" className="mb-3 text-lg font-black uppercase">
              {t("results.heatmap")}
            </h2>
            <KeyboardHeatmap missedKeys={viewer.missedKeys} layout={data.language} />
          </section>
        )}
      </div>
    </div>
  );
}
