"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TireIconProps {
  className?: string;
  size?: number;
  spinOnHover?: boolean;
  continuous?: boolean;
}

export function TireIcon({
  className,
  size = 28,
  spinOnHover = true,
  continuous = false,
}: TireIconProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover={spinOnHover ? { rotate: 180, scale: 1.1 } : undefined}
      animate={continuous ? { rotate: 360 } : undefined}
      transition={{
        rotate: continuous
          ? { repeat: Infinity, duration: 6, ease: "linear" }
          : { type: "spring", stiffness: 200, damping: 12 },
        scale: { duration: 0.15 },
      }}
      className={cn("inline-block shrink-0", className)}
    >
      {/* Outer tire tread (Dark Slate) */}
      <circle cx="50" cy="50" r="46" fill="#111112" stroke="#111112" strokeWidth="4" />

      {/* Tire tread grooves */}
      <path d="M 50 4 L 50 14" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 50 86 L 50 96" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 4 50 L 14 50" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 86 50 L 96 50" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 18 18 L 25 25" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 82 82 L 75 75" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 82 18 L 75 25" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M 18 82 L 25 75" stroke="#f4f4ed" strokeWidth="3" strokeLinecap="round" />

      {/* Rim (Electric Lime / Azure Accent) */}
      <circle cx="50" cy="50" r="30" fill="#d2ff00" stroke="#111112" strokeWidth="4" />

      {/* Inner hub */}
      <circle cx="50" cy="50" r="14" fill="#007BFF" stroke="#111112" strokeWidth="3" />

      {/* Center lug nut */}
      <circle cx="50" cy="50" r="5" fill="#111112" />
    </motion.svg>
  );
}
