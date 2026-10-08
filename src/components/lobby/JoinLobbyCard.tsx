"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Play, Plus, Zap, Users, Lock, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { joinLobby, createLobby } from "@/server/actions/race";

export function JoinLobbyCard() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [code, setCode] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const loggedInNick = session?.user?.name ?? session?.user?.username ?? "";

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError(t("card.codeError"));
      return;
    }
    const playerNick =
      nickname.trim() ||
      session?.user?.name ||
      session?.user?.username ||
      `Pilote_${Math.floor(100 + Math.random() * 900)}`;

    setIsLoading(true);
    setError(null);

    const result = await joinLobby(
      {
        code,
        nickname: playerNick,
        isSpectator: false,
      },
      session?.user?.id
    );

    setIsLoading(false);

    if (result.success && result.code) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`coderacer_host_${result.code}`, "false");
      }
      router.push(`/lobby/${result.code}`);
    } else {
      setError(result.error ?? "Impossible de rejoindre cette course.");
    }
  }

  async function handleCreateQuickLobby() {
    // AUTH-3: Guests cannot create or host a lobby. Account required.
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    const playerNick =
      nickname.trim() ||
      session.user.name ||
      session.user.username ||
      `Hôte_${Math.floor(100 + Math.random() * 900)}`;

    setIsLoading(true);
    setError(null);

    const result = await createLobby(
      {
        visibility: "SEMI_PUBLIC",
        textLanguage: "fr",
        textCategory: "quotes",
        strictMode: false,
        maxDurationSec: 120,
        hostNickname: playerNick,
      },
      session.user.id
    );

    setIsLoading(false);

    if (result.success && result.code) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`coderacer_host_${result.code}`, "true");
      }
      router.push(`/lobby/${result.code}`);
    } else {
      setError(result.error ?? "Impossible de créer la course.");
    }
  }

  return (
    <Card className="relative w-full max-w-lg bg-white dark:bg-zinc-900">
      <CardHeader className="relative z-10 text-center">
        <div className="bg-azure-blue/10 border-azure-blue mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2">
          <Users className="text-azure-blue h-7 w-7" />
        </div>
        <CardTitle className="text-3xl">{t("card.joinTitle")}</CardTitle>
        <CardDescription>{t("card.joinDesc")}</CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-slate-dark mb-1 block text-xs font-black tracking-wider uppercase dark:text-zinc-200">
              {t("card.codeLabel")}
            </label>
            <Input
              type="text"
              maxLength={6}
              placeholder={t("card.codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              accentColor="azure"
              className="text-center font-mono text-2xl tracking-[0.3em]"
            />
          </div>

          <div>
            <label className="text-slate-dark mb-1 block text-xs font-black tracking-wider uppercase dark:text-zinc-200">
              {t("card.nickLabel")}
            </label>
            <Input
              type="text"
              placeholder={loggedInNick || t("card.nickPlaceholder")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              accentColor="orange"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-arcade-magenta bg-arcade-magenta/10 text-arcade-magenta rounded-2xl border-2 p-3 text-center text-xs font-black"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clickable button with hover/tap movement and CTA pulse */}
          <Button
            type="submit"
            variant="lime"
            size="lg"
            pulse={true}
            className="mt-2 w-full gap-2 text-lg"
            disabled={isLoading}
          >
            <Play className="fill-slate-dark h-5 w-5" />
            {isLoading ? t("card.connecting") : t("card.joinBtn")}
          </Button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-zinc-200 dark:border-zinc-700" />
            </div>
            <span className="relative bg-white px-3 text-xs font-black tracking-widest text-zinc-400 uppercase dark:bg-zinc-900 dark:text-zinc-500">
              {t("card.or")}
            </span>
          </div>

          {/* Clickable action buttons */}
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
              {t("card.createLobby")}
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
              {t("card.quickPlay")}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Modal: Account Required to Host (AUTH-3) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-black/60 p-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="border-slate-dark arcade-shadow w-full max-w-sm rounded-2xl border-3 bg-white p-5 text-center dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="bg-electric-lime border-slate-dark arcade-shadow mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 dark:border-zinc-700">
                <Lock className="h-6 w-6 text-[#111112]" />
              </div>

              <h3 className="text-slate-dark text-lg font-black uppercase dark:text-white">
                {t("auth.guestHostWarningTitle")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed font-bold text-zinc-600 dark:text-zinc-300">
                {t("auth.guestHostWarningDesc")}
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <Link href="/login?mode=register&callbackUrl=/lobby">
                  <Button
                    variant="lime"
                    size="sm"
                    className="w-full gap-2 text-xs font-black uppercase"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{t("auth.guestHostActionLogin")}</span>
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-xs font-black"
                >
                  <span>{t("auth.guestHostActionCancel")}</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
