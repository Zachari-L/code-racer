import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-slate-dark px-3 py-1 text-xs font-black uppercase tracking-wider",
  {
    variants: {
      variant: {
        lime: "bg-electric-lime text-slate-dark",
        azure: "bg-azure-blue text-white",
        orange: "bg-tangerine-orange text-white",
        magenta: "bg-arcade-magenta text-white",
        teal: "bg-victory-teal text-slate-dark",
        slate: "bg-slate-dark text-white",
        outline: "bg-white text-slate-dark",
      },
    },
    defaultVariants: {
      variant: "lime",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
