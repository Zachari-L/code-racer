"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-extrabold tracking-wide uppercase transition-colors cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        lime: "bg-electric-lime text-slate-dark border-3 border-slate-dark arcade-shadow hover:brightness-105 active:shadow-none",
        azure:
          "bg-azure-blue text-white border-3 border-slate-dark arcade-shadow hover:brightness-110 active:shadow-none",
        orange:
          "bg-tangerine-orange text-white border-3 border-slate-dark arcade-shadow hover:brightness-110 active:shadow-none",
        magenta:
          "bg-arcade-magenta text-white border-3 border-slate-dark arcade-shadow hover:brightness-110 active:shadow-none",
        teal: "bg-victory-teal text-slate-dark border-3 border-slate-dark arcade-shadow hover:brightness-105 active:shadow-none",
        outline:
          "bg-white text-slate-dark border-3 border-slate-dark arcade-shadow hover:bg-zinc-100 active:shadow-none",
        ghost: "bg-transparent text-slate-dark hover:bg-black/5 border-3 border-transparent",
      },
      size: {
        sm: "h-9 px-4 text-xs rounded-full",
        md: "h-12 px-6 text-sm rounded-full",
        lg: "h-14 px-8 text-base rounded-full",
        xl: "h-16 px-10 text-lg rounded-full",
      },
      pulse: {
        true: "arcade-pulse-cta",
        false: "",
      },
    },
    defaultVariants: {
      variant: "lime",
      size: "md",
      pulse: false,
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">, VariantProps<typeof buttonVariants> {
  animatePress?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pulse, animatePress = true, children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, pulse: pulse ?? variant === "lime", className })
        )}
        ref={ref}
        whileHover={animatePress ? { y: -3, scale: 1.02 } : undefined}
        whileTap={animatePress ? { y: 2, scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 450, damping: 17 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
