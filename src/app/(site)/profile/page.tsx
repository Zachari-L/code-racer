import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HistoryList } from "@/components/profile/HistoryList";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { auth } from "@/lib/auth";
import { getTranslator } from "@/lib/i18n/server";
import { getHistory, getProfile } from "@/server/profile";

interface ProfilePageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("meta.profileTitle") };
}

/** The signed-in user's own profile: stats, editing and history. Guests have none (AUTH-03). */
export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await auth();
  if (!session?.user?.username) redirect("/login?callbackUrl=/profile");

  const profile = await getProfile(session.user.username);
  if (!profile) notFound();
  const requested = Number.parseInt((await searchParams).page ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;
  const history = await getHistory(profile.id, page);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <ProfileOverview profile={profile} />
      <ProfileEditor displayName={profile.displayName} hasAvatar={profile.avatarUrl !== null} />
      <HistoryList
        entries={history.entries}
        total={history.total}
        page={Math.min(page, history.pageCount)}
        pageCount={history.pageCount}
      />
    </div>
  );
}
