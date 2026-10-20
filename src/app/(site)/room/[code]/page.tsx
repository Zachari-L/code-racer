import type { Metadata } from "next";
import { GuestNicknameForm } from "@/components/room/GuestNicknameForm";
import { RoomClient } from "@/components/room/RoomClient";
import { getTranslator } from "@/lib/i18n/server";
import { normalizeRoomCode } from "@/lib/room-code";
import { getCurrentIdentity } from "@/server/identity";

interface RoomPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ invite?: string | string[] }>;
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("meta.roomTitle", { code: normalizeRoomCode((await params).code) }) };
}

/**
 * The page never looks the room up itself: existence is only revealed through
 * the rate-limited realtime join (SALLE-10).
 */
export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const code = normalizeRoomCode((await params).code);
  const { invite } = await searchParams;
  const identity = await getCurrentIdentity();
  const inviteToken = typeof invite === "string" ? invite : null;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      {identity ? (
        <RoomClient code={code} invite={inviteToken} />
      ) : (
        <GuestNicknameForm
          callbackUrl={`/room/${code}${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ""}`}
        />
      )}
    </div>
  );
}
