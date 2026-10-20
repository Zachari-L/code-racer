import type { CSSProperties } from "react";
import { SpeedLines } from "./SpeedLines";

interface ConfettiItem {
  id: number;
  char: string;
  color: string;
  size: string;
  xPercent: number;
  yPercent: number;
  rotationSpeed: number;
  floatDuration: number;
}

const CONFETTI_ELEMENTS: ConfettiItem[] = [
  {
    id: 1,
    char: "✦",
    color: "text-electric-lime/50",
    size: "text-2xl",
    xPercent: 7,
    yPercent: 18,
    rotationSpeed: 10,
    floatDuration: 6,
  },
  {
    id: 2,
    char: "◆",
    color: "text-azure-blue/40",
    size: "text-lg",
    xPercent: 93,
    yPercent: 22,
    rotationSpeed: -8,
    floatDuration: 7,
  },
  {
    id: 3,
    char: "+",
    color: "text-arcade-magenta/40",
    size: "text-xl font-black",
    xPercent: 12,
    yPercent: 75,
    rotationSpeed: 6,
    floatDuration: 5.5,
  },
  {
    id: 4,
    char: "✧",
    color: "text-tangerine-orange/40",
    size: "text-3xl",
    xPercent: 88,
    yPercent: 80,
    rotationSpeed: -10,
    floatDuration: 8,
  },
  {
    id: 5,
    char: "▲",
    color: "text-victory-teal/40",
    size: "text-sm",
    xPercent: 80,
    yPercent: 14,
    rotationSpeed: 8,
    floatDuration: 6.5,
  },
  {
    id: 6,
    char: "✦",
    color: "text-arcade-magenta/30",
    size: "text-xl",
    xPercent: 24,
    yPercent: 35,
    rotationSpeed: 12,
    floatDuration: 7.2,
  },
  {
    id: 7,
    char: "+",
    color: "text-azure-blue/40",
    size: "text-lg font-black",
    xPercent: 70,
    yPercent: 65,
    rotationSpeed: -8,
    floatDuration: 5.8,
  },
  {
    id: 8,
    char: "✧",
    color: "text-tangerine-orange/30",
    size: "text-xl",
    xPercent: 6,
    yPercent: 52,
    rotationSpeed: 6,
    floatDuration: 7.5,
  },
];

/** Ambient decoration, animated in CSS (and frozen for reduced motion). */
export function ArcadeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Dynamic ambient speed lines */}
      <SpeedLines />

      {/* Gentle ambient floating arcade confetti (strictly background decoration, no mouse tracking) */}
      {CONFETTI_ELEMENTS.map((item) => (
        <div
          key={item.id}
          className={`arcade-float absolute ${item.color} ${item.size} drop-shadow-none`}
          style={
            {
              left: `${item.xPercent}%`,
              top: `${item.yPercent}%`,
              "--float-duration": `${item.floatDuration}s`,
              "--float-rotate": `${item.rotationSpeed * 3}deg`,
            } as CSSProperties
          }
        >
          {item.char}
        </div>
      ))}
    </div>
  );
}
