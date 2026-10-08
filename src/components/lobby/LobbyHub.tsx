"use client";

import { JoinLobbyCard } from "@/components/lobby/JoinLobbyCard";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function LobbyHub() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <Badge variant="azure" className="mb-3 gap-1.5 px-3 py-1 text-xs">
          <Users className="h-3.5 w-3.5" />
          {t("lobby.tag")}
        </Badge>
        <h1 className="text-slate-dark text-3xl font-black uppercase sm:text-4xl dark:text-white">
          {t("lobby.hubTitle")}
        </h1>
        <p className="mt-2 max-w-lg text-sm font-bold text-zinc-500 dark:text-zinc-400">
          {t("lobby.hubSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-lg">
        <JoinLobbyCard />
      </div>
    </div>
  );
}
