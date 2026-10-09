"use client";

import * as React from "react";
import { motion } from "motion/react";
import { RacerCar } from "@/components/animated/RacerCar";
import { useLanguage } from "@/context/LanguageContext";

interface TrackProps {
  progressPercent: number;
  wpm: number;
}

const CAR_WIDTH = 68;

export function MinimalistTrack({ progressPercent, wpm }: TrackProps) {
  const { t } = useLanguage();
  return (
    <div className="relative w-full py-1 select-none">
      {/* Floating Track Container */}
      <div className="relative flex h-11 w-full items-center">
        {/* Small Asphalt Road Line (Width strictly preserved) */}
        <div className="border-slate-dark/40 absolute top-1/2 right-7 left-2 h-3 -translate-y-1/2 overflow-hidden rounded-full border bg-[#1c1e24] shadow-inner">
          {/* Dashed Center Road Line (Untraversed asphalt markings) */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#ffffff_0_5px,transparent_5px_11px)] opacity-50" />

          {/* Traversed solid blue road behind car (clean solid color, no diagonal stripes) */}
          <motion.div
            className="bg-azure-blue absolute top-0 bottom-0 left-0 overflow-hidden rounded-l-full"
            style={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.15 }}
          >
            {/* Dashed center line over the active blue road */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#ffffff_0_5px,transparent_5px_11px)] opacity-85" />
          </motion.div>
        </div>

        {/* Checkered Finish Line across the road */}
        <div
          className="border-slate-dark/70 absolute top-1/2 z-10 w-3 -translate-y-1/2 rounded-xs border bg-[repeating-conic-gradient(#111112_0_25%,#ffffff_0_50%)] bg-[length:4px_4px] shadow-xs"
          style={{ right: "28px", height: "18px" }}
          title={t("race.finishLine")}
        />

        {/* Bulky 2D Car positioned on the small road */}
        <motion.div
          className="absolute top-0 bottom-0 z-20 flex items-center"
          style={{
            // At 100%, the car sits squarely ON the checkered finish line
            left: `calc(4px + (${progressPercent} / 100) * (100% - 73px))`,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          <RacerCar
            color="azure"
            wpm={wpm}
            width={CAR_WIDTH}
            height={32}
            showSmoke={progressPercent > 2}
            showHeadlight={true}
          />
        </motion.div>
      </div>
    </div>
  );
}
