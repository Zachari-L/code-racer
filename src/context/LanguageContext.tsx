"use client";

import * as React from "react";
import { translations, type Language, type TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

function getLangSnapshot(): Language {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem("coderacer_lang") as Language | null;
  return saved === "en" ? "en" : "fr";
}

function getServerSnapshot(): Language {
  return "fr";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = React.useSyncExternalStore(subscribe, getLangSnapshot, getServerSnapshot);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = React.useCallback((newLang: Language) => {
    localStorage.setItem("coderacer_lang", newLang);
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event("storage"));
  }, []);

  const toggleLanguage = React.useCallback(() => {
    setLanguage(language === "fr" ? "en" : "fr");
  }, [language, setLanguage]);

  const t = React.useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = translations[language] || translations.fr;
      let val: string = dict[key] || translations.fr[key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          val = val.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }

      return val;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
