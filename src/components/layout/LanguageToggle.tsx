"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t("language.switch")}
      aria-label={t("language.switch")}
      className={cn(
        "border-slate-dark arcade-shadow flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 bg-white py-1 text-xs font-black transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        className
      )}
    >
      <Globe className="text-azure-blue h-3.5 w-3.5" />
      {LOCALES.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-zinc-300 dark:text-zinc-600">/</span>}
          <span
            className={
              language === locale
                ? "text-azure-blue font-black"
                : "font-semibold text-zinc-400 dark:text-zinc-500"
            }
          >
            {locale.toUpperCase()}
          </span>
        </span>
      ))}
    </button>
  );
}
