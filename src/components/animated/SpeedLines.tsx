"use client";

import * as React from "react";

export function SpeedLines() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg
        className="absolute h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          <linearGradient id="azure-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007BFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="orange-grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D9008D" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="lime-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d2ff00" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#007BFF" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Dynamic curving racing lines */}
        <path
          d="M -100 150 C 300 80, 700 280, 1100 120 C 1300 40, 1500 180, 1600 220"
          fill="none"
          stroke="url(#azure-grad)"
          strokeWidth="3.5"
          className="animate-speed-dash"
        />

        <path
          d="M -100 180 C 300 110, 700 310, 1100 150 C 1300 70, 1500 210, 1600 250"
          fill="none"
          stroke="#111112"
          strokeWidth="1.5"
          strokeOpacity="0.2"
        />

        <path
          d="M -150 750 C 250 820, 650 620, 1050 780 C 1250 860, 1450 720, 1650 680"
          fill="none"
          stroke="url(#orange-grad)"
          strokeWidth="3.5"
          className="animate-speed-dash-fast"
        />

        <path
          d="M -50 450 C 400 350, 800 550, 1200 400 C 1350 350, 1500 480, 1600 460"
          fill="none"
          stroke="url(#lime-grad)"
          strokeWidth="4"
          className="animate-speed-dash"
        />
      </svg>
    </div>
  );
}
