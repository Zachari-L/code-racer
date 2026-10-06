import { Navbar } from "@/components/layout/Navbar";
import { ProfileView } from "@/components/profile/ProfileView";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";

export default function ProfileDefaultPage() {
  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col justify-start">
        <ProfileView />
      </main>

      <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500">
        CodeRacer © {new Date().getFullYear()} — Profil et Statistiques du Pilote.
      </footer>
    </div>
  );
}
