import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/context/AppProviders";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the saved or system theme before the first paint (DES-05). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark flex min-h-full flex-col font-sans transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
