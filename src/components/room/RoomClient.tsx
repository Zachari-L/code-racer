"use client";

import * as React from "react";
import { LogOut, RotateCcw, WifiOff, XCircle } from "lucide-react";
import { RaceView } from "@/components/race/RaceView";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { useLanguage } from "@/context/LanguageContext";
import type { KeyInput } from "@/lib/game/typing";
import { useRealtime, type RealtimeClient } from "@/lib/realtime/client";
import type { ServerMessage } from "@/lib/realtime/protocol";
import { INITIAL_ROOM_STATE, roomReducer } from "@/lib/realtime/room-state";
import { LobbyView } from "./LobbyView";

interface RoomClientProps {
  code: string;
  invite: string | null;
}

const NOTICE_MS = 4000;

export function RoomClient({ code, invite }: RoomClientProps) {
  const { t } = useLanguage();
  const [state, dispatch] = React.useReducer(roomReducer, INITIAL_ROOM_STATE);
  const joinOptions = React.useRef({ asSpectator: false, leaveCurrent: false });

  const onMessage = React.useCallback(
    (message: ServerMessage, client: RealtimeClient) => {
      if (message.type === "hello") {
        // Joins again after every reconnection (COURSE-08).
        if (message.signedIn) {
          client.send({ type: "join", code, invite: invite ?? undefined, ...joinOptions.current });
        } else {
          dispatch({ type: "joinError", error: "notSignedIn" });
        }
        return;
      }
      // Every notice lives NOTICE_MS, so expiring the oldest one keeps them in order.
      if (message.type === "bonus") {
        setTimeout(() => dispatch({ type: "dismissOldestNotice" }), NOTICE_MS);
      }
      dispatch(message);
    },
    [code, invite]
  );
  const { client, status } = useRealtime(onMessage);

  const send = client.send.bind(client);
  const serverNow = React.useCallback(() => client.serverNow(), [client]);
  const onKeys = React.useCallback(
    (keys: KeyInput[]) => client.send({ type: "input", keys }),
    [client]
  );

  const retryJoin = (options: Partial<typeof joinOptions.current>) => {
    joinOptions.current = { ...joinOptions.current, ...options };
    dispatch({ type: "clearErrors" });
    client.send({ type: "join", code, invite: invite ?? undefined, ...joinOptions.current });
  };

  React.useEffect(() => {
    if (!state.actionError) return;
    const timer = setTimeout(() => dispatch({ type: "clearErrors" }), 4000);
    return () => clearTimeout(timer);
  }, [state.actionError]);

  if (state.ended) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-black uppercase">{t(`room.ended.${state.ended}`)}</h1>
        <LinkButton href="/rooms" variant="lime">
          {t("room.backToRooms")}
        </LinkButton>
      </Card>
    );
  }

  if (state.joinError) {
    const { error, currentRoom, retryAfterMs } = state.joinError;
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center" role="alert">
        <XCircle className="text-arcade-magenta mx-auto h-10 w-10" aria-hidden />
        <h1 className="text-xl font-black uppercase">
          {t(`room.error.${error}`, {
            code: currentRoom ?? "",
            seconds: Math.ceil((retryAfterMs ?? 0) / 1000),
          })}
        </h1>
        <div className="flex flex-wrap justify-center gap-2">
          {error === "alreadyInRoom" && currentRoom && (
            <>
              <Button variant="lime" onClick={() => retryJoin({ leaveCurrent: true })}>
                {t("room.leaveAndJoin")}
              </Button>
              <LinkButton href={`/room/${currentRoom}`} variant="outline">
                {t("room.backToCurrent", { code: currentRoom })}
              </LinkButton>
            </>
          )}
          {error === "full" && (
            <Button variant="lime" onClick={() => retryJoin({ asSpectator: true })}>
              {t("room.joinAsSpectator")}
            </Button>
          )}
          {error === "rateLimited" && (
            <Button variant="outline" onClick={() => retryJoin({})}>
              {t("common.retry")}
            </Button>
          )}
          <LinkButton href="/" variant="outline">
            {t("room.backHome")}
          </LinkButton>
        </div>
      </Card>
    );
  }

  const room = state.room;
  if (!room) {
    return (
      <p role="status" className="py-16 text-center text-lg font-black">
        {t("room.connecting")}
      </p>
    );
  }

  const me = room.members.find((m) => m.id === room.youId);
  const results = room.race?.results;

  return (
    <div className="space-y-4">
      {status === "reconnecting" && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-[#111112]"
        >
          <WifiOff className="h-4 w-4" aria-hidden />
          {t("room.reconnecting")}
        </p>
      )}
      {state.actionError && (
        <p
          role="alert"
          className="rounded-full bg-rose-100 px-4 py-2 text-center text-sm font-black text-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          {t(`room.actionError.${state.actionError}`)}
        </p>
      )}

      {room.phase === "WAITING" && <LobbyView room={room} send={send} />}

      {(room.phase === "COUNTDOWN" || room.phase === "RACING") && room.race && (
        <RaceView
          room={room}
          track={state.track}
          self={state.self}
          notices={state.notices}
          serverNow={serverNow}
          onKeys={onKeys}
          onAbandon={() => send({ type: "abandon" })}
        />
      )}

      {room.phase === "RESULTS" && results && (
        <>
          <h1 className="text-2xl font-black uppercase">{t("results.title")}</h1>
          <ResultsView
            data={results}
            viewerId={room.youId}
            actions={
              <>
                {me?.isHost ? (
                  <>
                    <Button variant="lime" onClick={() => send({ type: "restart" })}>
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                      {t("results.restart")}
                    </Button>
                    <Button variant="magenta" pulse={false} onClick={() => send({ type: "close" })}>
                      {t("results.closeRoom")}
                    </Button>
                  </>
                ) : (
                  <p className="w-full text-center text-sm font-bold">{t("results.waitingHost")}</p>
                )}
                <Button variant="ghost" onClick={() => send({ type: "leave" })}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  {t("lobby.leave")}
                </Button>
              </>
            }
          />
        </>
      )}
    </div>
  );
}
