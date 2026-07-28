/**
 * Dashboard figures, derived from live records.
 *
 * Everything here reads companies, deals and activities directly — the old
 * dashboard mixed real numbers with a hardcoded demo file, so half the page
 * described a business that did not exist.
 *
 * Deal values are converted to one display currency before being summed.
 * Adding AED to EUR without converting produces a number that is wrong in a
 * way nobody notices.
 */

import type { Company } from "./companies";
import type { Deal } from "./deals";
import type { CurrencyCode } from "./currency";
import { isOpenTask, taskCounts, type Activity } from "./activities";

/* ------------------------------------------------------------------ */
/* Period                                                              */
/* ------------------------------------------------------------------ */

export type DashboardPeriod = "week" | "month" | "quarter" | "year" | "all";

export const DASHBOARD_PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
  { id: "all", label: "All" },
];

/** Start of the window, or null for "all time". */
export function periodStart(
  period: DashboardPeriod,
  now = Date.now(),
): number | null {
  if (period === "all") return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  switch (period) {
    case "week":
      d.setDate(d.getDate() - 7);
      break;
    case "month":
      d.setMonth(d.getMonth() - 1);
      break;
    case "quarter":
      d.setMonth(d.getMonth() - 3);
      break;
    case "year":
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return d.getTime();
}

/**
 * A deal counts toward a period by when it was created.
 *
 * Closed date was the alternative, but that would drop every open deal from
 * the totals — and open work is most of the pipeline.
 */
export function dealsInPeriod(
  deals: Deal[],
  period: DashboardPeriod,
  now = Date.now(),
) {
  const from = periodStart(period, now);
  if (from === null) return deals;
  return deals.filter((d) => new Date(d.createdAt).getTime() >= from);
}

export function companiesInPeriod(
  companies: Company[],
  period: DashboardPeriod,
  now = Date.now(),
) {
  const from = periodStart(period, now);
  if (from === null) return companies;
  return companies.filter((c) => new Date(c.createdAt).getTime() >= from);
}

/* ------------------------------------------------------------------ */
/* Headline figures                                                    */
/* ------------------------------------------------------------------ */

export type DealTotals = {
  totalDeals: number;
  totalValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  /** Of closed deals only — an open deal has not been won or lost yet. */
  winRate: number;
  lossRate: number;
};

/**
 * `convert` maps a deal's own currency into the display currency, so mixed
 * pipelines still add up.
 */
export function dealTotals(
  deals: Deal[],
  convert: (amount: number, from: CurrencyCode) => number,
): DealTotals {
  let totalValue = 0;
  let wonCount = 0;
  let wonValue = 0;
  let lostCount = 0;
  let lostValue = 0;

  for (const deal of deals) {
    const value = convert(deal.value, deal.currency);
    totalValue += value;
    if (deal.stage === "won") {
      wonCount += 1;
      wonValue += value;
    } else if (deal.stage === "lost") {
      lostCount += 1;
      lostValue += value;
    }
  }

  const closed = wonCount + lostCount;
  // Zero closed deals is 0% won and 0% lost, not 0% and 100%.
  const winRate = closed === 0 ? 0 : Math.round((wonCount / closed) * 100);

  return {
    totalDeals: deals.length,
    totalValue,
    wonCount,
    wonValue,
    lostCount,
    lostValue,
    winRate,
    // Derived, so the two can never disagree.
    lossRate: closed === 0 ? 0 : 100 - winRate,
  };
}

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

export type TodaySummary = {
  overdue: number;
  dueToday: number;
  /** Entries booked for a future date — a meeting, not a task. */
  scheduled: number;
  /** Overdue first, then due today. */
  tasks: Activity[];
};

export function todaySummary(
  activities: Activity[],
  now = Date.now(),
): TodaySummary {
  const counts = taskCounts(activities, now);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = startOfToday.getTime() + 86_400_000;

  const scheduled = activities.filter((a) => {
    const at = new Date(a.occurredAt).getTime();
    return at > now && at < endOfToday + 7 * 86_400_000;
  }).length;

  const tasks = activities
    .filter((a) => {
      if (!isOpenTask(a) || !a.taskDueAt) return false;
      return new Date(a.taskDueAt).getTime() < endOfToday;
    })
    .sort(
      (a, b) =>
        new Date(a.taskDueAt as string).getTime() -
        new Date(b.taskDueAt as string).getTime(),
    );

  return {
    overdue: counts.overdue,
    dueToday: counts.today,
    scheduled,
    tasks,
  };
}

/* ------------------------------------------------------------------ */
/* Distributions                                                       */
/* ------------------------------------------------------------------ */

export type Slice = { key: string; label: string; value: number; share: number };

function toSlices(counts: Map<string, number>): Slice[] {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()]
    .map(([key, value]) => ({
      key,
      label: key,
      value,
      share: total === 0 ? 0 : Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/** How the team actually spends its time — by activity channel. */
export function activityMix(activities: Activity[], now = Date.now()): Slice[] {
  const counts = new Map<string, number>();
  for (const a of activities) {
    // Future-dated entries have not happened, so they are not "time spent".
    if (new Date(a.occurredAt).getTime() > now) continue;
    counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
  }
  return toSlices(counts);
}

/** Revenue split by what kind of venue it came from. */
export function revenueBySegment(
  deals: Deal[],
  companies: Company[],
  convert: (amount: number, from: CurrencyCode) => number,
): Slice[] {
  const business = new Map(companies.map((c) => [c.id, c.business]));
  const totals = new Map<string, number>();
  for (const deal of deals) {
    if (deal.stage !== "won") continue;
    const segment = business.get(deal.companyId) ?? "Other";
    totals.set(
      segment,
      (totals.get(segment) ?? 0) + convert(deal.value, deal.currency),
    );
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([key, value]) => ({
      key,
      label: key,
      value,
      share: total === 0 ? 0 : Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

/** Customers by star rating or condition — 5★, New, Old, Renovation. */
export function customersByType(companies: Company[]): Slice[] {
  const counts = new Map<string, number>();
  for (const c of companies) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
  return toSlices(counts);
}

/* ------------------------------------------------------------------ */
/* Revenue trend                                                       */
/* ------------------------------------------------------------------ */

export type RevenuePoint = { month: string; revenue: number; target: number };

/**
 * Monthly won revenue for the last `months` months.
 *
 * A deal is credited to the month its final period closed, which is when it
 * was actually won — not when it was created.
 */
export function revenueTrend(
  deals: Deal[],
  convert: (amount: number, from: CurrencyCode) => number,
  monthlyTarget: number,
  months = 8,
  now = Date.now(),
): RevenuePoint[] {
  const buckets: RevenuePoint[] = [];
  const cursor = new Date(now);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(cursor);
    start.setMonth(start.getMonth() - i);
    buckets.push({
      month: start.toLocaleDateString("en-GB", { month: "short" }),
      revenue: 0,
      target: monthlyTarget,
    });
  }

  const firstStart = new Date(cursor);
  firstStart.setMonth(firstStart.getMonth() - (months - 1));

  for (const deal of deals) {
    if (deal.stage !== "won") continue;
    const last = deal.periods[deal.periods.length - 1];
    const closed = last?.closedAt ?? deal.lastActivityAt;
    if (!closed) continue;
    const at = new Date(closed);
    if (at.getTime() < firstStart.getTime()) continue;
    const index =
      (at.getFullYear() - firstStart.getFullYear()) * 12 +
      (at.getMonth() - firstStart.getMonth());
    if (index < 0 || index >= buckets.length) continue;
    buckets[index].revenue += convert(deal.value, deal.currency);
  }

  return buckets;
}
