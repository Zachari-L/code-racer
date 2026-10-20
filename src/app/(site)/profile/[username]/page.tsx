import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { getTranslator } from "@/lib/i18n/server";
import { getProfile } from "@/server/profile";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const t = await getTranslator();
  const profile = await getProfile(decodeURIComponent((await params).username));
  return {
    title: profile
      ? t("meta.publicProfileTitle", { name: profile.displayName })
      : t("meta.profileTitle"),
  };
}

/** Another driver's public profile: pseudonym, statistics and badges only. */
export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const profile = await getProfile(decodeURIComponent((await params).username));
  if (!profile) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <ProfileOverview profile={profile} />
    </div>
  );
}
