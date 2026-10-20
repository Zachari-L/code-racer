"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { useLanguage } from "@/context/LanguageContext";
import { COMPLEXITIES, type Complexity } from "@/lib/game/config";
import { isJoinable } from "@/lib/game/state-machine";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useRealtime } from "@/lib/realtime/client";
import type { ExplorerRoom } from "@/lib/realtime/protocol";

const select =
  "border-slate-dark h-10 rounded-full border-2 bg-white px-3 text-sm font-bold dark:border-zinc-600 dark:bg-zinc-800";

/** Public rooms, pushed by the server whenever one changes (JOIN-02). */
export function RoomExplorer() {
  const { t } = useLanguage();
  const [rooms, setRooms] = React.useState<ExplorerRoom[] | null>(null);
  const [language, setLanguage] = React.useState<Locale | "all">("all");
  const [complexity, setComplexity] = React.useState<Complexity | "all">("all");

  useRealtime((message, client) => {
    if (message.type === "hello") client.send({ type: "subscribeExplorer" });
    if (message.type === "explorer") setRooms(message.rooms);
  });

  const visible = (rooms ?? []).filter(
    (room) =>
      (language === "all" || room.language === language) &&
      (complexity === "all" || room.complexity === complexity)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label
          className="flex flex-col gap-1 text-xs font-black uppercase"
          htmlFor="filter-language"
        >
          {t("config.language")}
          <select
            id="filter-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Locale | "all")}
            className={select}
          >
            <option value="all">{t("explorer.all")}</option>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {t(`config.languages.${l}`)}
              </option>
            ))}
          </select>
        </label>
        <label
          className="flex flex-col gap-1 text-xs font-black uppercase"
          htmlFor="filter-complexity"
        >
          {t("config.complexity")}
          <select
            id="filter-complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as Complexity | "all")}
            className={select}
          >
            <option value="all">{t("explorer.all")}</option>
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c}>
                {t(`config.complexities.${c}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rooms === null ? (
        <p role="status" className="py-8 text-center font-black">
          {t("room.connecting")}
        </p>
      ) : visible.length === 0 ? (
        <p
          role="status"
          className="rounded-3xl border-3 border-dashed border-zinc-400 py-10 text-center font-black"
        >
          {t(rooms.length === 0 ? "explorer.empty" : "explorer.emptyFiltered")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-y-2 text-left text-sm">
            <caption className="sr-only">{t("explorer.caption")}</caption>
            <thead className="text-xs font-black uppercase">
              <tr>
                <th scope="col" className="px-3">
                  {t("explorer.col.host")}
                </th>
                <th scope="col" className="px-3">
                  {t("explorer.col.players")}
                </th>
                <th scope="col" className="px-3">
                  {t("config.language")}
                </th>
                <th scope="col" className="px-3">
                  {t("config.complexity")}
                </th>
                <th scope="col" className="px-3">
                  {t("explorer.col.state")}
                </th>
                <th scope="col" className="px-3">
                  <span className="sr-only">{t("explorer.col.action")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {visible.map((room) => {
                const full = room.participants >= room.capacity;
                const joinable = isJoinable(room.phase);
                return (
                  <tr key={room.code} className="bg-white dark:bg-zinc-900">
                    <th scope="row" className="rounded-l-2xl px-3 py-3 font-black">
                      {room.hostName}
                    </th>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" aria-hidden />
                        {t("explorer.players", {
                          count: room.participants,
                          capacity: room.capacity,
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-3">{t(`config.languages.${room.language}`)}</td>
                    <td className="px-3 py-3">{t(`config.complexities.${room.complexity}`)}</td>
                    <td className="px-3 py-3">{t(`explorer.phase.${room.phase}`)}</td>
                    <td className="rounded-r-2xl px-3 py-3 text-right">
                      {joinable && (
                        <LinkButton
                          href={`/room/${room.code}`}
                          variant={full ? "outline" : "lime"}
                          size="sm"
                        >
                          {t(full ? "explorer.watch" : "explorer.join")}
                        </LinkButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
