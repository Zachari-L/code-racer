import { Compass, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { JoinByCodeForm } from "@/components/rooms/JoinByCodeForm";
import { QuickRaceButton } from "@/components/rooms/QuickRaceButton";
import { getTranslator } from "@/lib/i18n/server";
import { getCurrentIdentity } from "@/server/identity";

export default async function Home() {
  const t = await getTranslator();
  const identity = await getCurrentIdentity();
  const signedIn = identity?.kind === "user";

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-16">
      <section className="space-y-5">
        <Badge variant="azure">{t("home.capacityBadge")}</Badge>
        <h1 className="text-slate-dark text-4xl leading-[1.05] font-black tracking-tight uppercase sm:text-6xl dark:text-white">
          {t("home.title1")} <br />
          <span className="text-azure-blue decoration-electric-lime underline decoration-wavy decoration-4">
            {t("home.title2")}
          </span>
        </h1>
        <p className="max-w-xl text-base font-bold text-zinc-700 sm:text-lg dark:text-zinc-300">
          {t("home.subtitle")}
        </p>
      </section>

      <Card className="space-y-5">
        <h2 className="text-2xl font-black uppercase">{t("home.playTitle")}</h2>
        <JoinByCodeForm />
        <div className="flex items-center gap-3 text-xs font-black text-zinc-600 uppercase dark:text-zinc-300">
          <span className="h-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700" />
          {t("home.or")}
          <span className="h-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <QuickRaceButton signedIn={signedIn} />
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/rooms" variant="outline" size="sm">
            <Compass className="mr-1.5 h-4 w-4" aria-hidden />
            {t("home.browseRooms")}
          </LinkButton>
          {signedIn && (
            <LinkButton href="/rooms/new" variant="outline" size="sm">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              {t("home.createRoom")}
            </LinkButton>
          )}
        </div>
      </Card>
    </div>
  );
}
