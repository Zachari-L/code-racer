import { redirect } from "next/navigation";
import { RaceArena } from "@/components/race/RaceArena";
import { ArcadeBackdrop } from "@/components/layout/ArcadeBackdrop";
import { getRaceByCode } from "@/server/actions/race";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function RaceCodePage({ params }: PageProps) {
  const { code } = await params;
  const race = await getRaceByCode(code);
  const session = await auth();

  // If the race does not exist in the database, redirect to lobby
  if (!race) {
    redirect("/lobby");
  }

  const isHost = Boolean(session?.user?.id && race.hostId === session.user.id);

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden p-2 sm:p-4">
      <ArcadeBackdrop />

      <main className="relative z-10 flex h-full w-full max-w-5xl flex-col items-center justify-center">
        <RaceArena
          initialCode={code}
          initialText={race.text}
          initialIsHost={isHost}
          initialStatus={race.status}
        />
      </main>
    </div>
  );
}
