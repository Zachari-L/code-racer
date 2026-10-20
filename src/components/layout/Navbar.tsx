"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Users, User, LogIn, LogOut, Plus } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { TireIcon } from "@/components/animated/TireIcon";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

export function Navbar() {
  const { data: session } = useSession();
  const { t } = useLanguage();

  return (
    <header className="border-slate-dark sticky top-0 z-40 w-full border-b-3 bg-white/90 backdrop-blur-md transition-colors duration-150 dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:h-20 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" aria-label="CodeRacer" className="group flex shrink-0 items-center gap-3">
          <div className="bg-electric-lime border-slate-dark arcade-shadow flex h-10 w-10 items-center justify-center rounded-2xl border-3 transition-transform duration-200 group-hover:rotate-12 sm:h-12 sm:w-12 dark:border-zinc-700">
            <TireIcon size={32} spinOnHover />
          </div>
          {/* The wordmark needs room: phones show the logo alone (DES-06). */}
          <div className="hidden flex-col lg:flex">
            <span className="text-slate-dark text-2xl font-black tracking-wider uppercase dark:text-white">
              Code<span className="text-azure-blue">Racer</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-zinc-600 uppercase dark:text-zinc-300">
              {t("nav.subtitle")}
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Main Page Links */}
          <nav aria-label={t("nav.main")} className="flex items-center gap-1.5 sm:gap-2">
            <LinkButton href="/rooms" variant="outline" size="sm" className="gap-1.5 sm:gap-2">
              <Users className="text-azure-blue h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t("nav.lobbies")}</span>
            </LinkButton>
            {session?.user && (
              <LinkButton
                href="/rooms/new"
                variant="outline"
                size="sm"
                className="gap-1.5 sm:gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">{t("nav.create")}</span>
              </LinkButton>
            )}
          </nav>

          <div className="mx-1 hidden h-6 w-[2px] bg-zinc-200 sm:block dark:bg-zinc-700" />

          {/* User Session Auth Button */}
          {session?.user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/profile"
                aria-label={t("nav.profile")}
                className="border-slate-dark arcade-shadow flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-2.5 text-xs font-black hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <User className="text-azure-blue h-4 w-4" aria-hidden />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {session.user.name ?? session.user.username}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                title={t("nav.signOut")}
                aria-label={t("nav.signOut")}
                className="border-slate-dark arcade-shadow hover:text-arcade-magenta flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 bg-white text-zinc-600 transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <LinkButton
              href="/login"
              variant="lime"
              size="sm"
              className="gap-1.5 text-xs font-black"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only sm:not-sr-only">{t("nav.signIn")}</span>
            </LinkButton>
          )}

          <div className="mx-0.5 hidden h-6 w-[2px] bg-zinc-200 sm:block dark:bg-zinc-700" />

          <LanguageToggle className="px-2.5" />

          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
