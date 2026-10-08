import { Navbar } from "@/components/layout/Navbar";
import { ProfileView } from "@/components/profile/ProfileView";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";
import { getUserProfile } from "@/server/actions/profile";

export const dynamic = "force-dynamic";

export default async function ProfileDefaultPage() {
  const profileResult = await getUserProfile();

  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col justify-start">
        <ProfileView initialProfileResult={profileResult} />
      </main>

      <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        CodeRacer © {new Date().getFullYear()} — CodeRacer Driver Profile.
      </footer>
    </div>
  );
}
