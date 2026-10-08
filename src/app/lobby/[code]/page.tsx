import { Navbar } from "@/components/layout/Navbar";
import { LobbyArena } from "@/components/lobby/LobbyArena";
import { ArcadeBackground } from "@/components/animated/ArcadeBackground";
import { getRaceByCode } from "@/server/actions/race";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function LobbyCodePage({ params }: PageProps) {
  const { code } = await params;
  const race = await getRaceByCode(code);
  const session = await auth();

  const isHost = Boolean(session?.user?.id && race?.hostId === session.user.id);

  return (
    <div className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark relative flex min-h-screen flex-col transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
      <div className="arcade-bg-pattern pointer-events-none absolute inset-0" />
      <ArcadeBackground />
      <Navbar />

      <main className="relative z-10 flex flex-1 flex-col justify-start">
        <LobbyArena initialCode={code} initialIsHost={race ? isHost : undefined} />
      </main>

      <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        CodeRacer © {new Date().getFullYear()} — CodeRacer Arena #{code}.
      </footer>
    </div>
  );
}
