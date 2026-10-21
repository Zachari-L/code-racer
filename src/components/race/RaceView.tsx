"use client";

import * as React from "react";
import { Clock, Eye, Flag, Keyboard, Zap } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { KeyInput } from "@/lib/game/typing";
import type { RoomSnapshot, SelfState, TrackEntry } from "@/lib/realtime/protocol";
import type { BonusNotice } from "@/lib/realtime/room-state";
import { RaceTrack } from "./RaceTrack";
import { TypingZone } from "./TypingZone";

interface RaceViewProps {
  room: RoomSnapshot;
  track: TrackEntry[];
  self: { state: SelfState; reason: "resync" | "text" } | null;
  notices: BonusNotice[];
  serverNow: () => number;
  onKeys: (keys: KeyInput[]) => void;
  onAbandon: () => void;
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Countdown (COURSE-03), track, typing zone or spectator view, give-up button (COURSE-07). */
export function RaceView({
  room,
  track,
  self,
  notices,
  serverNow,
  onKeys,
  onAbandon,
}: RaceViewProps) {
  const { t } = useLanguage();
  const race = room.race!;
  const [now, setNow] = React.useState(() => serverNow());
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(timer);
  }, [serverNow]);

  const isRacer = race.racers.some((r) => r.id === room.youId);
  const myEntry = track.find((entry) => entry.id === room.youId);
  const stillRacing = myEntry?.status === "RACING";
  const countdown = Math.ceil((race.goAt - now) / 1000);
  const myNotices = notices.filter((n) => n.bonus.targetId === room.youId);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-black uppercase">
          <Flag className="text-azure-blue h-5 w-5" aria-hidden />
          {t("race.title", { code: room.code })}
        </h1>
        <div className="flex items-center gap-2">
          <span className="border-slate-dark flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 font-mono text-sm font-black dark:border-zinc-600 dark:bg-zinc-800">
            <Clock className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t(race.endsAt ? "race.timeLeft" : "race.elapsed")}</span>
            {race.endsAt ? formatClock(race.endsAt - now) : formatClock(now - race.goAt)}
          </span>
          {isRacer && stillRacing && room.phase === "RACING" && (
            <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
              {t("race.abandon")}
            </Button>
          )}
        </div>
      </header>

      <RaceTrack racers={race.racers} track={track} youId={room.youId} notices={notices} />

      {room.phase === "COUNTDOWN" && countdown > 0 && (
        <div
          role="timer"
          aria-live="assertive"
          className="border-slate-dark arcade-shadow flex flex-col items-center gap-2 rounded-3xl border-3 bg-white py-6 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex gap-3" aria-hidden>
            {[3, 2, 1].map((light) => (
              <span
                key={light}
                className={`h-6 w-6 rounded-full border-2 border-slate-900 ${countdown <= light ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
              />
            ))}
          </div>
          <span className="font-mono text-6xl font-black">{countdown}</span>
          <span className="text-xs font-black tracking-widest uppercase">
            {t("race.countdownReady")}
          </span>
        </div>
      )}

      {myNotices.map((notice) => (
        <p
          key={notice.key}
          role="alert"
          className="bg-electric-lime border-slate-dark flex items-center gap-2 rounded-2xl border-3 px-4 py-2 text-sm font-black text-[#111112]"
        >
          <Zap className="h-4 w-4" aria-hidden />
          {t(
            `bonus.${notice.bonus.type}.${notice.bonus.beneficiaryId === room.youId ? "gain" : "hit"}`
          )}
        </p>
      ))}

      {isRacer ? (
        <>
          {/* Phones get a message instead of the typing area (DES-06). */}
          <div className="border-slate-dark flex items-center gap-3 rounded-2xl border-3 bg-white p-4 md:hidden dark:border-zinc-700 dark:bg-zinc-900">
            <Keyboard className="text-azure-blue h-8 w-8 shrink-0" aria-hidden />
            <p className="text-sm font-bold">{t("race.mobileMessage")}</p>
          </div>
          <div className="hidden md:block">
            {stillRacing || room.phase === "COUNTDOWN" ? (
              <TypingZone
                key={race.goAt}
                text={race.text}
                errorMode={race.errorMode}
                goAt={race.goAt}
                serverNow={serverNow}
                self={self}
                disabled={room.phase !== "RACING" || !stillRacing}
                onKeys={onKeys}
              />
            ) : (
              <p className="border-slate-dark rounded-2xl border-3 bg-white p-4 text-center text-sm font-black dark:border-zinc-700 dark:bg-zinc-900">
                {t(
                  myEntry?.status === "FINISHED"
                    ? "race.waitingOthers"
                    : myEntry?.status === "TIMEOUT"
                      ? "race.penaltyTimeout"
                      : "race.youAbandoned"
                )}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="flex items-center justify-center gap-2 text-sm font-black text-zinc-700 dark:text-zinc-300">
          <Eye className="h-4 w-4" aria-hidden />
          {t("race.spectating")}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        title={t("race.abandonTitle")}
        description={t("race.abandonDesc")}
        confirmLabel={t("race.abandon")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onAbandon();
        }}
      />
    </div>
  );
}
