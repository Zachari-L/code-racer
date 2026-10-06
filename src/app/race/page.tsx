import { Navbar } from "@/components/layout/Navbar";
import { RaceArena } from "@/components/race/RaceArena";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";

export default function RaceDefaultPage() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col justify-start">
        <RaceArena />
      </main>

      <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500">
        CodeRacer © {new Date().getFullYear()} — Arène de Course en Direct.
      </footer>
    </div>
  );
}
