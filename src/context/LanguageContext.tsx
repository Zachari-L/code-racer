"use client";

import * as React from "react";
import { createTranslator, type Locale, type Translator } from "@/lib/i18n";
import { setLocale } from "@/server/actions/locale";

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  toggleLanguage: () => void;
  t: Translator;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

/**
 * `locale` comes from the server (cookie / Accept-Language), so the first render
 * already matches the visitor's language. Switching sets the cookie through a
 * Server Action, which re-renders server components in the new locale.
 */
export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [language, setOptimisticLanguage] = React.useOptimistic(locale);
  const [, startTransition] = React.useTransition();

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = React.useCallback(
    (newLang: Locale) => {
      startTransition(async () => {
        setOptimisticLanguage(newLang);
        await setLocale(newLang);
      });
    },
    [setOptimisticLanguage]
  );

  const toggleLanguage = React.useCallback(() => {
    setLanguage(language === "fr" ? "en" : "fr");
  }, [language, setLanguage]);

  const t = React.useMemo(() => createTranslator(language), [language]);

  const value = React.useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
