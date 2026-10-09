"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

export function AppProviders({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
