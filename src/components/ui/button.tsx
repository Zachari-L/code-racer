import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-extrabold tracking-wide uppercase transition-all duration-150 cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-0.5",
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
    },
    defaultVariants: {
      variant: "lime",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
