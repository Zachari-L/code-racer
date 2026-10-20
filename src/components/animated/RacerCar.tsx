"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { CarColor } from "@/lib/game/colors";

interface RacerCarProps {
  color?: CarColor;
  wpm?: number;
  showSmoke?: boolean;
  showHeadlight?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const CAR_COLOR_MAP = {
  azure: { body: "#007BFF", bodyDark: "#0056b3", accent: "#d2ff00" },
  tangerine: { body: "#FF7A00", bodyDark: "#cc6200", accent: "#ffffff" },
  magenta: { body: "#D9008D", bodyDark: "#a3006a", accent: "#d2ff00" },
  teal: { body: "#00BFA5", bodyDark: "#008f7a", accent: "#ffffff" },
  lime: { body: "#d2ff00", bodyDark: "#a6cc00", accent: "#111112" },
};

export function RacerCar({
  color = "azure",
  wpm = 75,
  showSmoke = true,
  showHeadlight = true,
  width = 88,
  height = 44,
  className = "",
}: RacerCarProps) {
  const palette = CAR_COLOR_MAP[color] || CAR_COLOR_MAP.azure;

  // Dynamic animation duration based on WPM:
  // Higher WPM = faster vibration/rumble, smoke generation and wheel spin
  const rumbleDuration = Math.max(0.12, Math.min(0.5, 20 / Math.max(wpm, 30)));
  const wheelSpinDuration = Math.max(0.15, Math.min(0.75, 28 / Math.max(wpm, 30)));
  const smokePuffDuration = Math.max(0.3, Math.min(0.75, 42 / Math.max(wpm, 30)));

  return (
    <div className={`relative flex items-center select-none ${className}`}>
      {/* 1. Animated Exhaust Smoke Cloud */}
      {showSmoke && (
        <div className="pointer-events-none absolute bottom-1.5 -left-5 z-0">
          {/* Smoke puff 1 */}
          <motion.div
            className="border-slate-dark/30 absolute h-3.5 w-3.5 rounded-full border-2 bg-white/90 blur-[0.3px]"
            animate={{
              x: [0, -16, -30],
              y: [0, -4, -8],
              scale: [0.4, 1.1, 1.8],
              opacity: [0.95, 0.6, 0],
            }}
            transition={{
              duration: smokePuffDuration,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0,
            }}
          />

          {/* Smoke puff 2 */}
          <motion.div
            className="border-slate-dark/30 absolute h-3 w-3 rounded-full border-2 bg-zinc-200/90 blur-[0.3px]"
            animate={{
              x: [0, -12, -24],
              y: [0, -2, -5],
              scale: [0.3, 0.9, 1.5],
              opacity: [0.9, 0.5, 0],
            }}
            transition={{
              duration: smokePuffDuration,
              repeat: Infinity,
              ease: "easeOut",
              delay: smokePuffDuration * 0.35,
            }}
          />

          {/* Smoke puff 3 */}
          <motion.div
            className="border-slate-dark/20 absolute h-2.5 w-2.5 rounded-full border bg-white/80 blur-[0.3px]"
            animate={{
              x: [0, -20, -36],
              y: [0, -6, -11],
              scale: [0.5, 1.3, 2.2],
              opacity: [1, 0.4, 0],
            }}
            transition={{
              duration: smokePuffDuration,
              repeat: Infinity,
              ease: "easeOut",
              delay: smokePuffDuration * 0.7,
            }}
          />
        </div>
      )}

      {/* 2. Bulky Car Chassis with Squash & Stretch Rumble Animation Driven by WPM */}
      <motion.div
        className="relative z-10 origin-bottom"
        animate={{
          scaleX: [1, 1.05, 0.97, 1.03, 1],
          scaleY: [1, 0.93, 1.05, 0.97, 1],
          y: [0, -2, 0.8, -1.2, 0],
        }}
        transition={{
          duration: rumbleDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox="0 0 80 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-md"
        >
          {/* Headlight beam projection forward */}
          {showHeadlight && (
            <polygon
              points="73,19 115,11 115,31 73,24"
              fill="url(#headlight-beam-bulky)"
              opacity="0.6"
            />
          )}

          <defs>
            <linearGradient id="headlight-beam-bulky" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d2ff00" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d2ff00" stopOpacity="0" />
            </linearGradient>

            {/* Car body gradient */}
            <linearGradient id={`bulky-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={palette.body} />
              <stop offset="100%" stopColor={palette.bodyDark} />
            </linearGradient>

            {/* Tinted glass gradient */}
            <linearGradient id="bulky-glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#111112" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Rear Exhaust Pipe */}
          <rect
            x="3"
            y="24"
            width="6"
            height="4"
            rx="1.5"
            fill="#e2e8f0"
            stroke="#111112"
            strokeWidth="2"
          />

          {/* Integrated Rear Spoiler (Compact & chunky) */}
          <path
            d="M 4 10 L 15 10 C 16 10, 17 11, 16 13 L 7 13 C 6 13, 5 12, 4 10 Z"
            fill={palette.bodyDark}
            stroke="#111112"
            strokeWidth="2.2"
          />
          <line x1="8" y1="13" x2="9" y2="17" stroke="#111112" strokeWidth="2.5" />

          {/* Bulky, rounded, toy-like body silhouette */}
          <path
            d="
              M 6 28
              L 74 28
              C 77 28, 78 25, 76 22
              L 70 17
              C 67 15, 63 15, 58 15
              L 49 6
              C 46 4, 34 4, 26 4
              L 18 4
              C 15 4, 13 6, 12 9
              L 9 16
              L 5 16
              C 3 16, 3 19, 3 23
              Z
            "
            fill={`url(#bulky-gradient-${color})`}
            stroke="#111112"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Large Tinted Cabin Window (Rounded & friendly) */}
          <path
            d="
              M 22 7
              L 45 7
              C 47 7, 49 8, 51 10
              L 58 15
              L 16 15
              C 16 11, 19 7, 22 7
              Z
            "
            fill="url(#bulky-glass-gradient)"
            stroke="#111112"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Windshield Reflection Glare */}
          <path d="M 28 8 L 40 8 L 34 13 L 23 13 Z" fill="white" opacity="0.4" />

          {/* Racing Side Stripe */}
          <path d="M 10 21 L 73 21 L 71 23 L 8 23 Z" fill={palette.accent} opacity="0.95" />

          {/* Round Race Number Decal (Chunky Arcade Badge) */}
          <circle cx="37" cy="22" r="4.5" fill="#f4f4ed" stroke="#111112" strokeWidth="1.6" />
          <text
            x="37"
            y="24.2"
            textAnchor="middle"
            fill="#111112"
            fontSize="6.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            1
          </text>

          {/* Front Bumper Headlight (Chunky round pill) */}
          <ellipse
            cx="72"
            cy="20"
            rx="3"
            ry="2.2"
            fill="#d2ff00"
            stroke="#111112"
            strokeWidth="1.5"
          />

          {/* --- REAR CHUNKY WHEEL --- */}
          <g transform="translate(21, 28)">
            {/* Chunky rubber tire */}
            <circle cx="0" cy="0" r="9" fill="#111112" stroke="#111112" strokeWidth="1" />
            {/* Rim */}
            <circle
              cx="0"
              cy="0"
              r="5.5"
              fill={palette.accent}
              stroke="#111112"
              strokeWidth="1.5"
            />
            {/* Rotating 4-spoke cross */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: wheelSpinDuration, repeat: Infinity, ease: "linear" }}
            >
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#111112" strokeWidth="1.8" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#111112" strokeWidth="1.8" />
            </motion.g>
            {/* Center lug nut */}
            <circle cx="0" cy="0" r="2" fill="#111112" />
          </g>

          {/* --- FRONT CHUNKY WHEEL --- */}
          <g transform="translate(59, 28)">
            {/* Chunky rubber tire */}
            <circle cx="0" cy="0" r="9" fill="#111112" stroke="#111112" strokeWidth="1" />
            {/* Rim */}
            <circle
              cx="0"
              cy="0"
              r="5.5"
              fill={palette.accent}
              stroke="#111112"
              strokeWidth="1.5"
            />
            {/* Rotating 4-spoke cross */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: wheelSpinDuration, repeat: Infinity, ease: "linear" }}
            >
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#111112" strokeWidth="1.8" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#111112" strokeWidth="1.8" />
            </motion.g>
            {/* Center lug nut */}
            <circle cx="0" cy="0" r="2" fill="#111112" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
