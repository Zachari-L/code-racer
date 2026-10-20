"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; Icon: typeof Sun }[] = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
];

/** Light / dark / system theme switch (DES-05). */
export function ThemeSelector() {
  const { t } = useLanguage();
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label={t("theme.label")}
      className="border-slate-dark flex h-9 items-center rounded-full border-2 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800"
    >
      {OPTIONS.map(({ value, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPreference(value)}
          aria-pressed={preference === value}
          title={t(`theme.${value}`)}
          aria-label={t(`theme.${value}`)}
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full",
            preference === value
              ? "bg-slate-dark text-white dark:bg-zinc-100 dark:text-[#111112]"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
