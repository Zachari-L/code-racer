"use client";

import { Navbar } from "@/components/layout/Navbar";
import { JoinLobbyCard } from "@/components/lobby/JoinLobbyCard";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      {/* Background dot pattern & ambient dynamic background */}
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />

      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-16">
        <ScrollReveal direction="down" className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2">
            <Badge variant="lime" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.seasonBadge")}
            </Badge>
            <Badge variant="azure">{t("home.capacityBadge")}</Badge>
          </div>

          <h1 className="text-slate-dark text-4xl leading-[1.05] font-black tracking-tight uppercase sm:text-6xl lg:text-7xl dark:text-white">
            {t("home.title1")} <br />
            <span className="text-azure-blue decoration-electric-lime underline decoration-wavy decoration-4">
              {t("home.title2")}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base font-bold text-zinc-600 sm:text-lg dark:text-zinc-400">
            {t("home.subtitle")}
          </p>
        </ScrollReveal>

        {/* Lobby joining card */}
        <div className="my-6 flex w-full max-w-lg flex-col items-center justify-center">
          <ScrollReveal direction="up" delay={0.1} className="flex w-full justify-center">
            <JoinLobbyCard />
          </ScrollReveal>
        </div>
      </main>

      <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {t("footer.text", { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
