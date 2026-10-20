"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { createDefaultPublicRoom, findQuickRace } from "@/server/actions/rooms";

/**
 * "Faire une course" (JOIN-03): joins the fullest open public room. When none
 * is available, signed-in users may create one; guests get an empty state.
 */
export function QuickRaceButton({ signedIn }: { signedIn: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [empty, setEmpty] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const find = () =>
    startTransition(async () => {
      setError(null);
      const result = await findQuickRace();
      if (!result.success) setError(result.error);
      else if (result.code) router.push(`/room/${result.code}`);
      else setEmpty(true);
    });

  const create = () =>
    startTransition(async () => {
      const result = await createDefaultPublicRoom(true);
      if (result.success) router.push(`/room/${result.code}`);
      else setError(result.error);
    });

  return (
    <div className="space-y-3">
      <Button variant="lime" size="lg" className="w-full" onClick={find} disabled={pending}>
        <Zap className="mr-2 h-5 w-5" aria-hidden />
        {t("home.quickRace")}
      </Button>
      {empty && (
        <div role="status" className="space-y-2 rounded-2xl border-2 border-dashed border-zinc-400 p-4 text-center">
          <p className="text-sm font-black">{t("home.noRoom")}</p>
          {signedIn ? (
            <Button variant="azure" size="sm" onClick={create} disabled={pending}>
              {t("home.createDefaultRoom")}
            </Button>
          ) : (
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("home.noRoomGuest")}</p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-bold text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
