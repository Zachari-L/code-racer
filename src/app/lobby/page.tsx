import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LobbyHub } from "@/components/lobby/LobbyHub";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";

export default function LobbyDefaultPage() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center py-8">
        <LobbyHub />
      </main>

      <SiteFooter />
    </div>
  );
}
