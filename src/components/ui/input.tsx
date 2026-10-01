import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: "azure" | "lime" | "orange" | "magenta" | "teal";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, accentColor = "azure", ...props }, ref) => {
    const accentBorders = {
      azure: "border-azure-blue focus:ring-4 focus:ring-azure-blue/20",
      lime: "border-electric-lime focus:ring-4 focus:ring-electric-lime/20",
      orange: "border-tangerine-orange focus:ring-4 focus:ring-tangerine-orange/20",
      magenta: "border-arcade-magenta focus:ring-4 focus:ring-arcade-magenta/20",
      teal: "border-victory-teal focus:ring-4 focus:ring-victory-teal/20",
    };

    return (
      <input
        type={type}
        className={cn(
          "text-slate-dark arcade-shadow flex h-12 w-full rounded-full border-3 bg-white px-5 py-2 text-base font-bold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          accentBorders[accentColor],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
