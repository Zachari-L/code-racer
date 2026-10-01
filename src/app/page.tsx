import { Navbar } from "@/components/layout/Navbar";
import { JoinLobbyCard } from "@/components/lobby/JoinLobbyCard";
import { Zap, ShieldCheck, Bot, Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col overflow-hidden">
      {/* Background arcade dot pattern */}
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />

      {/* Decorative arcade shapes */}
      <div className="border-azure-blue/30 pointer-events-none absolute top-24 left-10 hidden h-16 w-16 -rotate-12 rounded-full border-4 md:block" />
      <div className="border-tangerine-orange/30 pointer-events-none absolute right-12 bottom-20 hidden h-20 w-20 rotate-12 rounded-3xl border-4 md:block" />
      <div className="bg-arcade-magenta/20 pointer-events-none absolute top-1/2 left-4 hidden h-8 w-8 rotate-45 rounded-lg lg:block" />

      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-20">
        <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2">
            <Badge variant="lime" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Saison Arcade Classroom
            </Badge>
            <Badge variant="azure">Multiplayer 2 à 100 joueurs</Badge>
          </div>

          <h1 className="text-slate-dark text-4xl leading-[1.05] font-black tracking-tight uppercase sm:text-6xl lg:text-7xl">
            Tapez plus vite. <br />
            <span className="text-azure-blue decoration-electric-lime underline decoration-wavy decoration-4">
              Gagnez la course.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base font-bold text-zinc-600 sm:text-lg">
            La compétition de frappe au clavier pour collégiens, lycéens et passionnés. Relevez le
            défi en temps réel sur des textes littéraires, des répliques cultes ou du code !
          </p>
        </div>

        {/* Lobby joining card */}
        <JoinLobbyCard />

        {/* Feature badges grid */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          <div className="border-slate-dark arcade-shadow flex flex-col items-center rounded-2xl border-3 bg-white p-4 text-center">
            <div className="bg-electric-lime/40 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
              <Zap className="text-slate-dark h-5 w-5" />
            </div>
            <span className="text-slate-dark text-xs font-black uppercase">Course Temps Réel</span>
            <span className="text-[11px] font-semibold text-zinc-500">
              Synchronisation instantanée
            </span>
          </div>

          <div className="border-slate-dark arcade-shadow flex flex-col items-center rounded-2xl border-3 bg-white p-4 text-center">
            <div className="bg-azure-blue/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
              <ShieldCheck className="text-azure-blue h-5 w-5" />
            </div>
            <span className="text-slate-dark text-xs font-black uppercase">
              Anti-Triche & Collage
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">Copier-coller bloqué</span>
          </div>

          <div className="border-slate-dark arcade-shadow flex flex-col items-center rounded-2xl border-3 bg-white p-4 text-center">
            <div className="bg-tangerine-orange/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
              <Bot className="text-tangerine-orange h-5 w-5" />
            </div>
            <span className="text-slate-dark text-xs font-black uppercase">4 Niveaux de Bots</span>
            <span className="text-[11px] font-semibold text-zinc-500">De Facile à Impossible</span>
          </div>

          <div className="border-slate-dark arcade-shadow flex flex-col items-center rounded-2xl border-3 bg-white p-4 text-center">
            <div className="bg-arcade-magenta/20 border-slate-dark mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2">
              <Trophy className="text-arcade-magenta h-5 w-5" />
            </div>
            <span className="text-slate-dark text-xs font-black uppercase">
              Statistiques & Heatmap
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">WPM, précision, erreurs</span>
          </div>
        </div>
      </main>

      <footer className="border-slate-dark w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500">
        CodeRacer © {new Date().getFullYear()} — Conçu pour les classes et les passionnés de code.
      </footer>
    </div>
  );
}
