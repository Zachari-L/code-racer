import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { getCurrentIdentity } from "@/server/identity";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("meta.createTitle") };
}

export default async function NewRoomPage() {
  const identity = await getCurrentIdentity();
  // Guests cannot create rooms (AUTH-03).
  if (identity?.kind !== "user") redirect("/login?callbackUrl=/rooms/new");
  const t = await getTranslator();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-black uppercase">{t("create.title")}</h1>
      {/* The race language defaults to the interface language (it stays independent). */}
      <CreateRoomForm defaultLanguage={await getLocale()} />
    </div>
  );
}
