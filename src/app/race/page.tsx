import { RaceArena } from "@/components/race/RaceArena";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";

export default function RaceDefaultPage() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden p-2 transition-colors duration-150 sm:p-4 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />

      <main className="relative z-10 flex h-full w-full max-w-5xl flex-col items-center justify-center">
        <RaceArena />
      </main>
    </div>
  );
}
