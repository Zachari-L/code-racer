import { ArcadeBackdrop } from "@/components/layout/ArcadeBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";

/** Shell shared by every page except the fullscreen race arena. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ArcadeBackdrop />
      <Navbar />
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}
