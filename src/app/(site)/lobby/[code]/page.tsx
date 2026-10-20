import { LobbyArena } from "@/components/lobby/LobbyArena";
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
    <LobbyArena
      initialCode={code}
      initialIsHost={race ? isHost : undefined}
      initialTextLanguage={race?.textLanguage}
    />
  );
}
