import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
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

      <SiteFooter />
    </div>
  );
}
