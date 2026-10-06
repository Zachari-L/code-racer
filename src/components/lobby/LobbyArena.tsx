"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Copy,
  Check,
  Play,
  Bot,
  Crown,
  Settings,
  ArrowLeft,
  ShieldAlert,
  Clock,
  BookOpen,
  CheckCircle2,
  Hourglass,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RacerCar } from "@/components/animated/RacerCar";
import { useLanguage } from "@/context/LanguageContext";
import type { PlayerColor, BotDifficulty } from "@/types/race";

interface LobbyParticipant {
  id: string;
  nickname: string;
  role: "HOST" | "PARTICIPANT";
  carColor: PlayerColor;
  isReady: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
}

interface LobbyArenaProps {
  initialCode?: string;
}

const DEFAULT_CODE = "482910";

const PREVIEW_TEXTS = {
  quotes:
    "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
  code: "function calculateWpm(chars: number, minutes: number): number { return Math.round((chars / 5) / minutes); }",
  moliere:
    "Le petit chat est mort. Que voulez-vous que je dise de plus ? La fortune se joue ainsi de nos desseins.",
};

export function LobbyArena({ initialCode }: LobbyArenaProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const code = initialCode || DEFAULT_CODE;
  const [copied, setCopied] = React.useState(false);
  const [isSelfReady, setIsSelfReady] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<"quotes" | "code" | "moliere">(
    "quotes"
  );
  const [strictMode, setStrictMode] = React.useState(false);

  const [participants, setParticipants] = React.useState<LobbyParticipant[]>([
    {
      id: "p1",
      nickname: `TurboTypist ${t("lobby.you")}`,
      role: "HOST",
      carColor: "azure",
      isReady: true,
    },
    {
      id: "p2",
      nickname: "PixelDriver",
      role: "PARTICIPANT",
      carColor: "tangerine",
      isReady: true,
    },
    {
      id: "p3",
      nickname: "VeloceCode",
      role: "PARTICIPANT",
      carColor: "magenta",
      isReady: false,
    },
    {
      id: "p4",
      nickname: "Bot_Flash (~60 WPM)",
      role: "PARTICIPANT",
      carColor: "teal",
      isReady: true,
      isBot: true,
      botDifficulty: "MEDIUM",
    },
  ]);

  function handleCopyCode() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleToggleReady() {
    setIsSelfReady((prev) => {
      const next = !prev;
      setParticipants((list) => list.map((p) => (p.id === "p1" ? { ...p, isReady: next } : p)));
      return next;
    });
  }

  function handleAddBot(difficulty: BotDifficulty) {
    const diffLabels: Record<BotDifficulty, string> = {
      EASY: `${t("lobby.botEasy")} (~30 WPM)`,
      MEDIUM: `${t("lobby.botMedium")} (~60 WPM)`,
      HARD: `${t("lobby.botHard")} (~90 WPM)`,
      IMPOSSIBLE: `${t("lobby.botPro")} (~130 WPM)`,
    };
    const colors: PlayerColor[] = ["azure", "tangerine", "magenta", "teal"];
    const nextColor = colors[participants.length % colors.length];

    const newBot: LobbyParticipant = {
      id: `bot_${Date.now()}`,
      nickname: `Bot_${difficulty.slice(0, 3)} (${diffLabels[difficulty]})`,
      role: "PARTICIPANT",
      carColor: nextColor,
      isReady: true,
      isBot: true,
      botDifficulty: difficulty,
    };

    setParticipants((prev) => [...prev, newBot]);
  }

  function handleStartRace() {
    router.push(`/race/${code}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Top Header Card with 6-Digit Lobby Code & Status */}
      <div className="border-slate-dark arcade-shadow flex flex-col items-center justify-between gap-6 rounded-3xl border-3 bg-white p-6 transition-colors duration-150 sm:p-8 md:flex-row dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <div className="inline-flex items-center gap-2">
            <Badge variant="lime" className="gap-1.5 px-3 py-1 text-xs">
              <span className="h-2 w-2 animate-ping rounded-full bg-slate-900" />
              {t("lobby.tag")}
            </Badge>
            <Badge variant="azure" className="gap-1.5 px-3 py-1 text-xs">
              <Users className="h-3.5 w-3.5" />
              {participants.length} / 100 {t("lobby.playersCount")}
            </Badge>
          </div>

          <h1 className="text-slate-dark text-3xl font-black uppercase sm:text-4xl dark:text-white">
            {t("lobby.title")} #{code.slice(0, 3)}
          </h1>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            {t("lobby.description")}
          </p>
        </div>

        {/* 6-Digit Arcade Code Box */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-slate-dark text-xs font-black tracking-widest uppercase dark:text-zinc-300">
            {t("lobby.accessCode")}
          </span>
          <div className="border-slate-dark arcade-shadow flex items-center gap-3 rounded-2xl border-3 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            <span className="text-azure-blue font-mono text-3xl font-black tracking-[0.25em] sm:text-4xl">
              {code}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="h-10 px-3 text-xs"
              title={t("lobby.copyCode")}
            >
              {copied ? (
                <span className="text-victory-teal flex items-center gap-1 font-bold">
                  <Check className="h-4 w-4" /> {t("lobby.copied")}
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold">
                  <Copy className="h-4 w-4" /> {t("lobby.copyCode")}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Starting Grid on Left, Settings & Text Preview on Right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Starting Grid */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="bg-white dark:bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="text-azure-blue h-6 w-6" />
                  {t("lobby.gridTitle")}
                </CardTitle>
                <CardDescription>{t("lobby.gridDesc")}</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {participants.filter((p) => p.isReady).length}/{participants.length}{" "}
                {t("lobby.readyCount")}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Participant Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {participants.map((player) => {
                    const isSelf = player.id === "p1";
                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`border-slate-dark arcade-shadow relative flex flex-col justify-between rounded-2xl border-3 p-4 transition-all dark:border-zinc-700 ${
                          isSelf
                            ? "bg-electric-lime/10 dark:bg-electric-lime/15"
                            : "bg-zinc-50/80 dark:bg-zinc-800/80"
                        }`}
                      >
                        {/* Top: Avatar Car & Nickname */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="border-slate-dark flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
                              <RacerCar
                                color={player.carColor}
                                width={56}
                                height={28}
                                showSmoke={false}
                                showHeadlight={false}
                              />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-dark truncate text-sm font-black dark:text-zinc-100">
                                  {player.nickname}
                                </span>
                                {player.role === "HOST" && (
                                  <Crown className="text-tangerine-orange h-4 w-4 shrink-0" />
                                )}
                              </div>
                              <span className="text-[11px] font-extrabold text-zinc-500 uppercase dark:text-zinc-400">
                                {player.isBot
                                  ? t("lobby.virtualPilot")
                                  : player.role === "HOST"
                                    ? t("lobby.host")
                                    : t("lobby.participant")}
                              </span>
                            </div>
                          </div>

                          {/* Ready Badge */}
                          <Badge
                            variant={player.isReady ? "lime" : "outline"}
                            className="gap-1 px-2.5 py-0.5 text-[11px]"
                          >
                            {player.isReady ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> {t("lobby.ready")}
                              </>
                            ) : (
                              <>
                                <Hourglass className="h-3 w-3" /> {t("lobby.waiting")}
                              </>
                            )}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Bot Addition Selector */}
              <div className="border-slate-dark/20 mt-4 rounded-2xl border-2 border-dashed bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-slate-dark flex items-center gap-2 text-xs font-black uppercase dark:text-zinc-200">
                    <Bot className="text-tangerine-orange h-4 w-4" />
                    {t("lobby.addBotsTitle")}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                    {t("lobby.addBotsDesc")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBot("EASY")}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> {t("lobby.botEasy")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBot("MEDIUM")}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> {t("lobby.botMedium")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBot("HARD")}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> {t("lobby.botHard")}
                  </Button>
                  <Button
                    type="button"
                    variant="magenta"
                    size="sm"
                    onClick={() => handleAddBot("IMPOSSIBLE")}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> {t("lobby.botPro")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings & Text Preview */}
        <div className="flex flex-col gap-6">
          <Card className="bg-white dark:bg-zinc-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="text-tangerine-orange h-5 w-5" />
                {t("lobby.settingsTitle")}
              </CardTitle>
              <CardDescription>{t("lobby.settingsDesc")}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-dark mb-1.5 block text-xs font-black uppercase dark:text-zinc-200">
                  {t("lobby.textCat")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("quotes")}
                    className={`border-slate-dark rounded-xl border-2 px-2 py-1.5 text-xs font-black transition-all dark:border-zinc-700 ${
                      selectedCategory === "quotes"
                        ? "bg-electric-lime text-slate-dark shadow-xs"
                        : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("lobby.catQuotes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("code")}
                    className={`border-slate-dark rounded-xl border-2 px-2 py-1.5 text-xs font-black transition-all dark:border-zinc-700 ${
                      selectedCategory === "code"
                        ? "bg-electric-lime text-slate-dark shadow-xs"
                        : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("lobby.catCode")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("moliere")}
                    className={`border-slate-dark rounded-xl border-2 px-2 py-1.5 text-xs font-black transition-all dark:border-zinc-700 ${
                      selectedCategory === "moliere"
                        ? "bg-electric-lime text-slate-dark shadow-xs"
                        : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t("lobby.catMoliere")}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-dark mb-1.5 block text-xs font-black uppercase dark:text-zinc-200">
                  {t("lobby.mode")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStrictMode(false)}
                    className={`border-slate-dark rounded-xl border-2 px-3 py-2 text-left text-xs font-black transition-all dark:border-zinc-700 ${
                      !strictMode
                        ? "bg-azure-blue/15 border-azure-blue text-azure-blue shadow-xs"
                        : "bg-white text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className="font-black">{t("lobby.modePermissive")}</div>
                    <div className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                      {t("lobby.modePermissiveDesc")}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrictMode(true)}
                    className={`border-slate-dark rounded-xl border-2 px-3 py-2 text-left text-xs font-black transition-all dark:border-zinc-700 ${
                      strictMode
                        ? "bg-arcade-magenta/15 border-arcade-magenta text-arcade-magenta shadow-xs"
                        : "bg-white text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className="font-black">{t("lobby.modeStrict")}</div>
                    <div className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                      {t("lobby.modeStrictDesc")}
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-500" /> {t("lobby.duration")}
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  120 {t("lobby.seconds")}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs font-bold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="text-azure-blue h-4 w-4" /> {t("lobby.antiCheat")}
                </span>
                <span className="text-victory-teal font-black">{t("lobby.antiCheatActive")}</span>
              </div>

              {/* Text Preview Monospace Box */}
              <div className="border-slate-dark/15 rounded-2xl border-2 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                  <BookOpen className="h-3.5 w-3.5" /> {t("lobby.previewText")}
                </div>
                <p className="font-mono text-xs leading-relaxed text-zinc-700 italic dark:text-zinc-300">
                  &ldquo;{PREVIEW_TEXTS[selectedCategory]}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="border-slate-dark arcade-shadow sticky bottom-4 z-30 flex flex-col items-center justify-between gap-4 rounded-3xl border-3 bg-white p-4 transition-colors duration-150 sm:flex-row sm:p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="md" className="gap-2 text-xs">
              <ArrowLeft className="h-4 w-4" /> {t("lobby.leaveBtn")}
            </Button>
          </Link>
          <Button
            type="button"
            variant={isSelfReady ? "teal" : "outline"}
            size="md"
            onClick={handleToggleReady}
            className="gap-2 text-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSelfReady ? t("lobby.readyBtnTrue") : t("lobby.readyBtnFalse")}
          </Button>
        </div>

        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <Button
            type="button"
            variant="lime"
            size="lg"
            pulse={true}
            onClick={handleStartRace}
            className="w-full gap-2 text-base sm:w-auto"
          >
            <Play className="fill-slate-dark h-5 w-5" />
            {t("lobby.startRace")}
          </Button>
        </div>
      </div>
    </div>
  );
}
