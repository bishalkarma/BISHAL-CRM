"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { DataProvider } from "@/components/providers/data-provider";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

type AccentThemeContextValue = {
  accent: ThemeId;
  setAccent: (theme: ThemeId) => void;
};

const AccentThemeContext = React.createContext<AccentThemeContextValue>({
  accent: DEFAULT_THEME,
  setAccent: () => {},
});

export function useAccentTheme() {
  return React.useContext(AccentThemeContext);
}

/**
 * Wraps next-themes (light/dark) and layers our accent palette on top by
 * writing `data-theme` on <html>. Persisted to localStorage so the choice
 * survives reloads; a blocking script in `layout.tsx` applies it before
 * paint to avoid any flash.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<ThemeId>(DEFAULT_THEME);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) setAccentState(stored);
  }, []);

  const setAccent = React.useCallback((next: ThemeId) => {
    setAccentState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", accent);
  }, [accent]);

  const value = React.useMemo(
    () => ({ accent, setAccent }),
    [accent, setAccent],
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AccentThemeContext.Provider value={value}>
        <CurrencyProvider>
          <DataProvider>{children}</DataProvider>
        </CurrencyProvider>
      </AccentThemeContext.Provider>
    </NextThemesProvider>
  );
}
