/**
 * Stored counters that have to be refreshed after an edit.
 *
 * Almost everything in the CRM is worked out fresh on each render — deal
 * value, the dashboard totals, the SPANCOP stage. Three numbers are the
 * exception: they live on the company row because reading them is far more
 * common than changing them.
 *
 * That makes them the one thing an edit can leave stale. It already happened
 * once: `activityCount` was bumped in memory but never written, so it reloaded
 * as zero and a customer with four logged activities kept showing no stage
 * suggestion. Editing gives the same trap three more chances to bite, so every
 * save routes through here.
 */

import type { Activity } from "./activities";
import type { Company } from "./companies";
import type { Deal } from "./deals";
import type { CurrencyCode } from "./currency";

export type CompanyCounters = {
  activityCount: number;
  lastActivityAt: string | null;
  lifetimeValue: number;
};

/**
 * Recount a company's stored figures from the records themselves.
 *
 * `convert` turns a deal's own currency into the display currency; without it
 * a lifetime value would silently add AED to EUR.
 */
export function recomputeCounters(
  companyId: string,
  activities: Activity[],
  deals: Deal[],
  convert: (amount: number, from: CurrencyCode) => number = (a) => a,
  now = Date.now(),
): CompanyCounters {
  const mine = activities.filter((a) => a.companyId === companyId);

  /*
    Future-dated entries are bookings, not history. Counting them would let a
    meeting scheduled for next week push a customer into Approach today —
    and the Activities timeline already treats them as "Upcoming".
  */
  const happened = mine.filter(
    (a) => new Date(a.occurredAt).getTime() <= now,
  );

  const newest = happened.reduce<string | null>((latest, a) => {
    if (!latest) return a.occurredAt;
    return new Date(a.occurredAt) > new Date(latest) ? a.occurredAt : latest;
  }, null);

  // Lifetime value is money actually won, so open and lost deals are excluded.
  const lifetimeValue = deals
    .filter((d) => d.companyId === companyId && d.stage === "won")
    .reduce((sum, d) => sum + convert(d.value, d.currency), 0);

  return {
    activityCount: happened.length,
    lastActivityAt: newest,
    lifetimeValue,
  };
}

/** True when any stored counter would change — lets a save skip a no-op write. */
export function countersDiffer(company: Company, next: CompanyCounters) {
  return (
    company.activityCount !== next.activityCount ||
    company.lastActivityAt !== next.lastActivityAt ||
    Math.round(company.lifetimeValue) !== Math.round(next.lifetimeValue)
  );
}
