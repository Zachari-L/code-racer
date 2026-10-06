"use client";

import * as React from "react";
import Link from "next/link";
import { Flame, Gauge, Trophy, Flag, RotateCcw, DoorOpen, ArrowLeft, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RacerCar } from "@/components/animated/RacerCar";
import type { PlayerColor } from "@/types/race";

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
}

const DEFAULT_SAMPLE_TEXT =
  "function launchTurboRacer(speed: number): string { return speed > 100 ? 'VICTOIRE ECLATANTE' : 'ACCELERE ENCORE'; }";

export function RaceArena({
  initialCode = "482910",
  initialText = DEFAULT_SAMPLE_TEXT,
}: RaceArenaProps) {
  const [textToType] = React.useState(initialText);
  const [typedInput, setTypedInput] = React.useState("");
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [isFinished, setIsFinished] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Competitor states
  const [competitors, setCompetitors] = React.useState<Competitor[]>([
    { id: "c1", name: "TurboTypist (Vous)", color: "azure", progress: 0, wpm: 0, isSelf: true },
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

  // Handle typing input
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Only allow typing up to text length
    if (val.length <= textToType.length) {
      setTypedInput(val);

      if (val.length === textToType.length) {
        setIsFinished(true);
      }
    }
  }

  function handleReset() {
    setTypedInput("");
    setStartTime(null);
    setElapsedSec(0);
    setIsFinished(false);
    setCompetitors([
      { id: "c1", name: "TurboTypist (Vous)", color: "azure", progress: 0, wpm: 0, isSelf: true },
      { id: "c2", name: "PixelDriver", color: "tangerine", progress: 0, wpm: 68 },
      { id: "c3", name: "VeloceCode", color: "magenta", progress: 0, wpm: 62 },
      { id: "c4", name: "Bot_Flash", color: "teal", progress: 0, wpm: 55 },
    ]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  // Calculate current rank
  const currentRank = React.useMemo(() => {
    const sorted = [...competitors].sort((a, b) => b.progress - a.progress);
    const index = sorted.findIndex((c) => c.isSelf);
    return index >= 0 ? index + 1 : 1;
  }, [competitors]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      {/* Top Race HUD Bar */}
      <div className="border-slate-dark arcade-shadow flex flex-wrap items-center justify-between gap-4 rounded-3xl border-3 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Badge variant="lime" className="gap-1.5 px-3 py-1">
            <span className="h-2 w-2 animate-ping rounded-full bg-slate-900" />
            Course en Direct
          </Badge>
          <span className="font-mono text-xs font-black tracking-wider text-zinc-500 uppercase">
            Salon #{initialCode}
          </span>
        </div>

        {/* Live Gauges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Position */}
          <div className="border-slate-dark flex items-center gap-1.5 rounded-full border-2 bg-zinc-50 px-3 py-1 text-xs font-black">
            <Trophy className="text-tangerine-orange h-4 w-4" />
            <span>
              {currentRank === 1 ? "1er" : `${currentRank}e`} / {competitors.length}
            </span>
          </div>

          {/* Live WPM Speedometer */}
          <div className="bg-electric-lime border-slate-dark arcade-shadow flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1 text-xs font-black text-slate-900">
            <Flame className="h-4 w-4 fill-slate-900 text-slate-900" />
            <span>{liveWpm} WPM</span>
          </div>

          {/* Accuracy Gauge */}
          <div className="border-slate-dark bg-victory-teal/20 flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-black text-slate-900">
            <Gauge className="text-victory-teal h-4 w-4" />
            <span>{accuracy}% ACC</span>
          </div>

          {/* Time Elapsed */}
          <div className="border-slate-dark flex items-center gap-1.5 rounded-full border-2 bg-zinc-50 px-3 py-1 font-mono text-xs font-black text-zinc-700">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              {Math.floor(elapsedSec / 60)
                .toString()
                .padStart(2, "0")}
              :{(elapsedSec % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Realtime Multi-Lane Track Arena */}
      <Card className="overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b-2 border-zinc-100 pb-3">
            <div className="flex items-center gap-2 font-black text-slate-900 uppercase">
              <Flag className="text-azure-blue h-5 w-5" />
              <span>Circuit des Champions</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs font-bold text-zinc-400">
              <span>Ligne d&apos;arrivée</span>
              <div className="h-4 w-4 rounded-xs border border-slate-900 bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:4px_4px]" />
            </div>
          </div>

          {/* 4 Competitor Track Lanes */}
          <div className="space-y-3">
            {competitors.map((racer) => {
              const currentProgress = racer.isSelf ? playerProgress : racer.progress;
              const racerWpm = racer.isSelf ? liveWpm : racer.wpm;

              return (
                <div
                  key={racer.id}
                  className={`border-slate-dark relative rounded-2xl border-2 p-2 transition-all ${
                    racer.isSelf ? "border-azure-blue bg-azure-blue/5" : "bg-zinc-50/60"
                  }`}
                >
                  {/* Racer Tag & Stats above the track */}
                  <div className="mb-1 flex items-center justify-between px-2 text-xs font-black">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          racer.color === "azure"
                            ? "bg-azure-blue"
                            : racer.color === "tangerine"
                              ? "bg-tangerine-orange"
                              : racer.color === "magenta"
                                ? "bg-arcade-magenta"
                                : "bg-victory-teal"
                        }`}
                      />
                      <span className="text-slate-dark">{racer.name}</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {racerWpm} WPM • {Math.round(currentProgress)}%
                    </span>
                  </div>

                  {/* Track Surface with moving car */}
                  <div className="relative flex h-11 w-full items-center select-none">
                    {/* Road surface */}
                    <div className="border-slate-dark/30 absolute top-1/2 right-7 left-2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full border bg-[#1e2026]">
                      {/* Untraversed dashed center line */}
                      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#ffffff_0_5px,transparent_5px_10px)] opacity-40" />

                      {/* Traversed road segment */}
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

                    {/* Finish Line */}
                    <div
                      className="border-slate-dark/70 absolute top-1/2 z-10 w-3 -translate-y-1/2 rounded-xs border bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:4px_4px]"
                      style={{ right: "26px", height: "20px" }}
                    />

                    {/* Car Sprite */}
                    <motion.div
                      className="absolute top-0 bottom-0 z-20 flex items-center"
                      style={{
                        left: `calc(2px + (${currentProgress} / 100) * (100% - 70px))`,
                      }}
                      transition={{ type: "spring", stiffness: 240, damping: 25 }}
                    >
                      <RacerCar
                        color={racer.color}
                        wpm={racerWpm}
                        width={64}
                        height={32}
                        showSmoke={currentProgress > 2}
                        showHeadlight={true}
                      />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Typing Arena: Snippet Display + Realtime Input Box */}
      <Card className="bg-white">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-3">
            <span className="text-slate-dark text-xs font-black tracking-wider uppercase">
              Texte à Dactylographier
            </span>
            <Badge variant="outline" className="text-[11px]">
              Anti-Triche Actif (Collage bloqué)
            </Badge>
          </div>

          {/* Interactive Monospace Code Box */}
          <div className="border-slate-dark/20 rounded-2xl border-2 bg-zinc-50/80 p-5 font-mono text-base leading-loose select-none sm:text-lg">
            {/* Correctly typed portion */}
            <span className="text-victory-teal bg-victory-teal/10 rounded-sm font-bold">
              {textToType.slice(0, typedInput.length)}
            </span>

            {/* Current cursor indicator */}
            {!isFinished && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="bg-azure-blue mx-0.5 inline-block h-5 w-2.5 rounded-xs align-middle"
              />
            )}

            {/* Remaining text to type */}
            <span className="text-zinc-400">{textToType.slice(typedInput.length)}</span>
          </div>

          {/* Big Tactile Typing Input Field */}
          <div className="space-y-2">
            <label className="text-slate-dark block text-xs font-black tracking-wider uppercase">
              Votre Saisie
            </label>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              disabled={isFinished}
              value={typedInput}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()} // Anti-cheat rule strictly enforced
              placeholder={
                isFinished
                  ? "Course terminée !"
                  : "Tapez le texte ci-dessus pour faire accélérer votre bolide..."
              }
              className="text-slate-dark border-slate-dark arcade-shadow focus:border-azure-blue focus:ring-azure-blue/20 w-full rounded-2xl border-3 bg-white px-5 py-3 font-mono text-base font-bold placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 focus:ring-4 focus:outline-none disabled:bg-zinc-100"
            />
          </div>

          {/* Finish Race Victory Card */}
          <AnimatePresence>
            {isFinished && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-slate-dark arcade-shadow bg-electric-lime/30 flex flex-col items-center justify-between gap-4 rounded-2xl border-3 p-5 sm:flex-row"
              >
                <div className="flex items-center gap-3">
                  <div className="border-slate-dark flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-white">
                    <Trophy className="text-tangerine-orange h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-slate-dark text-lg font-black uppercase">
                      Ligne Franchie !{" "}
                      {currentRank === 1 ? "Victoire !" : `Terminé (${currentRank}e)`}
                    </h3>
                    <p className="text-xs font-bold text-zinc-600">
                      Vitesse finale : <span className="font-mono font-black">{liveWpm} WPM</span> •
                      Précision : <span className="font-mono font-black">{accuracy}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-4 w-4" /> Recommencer
                  </Button>
                  <Link href={`/lobby/${initialCode}`}>
                    <Button variant="azure" size="sm" className="gap-1.5 text-xs">
                      Retour au Salon
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Bottom Race Controls */}
      <div className="border-slate-dark arcade-shadow flex flex-wrap items-center justify-between gap-4 rounded-3xl border-3 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="md" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" /> Quitter
            </Button>
          </Link>
          <Link href={`/lobby/${initialCode}`}>
            <Button variant="outline" size="md" className="gap-1.5 text-xs">
              <DoorOpen className="h-4 w-4" /> Salon
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={handleReset} className="gap-2 text-xs">
            <RotateCcw className="h-4 w-4" /> Réinitialiser la Course
          </Button>
        </div>
      </div>
    </div>
  );
}
