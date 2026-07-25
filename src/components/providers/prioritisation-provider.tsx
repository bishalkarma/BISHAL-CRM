"use client";

import * as React from "react";

/**
 * Temporary A/B switch so the two prioritisation models can be compared
 * side by side before one is chosen:
 *
 *  "lead-status"  — manual temperature: Hot / Warm / Cold / Dormant
 *  "follow-up"    — a dated next action
 *  "both"         — show both columns together
 *
 * Once a decision is made this provider and the loser are deleted.
 */
export type PrioritisationMode = "lead-status" | "follow-up" | "both";

const STORAGE_KEY = "bishal-crm-prioritisation";

type Ctx = {
  mode: PrioritisationMode;
  setMode: (mode: PrioritisationMode) => void;
};

const PrioritisationContext = React.createContext<Ctx>({
  mode: "both",
  setMode: () => {},
});

export function usePrioritisation() {
  return React.useContext(PrioritisationContext);
}

const isMode = (v: unknown): v is PrioritisationMode =>
  v === "lead-status" || v === "follow-up" || v === "both";

export function PrioritisationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = React.useState<PrioritisationMode>("both");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isMode(stored)) setModeState(stored);
  }, []);

  const setMode = React.useCallback((next: PrioritisationMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = React.useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <PrioritisationContext.Provider value={value}>
      {children}
    </PrioritisationContext.Provider>
  );
}
