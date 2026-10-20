import { cva } from "class-variance-authority";

/** Shared by `Button` and `LinkButton`. Kept out of the client module so server components can use it. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center font-extrabold tracking-wide uppercase transition-colors cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        lime: "bg-electric-lime text-[#111112] dark:text-[#111112] border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:brightness-105 active:shadow-none",
        azure:
          "bg-azure-blue text-white border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:brightness-110 active:shadow-none",
        orange:
          "bg-tangerine-orange text-white border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:brightness-110 active:shadow-none",
        magenta:
          "bg-arcade-magenta text-white border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:brightness-110 active:shadow-none",
        teal: "bg-victory-teal text-[#111112] dark:text-[#111112] border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:brightness-105 active:shadow-none",
        outline:
          "bg-white dark:bg-zinc-900 text-slate-dark dark:text-zinc-100 border-3 border-slate-dark dark:border-zinc-700 arcade-shadow hover:bg-zinc-100 dark:hover:bg-zinc-800 active:shadow-none",
        ghost:
          "bg-transparent text-slate-dark dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 border-3 border-transparent",
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
