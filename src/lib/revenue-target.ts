/**
 * The monthly revenue target.
 *
 * This is the only number in the app that is not derived from a company,
 * deal, contact or activity — you decide it, so it has to be stored.
 *
 * Kept in the browser for now, alongside currency and theme. A per-user,
 * per-month target is the real destination, but that needs accounts, roles
 * and row-level security first; a target cannot belong to a user who does
 * not exist yet. When login lands, only the source of this number changes —
 * every chart reading it stays exactly as it is.
 */

const KEY = "bishal-crm:monthly-revenue-target";

/** A visible starting point, so the chart never renders a flat zero line. */
export const DEFAULT_MONTHLY_TARGET = 500_000;

export function readMonthlyTarget(): number {
  if (typeof window === "undefined") return DEFAULT_MONTHLY_TARGET;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_MONTHLY_TARGET;
    const value = Number(raw);
    // A corrupt or negative value should not poison the chart.
    return Number.isFinite(value) && value >= 0
      ? value
      : DEFAULT_MONTHLY_TARGET;
  } catch {
    return DEFAULT_MONTHLY_TARGET;
  }
}

export function writeMonthlyTarget(value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(Math.max(Math.round(value), 0)));
  } catch {
    // Private browsing can refuse writes; the chart still works in memory.
  }
}
