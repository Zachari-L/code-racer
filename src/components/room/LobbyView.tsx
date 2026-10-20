"use client";

import * as React from "react";
import { Check, Copy, Crown, Eye, Link2, LogOut, Play, UserX, Users, WifiOff } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import type { RoomConfig } from "@/lib/game/config";
import { canStartRace } from "@/lib/game/state-machine";
import type { ClientMessage, MemberView, RoomSnapshot } from "@/lib/realtime/protocol";
import { countParticipants } from "@/lib/rooms";
import { cn } from "@/lib/utils";
import { ConfigForm, ConfigSummary } from "./ConfigForm";

interface LobbyViewProps {
  room: RoomSnapshot;
  send: (message: ClientMessage) => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="arcade-clickable flex items-center gap-1 rounded-full border-2 border-zinc-300 px-2.5 py-1 text-xs font-black dark:border-zinc-600"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? t("common.copied") : label}
    </button>
  );
}

export function LobbyView({ room, send }: LobbyViewProps) {
  const { t } = useLanguage();
  const [kickTarget, setKickTarget] = React.useState<MemberView | null>(null);
  const me = room.members.find((m) => m.id === room.youId);
  const isHost = me?.isHost ?? false;
  const participants = room.members.filter((m) => m.role === "PARTICIPANT");
  const spectators = room.members.filter((m) => m.role === "SPECTATOR");
  const count = countParticipants(room.members, room.bots.length);
  const startCheck = canStartRace({
    humanParticipants: participants.length,
    bots: room.bots.length,
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const updateConfig = (config: RoomConfig) => send({ type: "updateConfig", config });

  const memberRow = (member: MemberView) => (
    <li key={member.id} className="flex items-center gap-2 py-1">
      <Avatar seed={member.id} name={member.name} src={member.avatarUrl} size={32} />
      <span className="truncate text-sm font-black">
        {member.name}
        {member.id === room.youId && <span className="text-azure-blue"> {t("lobby.you")}</span>}
      </span>
      {member.isHost && (
        <span className="bg-electric-lime flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black text-[#111112] uppercase">
          <Crown className="h-3 w-3" aria-hidden />
          {t("lobby.host")}
        </span>
      )}
      {member.kind === "guest" && (
        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase dark:bg-zinc-700">
          {t("lobby.guestTag")}
        </span>
      )}
      {!member.connected && (
        <WifiOff className="h-4 w-4 text-zinc-500" aria-label={t("lobby.disconnected")} />
      )}
      {isHost && member.id !== room.youId && (
        <button
          type="button"
          onClick={() => setKickTarget(member)}
          className="arcade-clickable ml-auto rounded-full p-1.5 text-zinc-700 hover:bg-rose-100 dark:text-zinc-200 dark:hover:bg-rose-900/40"
          aria-label={t("lobby.kick", { name: member.name })}
        >
          <UserX className="h-4 w-4" aria-hidden />
        </button>
      )}
    </li>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-sm font-black tracking-wider text-zinc-600 uppercase dark:text-zinc-300">
                {t("lobby.roomCode")}
              </h1>
              <p className="font-mono text-4xl font-black tracking-[0.2em]">{room.code}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={room.code} label={t("lobby.copyCode")} />
              {room.config.visibility !== "PRIVATE" && (
                <CopyButton value={`${origin}/room/${room.code}`} label={t("lobby.copyLink")} />
              )}
            </div>
          </div>
          <p className="text-sm font-bold">
            {t(`config.visibilityHint.${room.config.visibility}`)}
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-black uppercase">{t("lobby.configTitle")}</h2>
          {isHost ? (
            <ConfigForm value={room.config} onChange={updateConfig} idPrefix="lobby" />
          ) : (
            <ConfigSummary config={room.config} />
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black uppercase">
            <Users className="text-azure-blue h-5 w-5" aria-hidden />
            {t("lobby.participants", { count, capacity: room.config.capacity })}
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {participants.map(memberRow)}
            {room.bots.map((bot) => (
              <li key={bot.id} className="flex items-center gap-2 py-1 text-sm font-black">
                <Avatar seed={bot.id} name={bot.name} size={32} />
                {bot.name}
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] uppercase dark:bg-zinc-700">
                  {t("race.botTag")} · {t(`bot.level.${bot.level}`)}
                </span>
              </li>
            ))}
          </ul>
          {spectators.length > 0 && (
            <>
              <h3 className="flex items-center gap-1.5 text-sm font-black uppercase">
                <Eye className="h-4 w-4" aria-hidden />
                {t("lobby.spectators", { count: spectators.length })}
              </h3>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {spectators.map(memberRow)}
              </ul>
            </>
          )}

          {me && (
            <div className="flex flex-wrap gap-2 border-t-2 border-zinc-200 pt-3 dark:border-zinc-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  send({
                    type: "setRole",
                    role: me.role === "PARTICIPANT" ? "SPECTATOR" : "PARTICIPANT",
                  })
                }
              >
                {t(me.role === "PARTICIPANT" ? "lobby.becomeSpectator" : "lobby.becomeParticipant")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => send({ type: "leave" })}>
                <LogOut className="mr-1 h-4 w-4" aria-hidden />
                {t("lobby.leave")}
              </Button>
            </div>
          )}
        </Card>

        {isHost ? (
          <Card className="space-y-2">
            <Button
              variant="lime"
              size="lg"
              className="w-full"
              disabled={!startCheck.ok}
              onClick={() => send({ type: "start" })}
            >
              <Play className="mr-2 h-5 w-5" aria-hidden />
              {t("lobby.startRace")}
            </Button>
            {!startCheck.ok && (
              <p className="text-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t(`room.actionError.${startCheck.reason}`)}
              </p>
            )}
          </Card>
        ) : (
          <p className="text-center text-sm font-black text-zinc-700 dark:text-zinc-300">
            {t("lobby.waitingForHost")}
          </p>
        )}

        {isHost && room.invites && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-black uppercase">
                <Link2 className="text-arcade-magenta h-5 w-5" aria-hidden />
                {t("lobby.invites")}
              </h2>
              <Button variant="outline" size="sm" onClick={() => send({ type: "createInvite" })}>
                {t("lobby.newInvite")}
              </Button>
            </div>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {t("lobby.invitesHint")}
            </p>
            <ul className="space-y-2">
              {room.invites.map((invite, index) => (
                <li key={invite.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-black">#{index + 1}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                      invite.revoked
                        ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                        : invite.usedByName
                          ? "bg-azure-deep text-white"
                          : "bg-electric-lime text-[#111112]"
                    )}
                  >
                    {invite.revoked
                      ? t("lobby.inviteRevoked")
                      : invite.usedByName
                        ? t("lobby.inviteUsedBy", { name: invite.usedByName })
                        : t("lobby.inviteUnused")}
                  </span>
                  {!invite.revoked && (
                    <CopyButton value={`${origin}${invite.url}`} label={t("lobby.copyLink")} />
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={kickTarget !== null}
        title={t("lobby.kickTitle", { name: kickTarget?.name ?? "" })}
        description={t("lobby.kickDesc")}
        confirmLabel={t("lobby.kickConfirm")}
        onCancel={() => setKickTarget(null)}
        onConfirm={() => {
          if (kickTarget) send({ type: "kick", memberId: kickTarget.id });
          setKickTarget(null);
        }}
      />
    </div>
  );
}
