import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/context/AppProviders";
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

export const metadata: Metadata = {
  title: "CodeRacer — La Course de Dactylographie Multijoueur",
  description:
    "Application web d'entraînement à la frappe au clavier associant entraînement individuel et courses multijoueur en temps réel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-slate-dark selection:bg-electric-lime selection:text-slate-dark flex min-h-full flex-col font-sans transition-colors duration-150 dark:bg-[#111112] dark:text-zinc-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
