"use client";

import * as React from "react";
import {
  BASE_CURRENCY,
  CURRENCY_STORAGE_KEY,
  DEFAULT_ENABLED_CURRENCIES,
  ENABLED_CURRENCIES_STORAGE_KEY,
  convert,
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency";

type CurrencyContextValue = {
  /** Currency all pipeline totals are displayed in. */
  display: CurrencyCode;
  setDisplay: (code: CurrencyCode) => void;
  /** Currencies the workspace has switched on. */
  enabled: CurrencyCode[];
  setEnabled: (codes: CurrencyCode[]) => void;
  toggleEnabled: (code: CurrencyCode) => void;
  /** Convert an amount from `from` into the display currency. */
  toDisplay: (amount: number, from: CurrencyCode) => number;
  /** Format an amount that is already in the display currency. */
  format: (amount: number, opts?: { compact?: boolean }) => string;
};

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [display, setDisplayState] = React.useState<CurrencyCode>(BASE_CURRENCY);
  const [enabled, setEnabledState] = React.useState<CurrencyCode[]>(
    DEFAULT_ENABLED_CURRENCIES,
  );

  React.useEffect(() => {
    const storedDisplay = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrencyCode(storedDisplay)) setDisplayState(storedDisplay);

    const storedEnabled = window.localStorage.getItem(
      ENABLED_CURRENCIES_STORAGE_KEY,
    );
    if (storedEnabled) {
      try {
        const parsed: unknown = JSON.parse(storedEnabled);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isCurrencyCode);
          if (valid.length) setEnabledState(valid);
        }
      } catch {
        /* ignore malformed storage */
      }
    }
  }, []);

  const setDisplay = React.useCallback((code: CurrencyCode) => {
    setDisplayState(code);
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  }, []);

  const setEnabled = React.useCallback(
    (codes: CurrencyCode[]) => {
      // The base currency can never be switched off.
      const next = Array.from(new Set<CurrencyCode>([BASE_CURRENCY, ...codes]));
      setEnabledState(next);
      window.localStorage.setItem(
        ENABLED_CURRENCIES_STORAGE_KEY,
        JSON.stringify(next),
      );
      setDisplayState((current) => {
        if (next.includes(current)) return current;
        window.localStorage.setItem(CURRENCY_STORAGE_KEY, BASE_CURRENCY);
        return BASE_CURRENCY;
      });
    },
    [],
  );

  const toggleEnabled = React.useCallback(
    (code: CurrencyCode) => {
      if (code === BASE_CURRENCY) return;
      setEnabled(
        enabled.includes(code)
          ? enabled.filter((c) => c !== code)
          : [...enabled, code],
      );
    },
    [enabled, setEnabled],
  );

  const value = React.useMemo<CurrencyContextValue>(
    () => ({
      display,
      setDisplay,
      enabled,
      setEnabled,
      toggleEnabled,
      toDisplay: (amount, from) => convert(amount, from, display),
      format: (amount, opts) =>
        formatMoney(amount, display, { compact: opts?.compact }),
    }),
    [display, enabled, setDisplay, setEnabled, toggleEnabled],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
