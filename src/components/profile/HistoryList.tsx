"use client";

import * as React from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { useLanguage } from "@/context/LanguageContext";
import { formatOrdinal, isLocale } from "@/lib/i18n";
import type { HistoryEntry } from "@/server/profile";

interface HistoryListProps {
  entries: HistoryEntry[];
  page: number;
  pageCount: number;
  total: number;
}

/** Race history with pagination (HIST-01); each race links to its results (HIST-02). */
export function HistoryList({ entries, page, pageCount, total }: HistoryListProps) {
  const { t, language } = useLanguage();
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card>
      <h2 className="mb-3 text-lg font-black uppercase">{t("history.title", { count: total })}</h2>
      {entries.length === 0 ? (
        <p className="text-sm font-bold">{t("history.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs font-black uppercase">
              <tr>
                <th scope="col" className="py-2">
                  {t("history.date")}
                </th>
                <th scope="col" className="py-2">
                  {t("results.col.rank")}
                </th>
                <th scope="col" className="py-2">
                  {t("results.col.wpm")}
                </th>
                <th scope="col" className="py-2">
                  {t("results.col.accuracy")}
                </th>
                <th scope="col" className="py-2">
                  {t("results.col.status")}
                </th>
                <th scope="col" className="py-2">
                  {t("config.language")}
                </th>
              </tr>
            </thead>
            <tbody className="font-semibold">
              {entries.map((entry) => (
                <tr key={entry.raceId} className="border-t border-zinc-200 dark:border-zinc-700">
                  <td className="py-2">
                    <Link
                      href={`/races/${entry.raceId}`}
                      className="text-azure-blue font-black underline underline-offset-2"
                    >
                      {date.format(new Date(entry.playedAt))}
                    </Link>
                  </td>
                  <td className="py-2">
                    {t("history.rankOf", {
                      rank: formatOrdinal(language, entry.rank),
                      count: entry.racers,
                    })}
                  </td>
                  <td className="py-2 font-mono">
                    <span className="flex items-center gap-1">
                      {number.format(entry.wpm)}
                      {entry.isPersonalBest && (
                        <Trophy
                          className="text-tangerine-orange h-4 w-4"
                          aria-label={t("history.personalBest")}
                        />
                      )}
                    </span>
                  </td>
                  <td className="py-2 font-mono">
                    {t("results.percent", { value: number.format(entry.accuracy) })}
                  </td>
                  <td className="py-2">{t(`race.status.${entry.status}`)}</td>
                  <td className="py-2">
                    {isLocale(entry.language)
                      ? t(`config.languages.${entry.language}`)
                      : entry.language}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pageCount > 1 && (
        <nav
          aria-label={t("history.pagination")}
          className="mt-4 flex items-center justify-between gap-2"
        >
          {page > 1 ? (
            <LinkButton href={`/profile?page=${page - 1}`} variant="outline" size="sm">
              {t("history.previous")}
            </LinkButton>
          ) : (
            <span />
          )}
          <span className="text-sm font-black">
            {t("history.pageOf", { page, count: pageCount })}
          </span>
          {page < pageCount ? (
            <LinkButton href={`/profile?page=${page + 1}`} variant="outline" size="sm">
              {t("history.next")}
            </LinkButton>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Card>
  );
}
