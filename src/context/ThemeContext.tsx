"use client";

import * as React from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type ThemePreference = "light" | "dark" | "system";
export type Theme = "light" | "dark";

interface ThemeContextType {
  preference: ThemePreference;
  theme: Theme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function subscribe(callback: () => void) {
  const query = darkQuery();
  window.addEventListener("storage", callback);
  query.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    query.removeEventListener("change", callback);
  };
}

/** Snapshot as a string so useSyncExternalStore can compare it. */
function getSnapshot(): string {
  return `${readPreference()}:${darkQuery().matches ? "dark" : "light"}`;
}

function getServerSnapshot(): string {
  return "system:light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, systemTheme] = snapshot.split(":") as [ThemePreference, Theme];
  const theme: Theme = preference === "system" ? systemTheme : preference;

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setPreference = React.useCallback((next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice only lasts for this page.
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  const value = React.useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
