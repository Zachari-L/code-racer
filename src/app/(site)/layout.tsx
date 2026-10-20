import { ArcadeBackdrop } from "@/components/layout/ArcadeBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getTranslator } from "@/lib/i18n/server";

/** Shell shared by every page. */
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslator();
  return (
    <div className="relative flex min-h-screen flex-col">
      <a
        href="#main"
        className="bg-electric-lime sr-only z-50 rounded-full px-4 py-2 font-black text-[#111112] focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {t("nav.skipToContent")}
      </a>
      <ArcadeBackdrop />
      <Navbar />
      <main id="main" tabIndex={-1} className="relative z-10 flex flex-1 flex-col outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
