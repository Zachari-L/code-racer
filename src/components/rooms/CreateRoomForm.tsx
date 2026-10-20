"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfigForm } from "@/components/room/ConfigForm";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_ROOM_CONFIG, type RoomConfig } from "@/lib/game/config";
import type { Locale } from "@/lib/i18n";
import { createRoom } from "@/server/actions/rooms";

/** Room creation: full configuration plus the host's own role (SALLE-01). */
export function CreateRoomForm({ defaultLanguage }: { defaultLanguage: Locale }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [config, setConfig] = React.useState<RoomConfig>({
    ...DEFAULT_ROOM_CONFIG,
    language: defaultLanguage,
  });
  const [hostRole, setHostRole] = React.useState<"PARTICIPANT" | "SPECTATOR">("PARTICIPANT");
  const [error, setError] = React.useState<{ message: string; currentRoom?: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (leaveCurrent: boolean) =>
    startTransition(async () => {
      const result = await createRoom({ config, hostRole, leaveCurrent });
      if (result.success) router.push(`/room/${result.code}`);
      else setError({ message: result.error, currentRoom: result.currentRoom });
    });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
    >
      <Card>
        <ConfigForm value={config} onChange={setConfig} idPrefix="create" />
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <fieldset className="space-y-1">
          <legend className="text-sm font-black uppercase">{t("create.hostRole")}</legend>
          {(["PARTICIPANT", "SPECTATOR"] as const).map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm font-bold">
              <input
                type="radio"
                name="host-role"
                value={role}
                checked={hostRole === role}
                onChange={() => setHostRole(role)}
                className="accent-azure-blue h-4 w-4"
              />
              {t(`create.role.${role}`)}
            </label>
          ))}
        </fieldset>
        <Button type="submit" variant="lime" size="lg" disabled={pending}>
          {t("create.submit")}
        </Button>
      </Card>
      {error && (
        <div
          role="alert"
          className="space-y-2 rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-900 dark:bg-rose-950 dark:text-rose-100"
        >
          <p>{error.message}</p>
          {error.currentRoom && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => submit(true)}
              disabled={pending}
            >
              {t("create.leaveAndCreate", { code: error.currentRoom })}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
