import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProfileView } from "@/components/profile/ProfileView";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";
import { getUserProfile } from "@/server/actions/profile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfileUsernamePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const profileResult = await getUserProfile(decodedUsername);

  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col justify-start">
        <ProfileView initialUsername={decodedUsername} initialProfileResult={profileResult} />
      </main>

      <SiteFooter />
    </div>
  );
}
