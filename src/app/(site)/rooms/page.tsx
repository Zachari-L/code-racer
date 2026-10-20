import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { RoomExplorer } from "@/components/rooms/RoomExplorer";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentIdentity } from "@/server/identity";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("meta.roomsTitle") };
}

export default async function RoomsPage() {
  const t = await getTranslator();
  const identity = await getCurrentIdentity();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black uppercase">{t("explorer.title")}</h1>
        {identity?.kind === "user" && (
          <LinkButton href="/rooms/new" variant="lime">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {t("home.createRoom")}
          </LinkButton>
        )}
      </div>
      <RoomExplorer />
    </div>
  );
}
