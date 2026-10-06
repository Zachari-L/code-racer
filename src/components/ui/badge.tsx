import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-slate-dark dark:border-zinc-700 px-3 py-1 text-xs font-black uppercase tracking-wider",
  {
    variants: {
      variant: {
        lime: "bg-electric-lime text-[#111112] dark:text-[#111112]",
        azure: "bg-azure-blue text-white",
        orange: "bg-tangerine-orange text-white",
        magenta: "bg-arcade-magenta text-white",
        teal: "bg-victory-teal text-[#111112] dark:text-[#111112]",
        slate: "bg-slate-dark text-white dark:bg-zinc-800",
        outline: "bg-white text-slate-dark dark:bg-zinc-900 dark:text-zinc-100",
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
