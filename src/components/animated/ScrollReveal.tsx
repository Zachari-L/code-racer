"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "pop";
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
  ...props
}: ScrollRevealProps) {
  const directionVariants = {
    up: { hidden: { opacity: 0, y: 35 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -35 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: 35 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -35 }, visible: { opacity: 1, x: 0 } },
    pop: { hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1 } },
  };

  const selected = directionVariants[direction];

  return (
    <motion.div
      initial={selected.hidden}
      whileInView={selected.visible}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // Bouncy arcade cubic-bezier
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
