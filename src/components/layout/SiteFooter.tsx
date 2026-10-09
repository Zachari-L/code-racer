import { getTranslator } from "@/lib/i18n/server";

export async function SiteFooter() {
  const t = await getTranslator();

  return (
    <footer className="border-slate-dark relative z-10 w-full border-t-3 bg-white py-6 text-center text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      {t("footer.text", { year: new Date().getFullYear() })}
    </footer>
  );
}
