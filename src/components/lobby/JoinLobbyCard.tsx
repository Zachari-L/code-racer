"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Play, Plus, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { joinLobby, createLobby } from "@/server/actions/race";

export function JoinLobbyCard() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Entrez le code à 6 chiffres de la course.");
      return;
    }
    const playerNick = nickname.trim() || `Pilote_${Math.floor(100 + Math.random() * 900)}`;

    setIsLoading(true);
    setError(null);

    const result = await joinLobby({
      code,
      nickname: playerNick,
      isSpectator: false,
    });

    setIsLoading(false);

    if (result.success && result.code) {
      router.push(`/race/${result.code}`);
    } else {
      setError(result.error ?? "Impossible de rejoindre cette course.");
    }
  }

  async function handleCreateQuickLobby() {
    const playerNick = nickname.trim() || `Hôte_${Math.floor(100 + Math.random() * 900)}`;
    setIsLoading(true);
    setError(null);

    const result = await createLobby({
      visibility: "SEMI_PUBLIC",
      textLanguage: "fr",
      textCategory: "quotes",
      strictMode: false,
      maxDurationSec: 120,
      hostNickname: playerNick,
    });

    setIsLoading(false);

    if (result.success && result.code) {
      router.push(`/race/${result.code}`);
    } else {
      setError(result.error ?? "Impossible de créer la course.");
    }
  }

  return (
    <Card className="relative w-full max-w-lg overflow-hidden bg-white">
      <div className="bg-electric-lime pointer-events-none absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 transform rounded-full opacity-20" />

      <CardHeader className="text-center">
        <div className="bg-azure-blue/10 border-azure-blue mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2">
          <Users className="text-azure-blue h-7 w-7" />
        </div>
        <CardTitle className="text-3xl">Rejoindre l&apos;Arène</CardTitle>
        <CardDescription>
          Entrez le code à 6 chiffres partagé par votre enseignant ou ami(e)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-slate-dark mb-1 block text-xs font-black tracking-wider uppercase">
              Code de Salon (6 chiffres)
            </label>
            <Input
              type="text"
              maxLength={6}
              placeholder="Ex: 482910"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              accentColor="azure"
              className="text-center font-mono text-2xl tracking-[0.3em]"
            />
          </div>

          <div>
            <label className="text-slate-dark mb-1 block text-xs font-black tracking-wider uppercase">
              Votre Pseudonyme
            </label>
            <Input
              type="text"
              placeholder="Ex: TurboTypist"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              accentColor="orange"
            />
          </div>

          {error && (
            <div className="border-arcade-magenta bg-arcade-magenta/10 text-arcade-magenta rounded-2xl border-2 p-3 text-center text-xs font-black">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="lime"
            size="lg"
            className="mt-2 w-full gap-2 text-lg"
            disabled={isLoading}
          >
            <Play className="fill-slate-dark h-5 w-5" />
            {isLoading ? "Connexion..." : "REJOINDRE LA COURSE"}
          </Button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-zinc-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-black tracking-widest text-zinc-400 uppercase">
              OU
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCreateQuickLobby}
              disabled={isLoading}
              className="w-full gap-1.5 text-xs"
            >
              <Plus className="text-victory-teal h-4 w-4" />
              Créer un Salon
            </Button>

            <Button
              type="button"
              variant="azure"
              size="md"
              onClick={handleCreateQuickLobby}
              disabled={isLoading}
              className="w-full gap-1.5 text-xs"
            >
              <Zap className="h-4 w-4" />
              Partie Rapide
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
