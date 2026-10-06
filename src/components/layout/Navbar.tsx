"use client";

import Link from "next/link";
import { Trophy, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TireIcon } from "@/components/animated/TireIcon";

export function Navbar() {
  return (
    <header className="border-slate-dark sticky top-0 z-40 w-full border-b-3 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="bg-electric-lime border-slate-dark arcade-shadow flex h-12 w-12 items-center justify-center rounded-2xl border-3 transition-transform duration-200 group-hover:rotate-12">
            <TireIcon size={32} spinOnHover />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-dark text-2xl font-black tracking-wider uppercase">
              Code<span className="text-azure-blue">Racer</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase">
              Arcade Frappe Multijoueur
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/solo">
            <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
              <Sparkles className="text-tangerine-orange h-4 w-4" />
              Entraînement Solo
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <Trophy className="text-arcade-magenta h-4 w-4" />
              Classement
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="azure" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Connexion
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
