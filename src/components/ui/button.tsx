import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

/** Arcade button. The hover lift and press are CSS (`.arcade-clickable`), no JS. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pulse, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size, pulse: pulse ?? variant === "lime" }),
        "arcade-clickable",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
