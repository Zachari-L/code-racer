"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

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
