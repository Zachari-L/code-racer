import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ResultsView } from "@/components/results/ResultsView";
import { LinkButton } from "@/components/ui/link-button";
import { auth } from "@/lib/auth";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { getRaceResultsForUser } from "@/server/profile";

interface RacePageProps {
  params: Promise<{ raceId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("meta.raceTitle") };
}

/** Full results page of a past race, opened from the history (HIST-02). */
export default async function RaceResultsPage({ params }: RacePageProps) {
  const { raceId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/races/${raceId}`);

  // Only people who raced can see it: results are not public.
  const result = await getRaceResultsForUser(raceId, session.user.id);
  if (!result) notFound();
  const t = await getTranslator();
  const date = new Intl.DateTimeFormat(await getLocale(), { dateStyle: "full", timeStyle: "short" });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black uppercase">{t("results.title")}</h1>
          <p className="text-sm font-bold">{date.format(new Date(result.data.startedAt))}</p>
        </div>
        <LinkButton href="/profile" variant="outline" size="sm">
          {t("history.back")}
        </LinkButton>
      </div>
      <ResultsView data={result.data} viewerId={result.viewerId} />
    </div>
  );
}
