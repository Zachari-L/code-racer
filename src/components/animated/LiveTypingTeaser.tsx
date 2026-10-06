"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Gauge, Flag, Flame, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MinimalistTrack } from "@/components/animated/tracks/MinimalistTrack";

const DEMO_TEXT = "function startRace() { return 'TURBO_SPEED'; }";

export function LiveTypingTeaser() {
  const [typedIndex, setTypedIndex] = React.useState(0);
  const [wpm, setWpm] = React.useState(85);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const timer = setInterval(() => {
      setTypedIndex((prev) => {
        if (prev >= DEMO_TEXT.length) {
          // Pause on the finish race line for 1.8s so the user clearly sees the car on the line
          if (!timeoutId) {
            timeoutId = setTimeout(() => {
              setTypedIndex(0);
              timeoutId = null;
            }, 1800);
          }
          return DEMO_TEXT.length;
        }
        return prev + 1;
      });

      // Natural speed acceleration as typing progresses
      setWpm(() => {
        const target =
          75 +
          Math.floor((typedIndex / DEMO_TEXT.length) * 35) +
          Math.floor((Math.random() - 0.5) * 8);
        return Math.max(50, Math.min(130, target));
      });
    }, 120);

    return () => {
      clearInterval(timer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [typedIndex]);

  const progressPercent = Math.min(100, (typedIndex / DEMO_TEXT.length) * 100);
  const isFinished = progressPercent >= 100;

  return (
    <div className="border-slate-dark arcade-shadow relative w-full max-w-2xl overflow-hidden rounded-3xl border-3 bg-white p-5">
      {/* Track Header */}
      <div className="mb-4 flex items-center justify-between border-b-2 border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={isFinished ? "lime" : "azure"} className="gap-1.5 px-2.5 py-0.5">
            {isFinished ? (
              <>
                <CheckCircle2 className="text-slate-dark h-3 w-3" />
                Ligne Franchie !
              </>
            ) : (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                Direct Arène
              </>
            )}
          </Badge>
          <span className="font-mono text-xs font-bold text-zinc-500">Piste #01 — Course</span>
        </div>

        <div className="text-slate-dark flex items-center gap-3 font-mono font-black">
          <div className="bg-electric-lime/30 border-slate-dark flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs">
            <Flame className="text-tangerine-orange fill-tangerine-orange h-3.5 w-3.5" />
            <span>{wpm} WPM</span>
          </div>
          <span className="text-victory-teal text-xs font-black">99.2% ACC</span>
        </div>
      </div>

      {/* Sleek Minimalist Race Track (Style 2, Borderless) */}
      <div className="mb-4">
        <MinimalistTrack progressPercent={progressPercent} wpm={wpm} />
      </div>

      {/* Typing Code Snippet */}
      <div className="border-slate-dark/15 rounded-2xl border-2 bg-zinc-50/80 p-4 font-mono text-base leading-relaxed select-none sm:text-lg">
        <span className="text-victory-teal font-bold">{DEMO_TEXT.slice(0, typedIndex)}</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="bg-azure-blue mx-0.5 inline-block h-5 w-2.5 rounded-sm align-middle"
        />
        <span className="text-zinc-400">{DEMO_TEXT.slice(typedIndex)}</span>
      </div>

      {/* Footer Indicators */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Gauge className="text-azure-blue h-3.5 w-3.5" />
          Vitesse d&apos;animation adaptative selon votre rythme de frappe
        </span>
        <span className="text-slate-dark flex items-center gap-1 font-mono font-black">
          <Flag className="text-tangerine-orange h-3.5 w-3.5" />
          {Math.round(progressPercent)}%
        </span>
      </div>
    </div>
  );
}
