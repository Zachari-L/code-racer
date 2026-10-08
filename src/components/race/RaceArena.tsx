"use client";

import * as React from "react";
import Link from "next/link";
import {
  Flame,
  Gauge,
  Trophy,
  Flag,
  RotateCcw,
  ArrowLeft,
  Clock,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  Play,
  Hourglass,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RacerCar } from "@/components/animated/RacerCar";
import { TireIcon } from "@/components/animated/TireIcon";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { saveRaceResult, startRace, getRaceStatus } from "@/server/actions/race";
import type { PlayerColor } from "@/types/race";

function playBeep(freq: number, durationMs: number = 150) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Autoplay restrictions safely caught
  }
}

interface Competitor {
  id: string;
  name: string;
  color: PlayerColor;
  progress: number; // 0 to 100
  wpm: number;
  isSelf?: boolean;
  rank?: number;
}

interface RaceArenaProps {
  initialCode?: string;
  initialText?: string;
  initialIsHost?: boolean;
  initialStatus?: "WAITING" | "COUNTDOWN" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
}

const DEFAULT_SAMPLE_TEXT =
  "function launchTurboRacer(speed: number): string { return speed > 100 ? 'VICTOIRE ECLATANTE' : 'ACCELERE ENCORE'; }";

export function RaceArena({
  initialCode = "482910",
  initialText = DEFAULT_SAMPLE_TEXT,
  initialIsHost,
  initialStatus,
}: RaceArenaProps) {
  const { data: session } = useSession();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [isHost, setIsHost] = React.useState<boolean>(() => {
    if (typeof initialIsHost === "boolean") return initialIsHost;
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`coderacer_host_${initialCode}`);
      if (stored === "true") return true;
      if (stored === "false") return false;
    }
    return false;
  });

  const [racePhase, setRacePhase] = React.useState<
    "WAITING_FOR_HOST" | "COUNTDOWN" | "RACING" | "FINISHED"
  >(() => {
    if (initialStatus === "IN_PROGRESS" || initialStatus === "COUNTDOWN") {
      return "COUNTDOWN";
    }
    return "WAITING_FOR_HOST";
  });

  const [countdown, setCountdown] = React.useState(3);
  const [isStartingHost, setIsStartingHost] = React.useState(false);

  const [textToType] = React.useState(initialText);
  const [typedInput, setTypedInput] = React.useState("");
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "guest" | "error"
  >("idle");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Synchronize host rights and race start across participants via polling
  React.useEffect(() => {
    if (racePhase !== "WAITING_FOR_HOST") return;
    let isCancelled = false;

    async function checkStatus() {
      const res = await getRaceStatus(initialCode);
      if (isCancelled) return;
      if (res.success && res.race) {
        if (session?.user?.id && res.race.hostId === session.user.id) {
          setIsHost(true);
        }
        if (res.race.status === "IN_PROGRESS" || res.race.status === "COUNTDOWN") {
          setRacePhase("COUNTDOWN");
          setCountdown(3);
        }
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 1200);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [racePhase, initialCode, session?.user?.id]);

  // Visual countdown 3-2-1-GO! effect (CONFIG-7)
  React.useEffect(() => {
    if (racePhase !== "COUNTDOWN") return;

    playBeep(countdown > 0 ? 440 : 880);

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setRacePhase("RACING");
        setStartTime(Date.now());
        setElapsedSec(0);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [racePhase, countdown]);

  async function handleHostStartRace() {
    setIsStartingHost(true);
    await startRace(initialCode, session?.user?.id);
    setIsStartingHost(false);
    setRacePhase("COUNTDOWN");
    setCountdown(3);
  }

  // Group text into words while keeping character indices
  const words = React.useMemo(() => {
    const result: {
      chars: { char: string; index: number }[];
      spaceIndex: number | null;
    }[] = [];
    let currentChars: { char: string; index: number }[] = [];

    for (let i = 0; i < textToType.length; i++) {
      const ch = textToType[i];
      if (ch === " ") {
        result.push({ chars: currentChars, spaceIndex: i });
        currentChars = [];
      } else {
        currentChars.push({ char: ch, index: i });
      }
    }

    if (currentChars.length > 0) {
      result.push({ chars: currentChars, spaceIndex: null });
    }

    return result;
  }, [textToType]);

  // Competitor states
  const [competitors, setCompetitors] = React.useState<Competitor[]>([
    {
      id: "c1",
      name: `TurboTypist ${t("lobby.you")}`,
      color: "azure",
      progress: 0,
      wpm: 0,
      isSelf: true,
    },
    { id: "c2", name: "PixelDriver", color: "tangerine", progress: 0, wpm: 68 },
    { id: "c3", name: "VeloceCode", color: "magenta", progress: 0, wpm: 62 },
    { id: "c4", name: "Bot_Flash", color: "teal", progress: 0, wpm: 55 },
  ]);

  // Telemetry calculation
  const correctChars = React.useMemo(() => {
    let count = 0;
    for (let i = 0; i < typedInput.length; i++) {
      if (typedInput[i] === textToType[i]) {
        count++;
      }
    }
    return count;
  }, [typedInput, textToType]);

  const accuracy = React.useMemo(() => {
    if (typedInput.length === 0) return 100;
    return Math.max(0, Math.round((correctChars / typedInput.length) * 100));
  }, [correctChars, typedInput.length]);

  const liveWpm = React.useMemo(() => {
    if (!startTime || elapsedSec <= 0) return 0;
    const minutes = elapsedSec / 60;
    return Math.max(0, Math.round(correctChars / 5 / minutes));
  }, [startTime, elapsedSec, correctChars]);

  const playerProgress = React.useMemo(() => {
    return Math.min(100, Math.round((typedInput.length / textToType.length) * 100));
  }, [typedInput.length, textToType.length]);

  // Timer loop & competitor AI simulation
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (startTime && !isFinished) {
      interval = setInterval(() => {
        setElapsedSec((prev) => prev + 1);

        // Advance competitors progressively
        setCompetitors((prev) =>
          prev.map((c) => {
            if (c.isSelf) {
              return {
                ...c,
                progress: playerProgress,
                wpm: liveWpm,
              };
            }
            // Bot progression simulation based on their speed
            const speedFactor = c.wpm / 60;
            const increment = speedFactor * (100 / (textToType.length / 5)) * 0.45;
            const newProgress = Math.min(100, Math.round(c.progress + increment));
            return {
              ...c,
              progress: newProgress,
            };
          })
        );
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, isFinished, playerProgress, liveWpm, textToType.length]);

  // Reset race handler
  const handleReset = React.useCallback(() => {
    setTypedInput("");
    setStartTime(null);
    setElapsedSec(0);
    setIsFinished(false);
    setSaveStatus("idle");
    setCompetitors([
      {
        id: "c1",
        name: `TurboTypist ${t("lobby.you")}`,
        color: "azure",
        progress: 0,
        wpm: 0,
        isSelf: true,
      },
      { id: "c2", name: "PixelDriver", color: "tangerine", progress: 0, wpm: 68 },
      { id: "c3", name: "VeloceCode", color: "magenta", progress: 0, wpm: 62 },
      { id: "c4", name: "Bot_Flash", color: "teal", progress: 0, wpm: 55 },
    ]);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  }, [t]);

  // Auto-focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Global keyboard shortcuts: Esc to reset, refocus on printable keystroke
  React.useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (isFinished) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        handleReset();
        return;
      }
      if (document.activeElement === inputRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "BUTTON" || activeEl.tagName === "A")) {
        if (e.key === "Enter" || e.key === " ") return;
      }

      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isFinished, handleReset]);

  // Handle typing input
  // Calculate current rank
  const currentRank = React.useMemo(() => {
    const sorted = [...competitors].sort((a, b) => b.progress - a.progress);
    const index = sorted.findIndex((c) => c.isSelf);
    return index >= 0 ? index + 1 : 1;
  }, [competitors]);

  const handleFinish = React.useCallback(
    (finalVal: string) => {
      setSaveStatus("saving");
      const elapsed = elapsedSec || 1;
      let correct = 0;
      for (let i = 0; i < finalVal.length; i++) {
        if (finalVal[i] === textToType[i]) correct++;
      }
      const finalAccuracy = Math.max(0, Math.round((correct / finalVal.length) * 100));
      const finalWpm = Math.max(0, Math.round(correct / 5 / (elapsed / 60)));
      const rawWpm = Math.max(0, Math.round(finalVal.length / 5 / (elapsed / 60)));

      saveRaceResult({
        code: initialCode,
        wpm: finalWpm,
        rawWpm,
        accuracy: finalAccuracy,
        errorsCount: Math.max(0, finalVal.length - correct),
        durationMs: elapsed * 1000,
        rank: currentRank,
        category: "code",
        language,
      })
        .then((res) => {
          if (res.success && res.saved) {
            setSaveStatus("saved");
          } else if (res.success && res.isGuest) {
            setSaveStatus("guest");
          } else {
            setSaveStatus("error");
          }
        })
        .catch(() => {
          setSaveStatus("error");
        });
    },
    [elapsedSec, textToType, initialCode, currentRank, language]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isFinished) return;
    const val = e.target.value;
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length <= textToType.length) {
      setTypedInput(val);

      if (val.length === textToType.length) {
        setIsFinished(true);
        handleFinish(val);
      }
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      handleReset();
    }
  }

  return (
    <div className="flex w-full max-w-5xl flex-col items-center">
      {/* Race Page Top Navigation & Preferences Bar */}
      <div className="mb-2 flex w-full items-center justify-between px-1 sm:mb-2.5">
        {/* Brand Home Link */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-electric-lime border-slate-dark arcade-shadow flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-transform duration-200 group-hover:rotate-12 dark:border-zinc-700">
            <TireIcon size={22} spinOnHover />
          </div>
          <span className="text-slate-dark text-lg font-black tracking-wider uppercase dark:text-white">
            Code<span className="text-azure-blue">Racer</span>
          </span>
        </Link>

        {/* Preferences: FR / EN Language Toggle + Dark / Light Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Toggle Button (FR / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === "fr" ? "Passer en anglais" : "Switch to French"}
            className="border-slate-dark arcade-shadow flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 text-xs font-black transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Globe className="text-azure-blue h-3.5 w-3.5" />
            <span
              className={
                language === "fr"
                  ? "text-azure-blue font-black"
                  : "font-semibold text-zinc-400 dark:text-zinc-500"
              }
            >
              FR
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span
              className={
                language === "en"
                  ? "text-azure-blue font-black"
                  : "font-semibold text-zinc-400 dark:text-zinc-500"
              }
            >
              EN
            </span>
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "light" ? t("nav.themeDark") : t("nav.themeLight")}
            aria-label={theme === "light" ? "Activer le thème sombre" : "Activer le thème clair"}
            className="border-slate-dark arcade-shadow flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 bg-white transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {theme === "light" ? (
              <Moon className="text-slate-dark h-4 w-4" />
            ) : (
              <Sun className="text-electric-lime fill-electric-lime/30 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* The Single Consolidated Race Card */}
      <div className="border-slate-dark arcade-shadow relative flex max-h-[88vh] w-full flex-col justify-between overflow-hidden rounded-3xl border-3 bg-white p-4 transition-colors duration-150 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900">
        {/* 1. Integrated Header: Navigation + Live Telemetry Gauges + Restart Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-100 pb-3 dark:border-zinc-800">
          {/* Left: Exit button & Live badge */}
          <div className="flex items-center gap-2">
            <Link href={`/lobby/${initialCode}`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs font-black"
                title={t("race.backToLobby")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t("race.backToLobby")}</span>
              </Button>
            </Link>
            {racePhase === "WAITING_FOR_HOST" ? (
              <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-[11px]">
                <Hourglass className="text-tangerine-orange h-3 w-3 animate-spin" />
                {t("lobby.waiting")}
              </Badge>
            ) : racePhase === "COUNTDOWN" ? (
              <Badge variant="azure" className="gap-1 px-2.5 py-0.5 text-[11px]">
                {t("race.countdownReady")}
              </Badge>
            ) : (
              <Badge variant="lime" className="gap-1 px-2.5 py-0.5 text-[11px]">
                <span className="h-2 w-2 animate-ping rounded-full bg-slate-900" />
                {t("race.liveBadge")}
              </Badge>
            )}
            <span className="font-mono text-xs font-black text-zinc-400 dark:text-zinc-500">
              #{initialCode}
            </span>
          </div>

          {/* Center: Live Race Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Position */}
            <div className="border-slate-dark flex items-center gap-1.5 rounded-full border-2 bg-zinc-50 px-2.5 py-0.5 text-xs font-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              <Trophy className="text-tangerine-orange h-3.5 w-3.5" />
              <span>
                {currentRank === 1 ? "1er" : `${currentRank}e`} / {competitors.length}
              </span>
            </div>

            {/* Speedometer (WPM) */}
            <div className="bg-electric-lime border-slate-dark arcade-shadow flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 text-xs font-black text-[#111112] dark:border-zinc-700 dark:text-[#111112]">
              <Flame className="h-3.5 w-3.5 fill-[#111112] text-[#111112]" />
              <span>{liveWpm} WPM</span>
            </div>

            {/* Accuracy (% ACC) */}
            <div className="border-slate-dark bg-victory-teal/20 dark:bg-victory-teal/30 flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-black text-slate-900 dark:border-zinc-700 dark:text-zinc-100">
              <Gauge className="text-victory-teal h-3.5 w-3.5" />
              <span>{accuracy}% ACC</span>
            </div>

            {/* Timer */}
            <div className="border-slate-dark flex items-center gap-1 rounded-full border-2 bg-zinc-50 px-2.5 py-0.5 font-mono text-xs font-black text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Clock className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
              <span>
                {Math.floor(elapsedSec / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(elapsedSec % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Right: Quick Restart Button */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 px-3 text-xs font-black"
              title={t("race.reset")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("race.restart")}</span>
            </Button>
          </div>
        </div>

        {/* 2. Streamlined 4-Lane Race Track Visualizer */}
        <div className="my-2 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs font-black text-slate-900 uppercase dark:text-white">
            <div className="flex items-center gap-1.5">
              <Flag className="text-azure-blue h-4 w-4" />
              <span className="text-xs">{t("race.trackTitle")}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              <span>{t("race.finishLine")}</span>
              <div className="h-3.5 w-3.5 rounded-xs border border-slate-900 bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:4px_4px]" />
            </div>
          </div>

          {/* 4 Competitor Tracks */}
          <div className="grid grid-cols-1 gap-1.5">
            {competitors.map((racer) => {
              const currentProgress = racer.isSelf ? playerProgress : racer.progress;
              const racerWpm = racer.isSelf ? liveWpm : racer.wpm;

              return (
                <div
                  key={racer.id}
                  className={`border-slate-dark relative rounded-xl border-2 px-2 py-1 transition-all dark:border-zinc-700 ${
                    racer.isSelf
                      ? "border-azure-blue bg-azure-blue/5 dark:bg-azure-blue/10"
                      : "bg-zinc-50/60 dark:bg-zinc-800/40"
                  }`}
                >
                  {/* Racer info label above road */}
                  <div className="mb-0.5 flex items-center justify-between text-[11px] font-black">
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          racer.color === "azure"
                            ? "bg-azure-blue"
                            : racer.color === "tangerine"
                              ? "bg-tangerine-orange"
                              : racer.color === "magenta"
                                ? "bg-arcade-magenta"
                                : "bg-victory-teal"
                        }`}
                      />
                      <span className="text-slate-dark dark:text-zinc-200">{racer.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                      {racerWpm} WPM • {Math.round(currentProgress)}%
                    </span>
                  </div>

                  {/* Track road surface */}
                  <div className="relative flex h-8 w-full items-center select-none">
                    <div className="border-slate-dark/30 absolute top-1/2 right-6 left-1 h-2.5 -translate-y-1/2 overflow-hidden rounded-full border bg-[#1c1d22]">
                      {/* Road dashed center line */}
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#ffffff_0_4px,transparent_4px_8px)] opacity-35" />

                      {/* Traversed Road segment */}
                      <motion.div
                        className={`absolute top-0 bottom-0 left-0 overflow-hidden rounded-l-full ${
                          racer.color === "azure"
                            ? "bg-azure-blue"
                            : racer.color === "tangerine"
                              ? "bg-tangerine-orange"
                              : racer.color === "magenta"
                                ? "bg-arcade-magenta"
                                : "bg-victory-teal"
                        }`}
                        style={{ width: `${currentProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>

                    {/* Finish line marker */}
                    <div
                      className="border-slate-dark/70 absolute top-1/2 z-10 w-2.5 -translate-y-1/2 rounded-xs border bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:3px_3px]"
                      style={{ right: "24px", height: "16px" }}
                    />

                    {/* Car sprite */}
                    <motion.div
                      className="absolute top-0 bottom-0 z-20 flex items-center"
                      style={{
                        left: `calc(1px + (${currentProgress} / 100) * (100% - 58px))`,
                      }}
                      transition={{ type: "spring", stiffness: 240, damping: 25 }}
                    >
                      <RacerCar
                        color={racer.color}
                        wpm={racerWpm}
                        width={52}
                        height={26}
                        showSmoke={currentProgress > 3}
                        showHeadlight={true}
                      />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Integrated Monospace Typing Arena (Monkeytype Style) */}
        <div className="space-y-2 border-t-2 border-zinc-100 pt-2.5 dark:border-zinc-800">
          {/* Interactive Text Display & Hidden Input Stream */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="border-slate-dark/25 relative min-h-[110px] cursor-text rounded-2xl border-2 bg-zinc-50/80 p-4 font-mono text-base leading-relaxed transition-all select-none sm:p-5 sm:text-lg md:text-xl dark:border-zinc-700 dark:bg-zinc-800/60"
          >
            {/* Invisible Native Input (Captures keystrokes, disables paste) */}
            <input
              ref={inputRef}
              type="text"
              value={typedInput}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onPaste={(e) => e.preventDefault()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={racePhase !== "RACING" || isFinished}
              autoFocus={racePhase === "RACING"}
              aria-label="Monospace Typing Stream"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
            />

            {/* Rendered Words & Characters */}
            <div className="relative z-0 flex flex-wrap content-start items-center">
              {words.map((w, wIdx) => (
                <span key={wIdx} className="inline-flex items-center whitespace-nowrap">
                  {w.chars.map(({ char, index }) => {
                    const isTyped = index < typedInput.length;
                    const isCurrent = index === typedInput.length;
                    const isCorrect = isTyped && typedInput[index] === char;
                    const isError = isTyped && typedInput[index] !== char;

                    return (
                      <span
                        key={index}
                        className={`relative transition-colors duration-75 ${
                          isCorrect
                            ? "font-bold text-emerald-500 dark:text-emerald-400"
                            : isError
                              ? "rounded-xs bg-rose-500/20 font-bold text-rose-500 underline decoration-rose-500 decoration-2 dark:bg-rose-500/30 dark:text-rose-400"
                              : "font-normal text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {isCurrent && !isFinished && (
                          <motion.span
                            animate={{ opacity: isFocused ? [1, 0, 1] : 0 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-electric-lime pointer-events-none absolute top-[10%] bottom-[10%] -left-[1.5px] z-20 w-[2.5px] rounded-full border border-slate-900 shadow-[0_0_8px_rgba(210,255,0,0.8)]"
                          />
                        )}
                        {char}
                      </span>
                    );
                  })}

                  {w.spaceIndex !== null &&
                    (() => {
                      const sIdx = w.spaceIndex;
                      const isTyped = sIdx < typedInput.length;
                      const isCurrent = sIdx === typedInput.length;
                      const isError = isTyped && typedInput[sIdx] !== " ";

                      return (
                        <span
                          key={sIdx}
                          className={`relative inline-block transition-colors duration-75 ${
                            isError
                              ? "rounded-xs bg-rose-500/20 font-bold text-rose-500 underline decoration-rose-500 decoration-2 dark:bg-rose-500/30 dark:text-rose-400"
                              : ""
                          }`}
                        >
                          {isCurrent && !isFinished && (
                            <motion.span
                              animate={{ opacity: isFocused ? [1, 0, 1] : 0 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                              className="bg-electric-lime pointer-events-none absolute top-[10%] bottom-[10%] -left-[1.5px] z-20 w-[2.5px] rounded-full border border-slate-900 shadow-[0_0_8px_rgba(210,255,0,0.8)]"
                            />
                          )}
                          {isError ? "_" : "\u00A0"}
                        </span>
                      );
                    })()}
                </span>
              ))}

              {/* Caret if at very end of entire text */}
              {typedInput.length === textToType.length && !isFinished && (
                <motion.span
                  animate={{ opacity: isFocused ? [1, 0, 1] : 0 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-electric-lime pointer-events-none inline-block h-5 w-[2.5px] rounded-full border border-slate-900 align-middle shadow-[0_0_8px_rgba(210,255,0,0.8)]"
                />
              )}
            </div>

            {/* Out of focus prompt */}
            {racePhase === "RACING" && !isFocused && !isFinished && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xs transition-all dark:bg-zinc-900/70">
                <div className="border-slate-dark arcade-shadow flex items-center gap-2 rounded-full border-2 bg-white px-4 py-1.5 font-sans text-xs font-black text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <span className="bg-electric-lime h-2 w-2 animate-ping rounded-full" />
                  {t("race.clickToFocus")}
                </div>
              </div>
            )}

            {/* Waiting for host start overlay */}
            <AnimatePresence>
              {racePhase === "WAITING_FOR_HOST" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-25 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white/95 p-5 text-center backdrop-blur-xs dark:border-zinc-700 dark:bg-zinc-900/95"
                >
                  {isHost ? (
                    <div className="flex max-w-md flex-col items-center gap-3">
                      <Badge variant="lime" className="gap-1.5 px-3 py-1 text-xs">
                        <Crown className="text-slate-dark h-3.5 w-3.5" />
                        {t("lobby.host")}
                      </Badge>
                      <h3 className="text-slate-dark text-xl font-black uppercase sm:text-2xl dark:text-white">
                        Prêt pour le départ
                      </h3>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        Vous êtes l&apos;hôte de ce salon. Lancez le départ pour démarrer le compte
                        à rebours de tous les participants !
                      </p>
                      <Button
                        type="button"
                        variant="lime"
                        size="lg"
                        pulse={true}
                        disabled={isStartingHost}
                        onClick={handleHostStartRace}
                        className="mt-1 gap-2 px-8 text-base font-black shadow-lg"
                      >
                        <Play className="fill-slate-dark h-5 w-5" />
                        {isStartingHost ? t("card.connecting") : t("race.hostStartBtn")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex max-w-md flex-col items-center gap-3">
                      <div className="bg-azure-blue/15 border-azure-blue mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2">
                        <Hourglass className="text-azure-blue h-6 w-6 animate-spin" />
                      </div>
                      <h3 className="text-slate-dark text-xl font-black uppercase sm:text-2xl dark:text-white">
                        {t("race.waitingForHost")}
                      </h3>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        L&apos;hôte n&apos;a pas encore donné le signal. Tenez-vous prêt sur la
                        grille, la course démarrera dès le lancement !
                      </p>
                      <Link href={`/lobby/${initialCode}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 gap-1.5 text-xs font-black"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>{t("race.backToLobby")}</span>
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visual 3-2-1-GO! Countdown overlay (CONFIG-7) */}
            <AnimatePresence>
              {racePhase === "COUNTDOWN" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border-slate-dark arcade-shadow absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl border-2 bg-white/95 p-5 backdrop-blur-xs dark:border-zinc-700 dark:bg-zinc-900/95"
                >
                  {/* Traffic lights row */}
                  <div className="border-slate-dark arcade-shadow mb-3 flex items-center gap-3 rounded-full border-3 bg-[#111112] px-6 py-2.5">
                    <div
                      className={`h-6 w-6 rounded-full border-2 border-slate-900 transition-all duration-200 ${
                        countdown >= 3
                          ? "scale-115 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.95)]"
                          : "bg-rose-950 opacity-30"
                      }`}
                    />
                    <div
                      className={`h-6 w-6 rounded-full border-2 border-slate-900 transition-all duration-200 ${
                        countdown === 2
                          ? "scale-115 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.95)]"
                          : "bg-amber-950 opacity-30"
                      }`}
                    />
                    <div
                      className={`h-6 w-6 rounded-full border-2 border-slate-900 transition-all duration-200 ${
                        countdown === 1
                          ? "scale-115 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.95)]"
                          : "bg-orange-950 opacity-30"
                      }`}
                    />
                    <div
                      className={`h-6 w-6 rounded-full border-2 border-slate-900 transition-all duration-200 ${
                        countdown === 0
                          ? "bg-electric-lime scale-125 shadow-[0_0_20px_rgba(210,255,0,1)]"
                          : "bg-emerald-950 opacity-30"
                      }`}
                    />
                  </div>

                  {/* Big Number / "PARTEZ !" */}
                  <div className="text-center font-mono">
                    {countdown > 0 ? (
                      <motion.div
                        key={countdown}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.4, opacity: 0 }}
                        className="text-slate-dark text-7xl font-black sm:text-8xl dark:text-white"
                      >
                        {countdown}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                        className="text-electric-lime text-5xl font-black tracking-widest uppercase sm:text-7xl"
                      >
                        {t("race.countdownGo")}
                      </motion.div>
                    )}
                  </div>

                  <p className="mt-2 text-xs font-black tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                    {countdown > 0 ? t("race.countdownReady") : t("race.lockedUntilStart")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer info & hotkey hints */}
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-victory-teal h-3 w-3" />
              {t("race.antiCheatActive")}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="border-slate-dark/30 rounded border bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                Tab / Esc
              </kbd>
              <span>{t("race.restart")}</span>
            </span>
          </div>
        </div>

        {/* 4. Victory / Finish Inline Banner Overlay */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="border-slate-dark arcade-shadow absolute inset-x-4 bottom-4 z-30 flex flex-col items-center justify-between gap-3 rounded-2xl border-3 bg-white p-4 shadow-xl sm:flex-row dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="border-slate-dark flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                    <Trophy className="text-tangerine-orange h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-dark text-base font-black uppercase dark:text-white">
                      {currentRank === 1
                        ? t("race.victory")
                        : t("race.finishedRank", { rank: currentRank })}
                    </h3>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {t("race.finalSpeed")}{" "}
                      <span className="font-mono font-black">{liveWpm} WPM</span> •{" "}
                      {t("race.accuracy")} <span className="font-mono font-black">{accuracy}%</span>
                    </p>
                  </div>
                </div>

                {saveStatus === "saved" && (
                  <div className="flex items-center gap-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{t("race.resultSaved")}</span>
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-1 h-6 px-2 text-[10px] font-black"
                      >
                        {t("race.viewProfile")}
                      </Button>
                    </Link>
                  </div>
                )}
                {saveStatus === "guest" && (
                  <div className="border-electric-lime/50 bg-electric-lime/20 flex items-center gap-2 rounded-xl border-2 px-3 py-1 text-xs font-black text-[#111112] dark:border-zinc-700 dark:text-zinc-100">
                    <span>{t("race.guestNotice")}</span>
                    <Link href="/login">
                      <Button
                        variant="lime"
                        size="sm"
                        className="ml-1 h-6 px-2 text-[10px] font-black"
                      >
                        {t("race.loginToSave")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> {t("race.restart")}
                </Button>
                <Link href={`/lobby/${initialCode}`}>
                  <Button variant="azure" size="sm" className="h-9 gap-1.5 text-xs">
                    {t("race.backToLobby")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
