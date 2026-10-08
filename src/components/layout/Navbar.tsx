"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Users, User, Sun, Moon, Globe, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TireIcon } from "@/components/animated/TireIcon";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="border-slate-dark sticky top-0 z-40 w-full border-b-3 bg-white/90 backdrop-blur-md transition-colors duration-150 dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="bg-electric-lime border-slate-dark arcade-shadow flex h-12 w-12 items-center justify-center rounded-2xl border-3 transition-transform duration-200 group-hover:rotate-12 dark:border-zinc-700">
            <TireIcon size={32} spinOnHover />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-dark text-2xl font-black tracking-wider uppercase dark:text-white">
              Code<span className="text-azure-blue">Racer</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
              {t("nav.subtitle")}
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Page Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/lobby">
              <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2">
                <Users className="text-azure-blue h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.lobbies")}</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.profile")}</span>
              </Button>
            </Link>
          </nav>

          <div className="mx-1 h-6 w-[2px] bg-zinc-200 dark:bg-zinc-700" />

          {/* User Session Auth Button */}
          {session?.user ? (
            <div className="flex items-center gap-1.5">
              <Link href="/profile">
                <div className="border-slate-dark arcade-shadow flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-2.5 text-xs font-black transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <div className="bg-azure-blue flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-[80px] truncate sm:max-w-[120px]">
                    {session.user.name ?? session.user.username}
                  </span>
                </div>
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
            <Link href="/login">
              <Button variant="lime" size="sm" className="gap-1.5 text-xs font-black">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("nav.signIn")}</span>
              </Button>
            </Link>
          )}

          <div className="mx-0.5 hidden h-6 w-[2px] bg-zinc-200 sm:block dark:bg-zinc-700" />

          {/* Language Toggle Button (FR / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === "fr" ? "Passer en anglais" : "Switch to French"}
            className="border-slate-dark arcade-shadow flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-2 bg-white px-2.5 py-1 text-xs font-black transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Globe className="text-azure-blue h-3.5 w-3.5" />
            <span
              className={
                language === "fr"
                  ? "text-azure-blue font-black"
                  : "font-semibold text-zinc-400 dark:text-zinc-500"
              }
            >
              FR
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span
              className={
                language === "en"
                  ? "text-azure-blue font-black"
                  : "font-semibold text-zinc-400 dark:text-zinc-500"
              }
            >
              EN
            </span>
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "light" ? t("nav.themeDark") : t("nav.themeLight")}
            aria-label={theme === "light" ? "Activer le thème sombre" : "Activer le thème clair"}
            className="border-slate-dark arcade-shadow flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 bg-white transition-all hover:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {theme === "light" ? (
              <Moon className="text-slate-dark h-4 w-4" />
            ) : (
              <Sun className="text-electric-lime fill-electric-lime/30 h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
