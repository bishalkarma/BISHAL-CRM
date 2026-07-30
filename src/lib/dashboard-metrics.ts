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
import {
  LOST_REASONS,
  ageingTone,
  amountOwed,
  daysSinceDelivery,
  isAwaitingPayment,
  lineCounts,
  lineTotal,
  type AgeingTone,
  type LostReason,
} from "./deal-model";
import { STAGE_MAP, isOpenStage } from "./pipeline";
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

/* ------------------------------------------------------------------ */
/* New tiles — Why we lose, Top products, Expected to close,           */
/* Samples awaiting feedback, Cash to collect                          */
/* ------------------------------------------------------------------ */

/**
 * A deal carries three dates and they answer different questions.
 *
 * Filtering everything by `createdAt` looked consistent but produced false
 * answers: a deal created last year and lost this week vanished from "this
 * month", so "Why we lose" could show nothing during a week we lost real
 * money. Each tile therefore filters on the date its own question implies.
 */
function withinPeriod(
  iso: string | null | undefined,
  period: DashboardPeriod,
  now = Date.now(),
) {
  const from = periodStart(period, now);
  if (from === null) return true;
  if (!iso) return false;
  return new Date(iso).getTime() >= from;
}

/** The day a deal was closed — the end of its last active period. */
export function closedAt(deal: Deal): string | null {
  const last = deal.periods[deal.periods.length - 1];
  return last?.closedAt ?? null;
}

export type LossReasonRow = {
  reason: LostReason;
  count: number;
  value: number;
  deals: Deal[];
};

/**
 * Lost deals grouped by reason, filtered by the date they were LOST.
 * Reasons with no deals are kept so the tile shows the full set of four.
 */
export function lossReasons(
  deals: Deal[],
  period: DashboardPeriod,
  convert: (amount: number, from: CurrencyCode) => number,
  now = Date.now(),
): LossReasonRow[] {
  const lost = deals.filter(
    (d) =>
      d.stage === "lost" &&
      d.lostReason &&
      withinPeriod(closedAt(d) ?? d.createdAt, period, now),
  );

  return LOST_REASONS.map((reason) => {
    const matching = lost.filter((d) => d.lostReason === reason);
    return {
      reason,
      count: matching.length,
      value: matching.reduce((sum, d) => sum + convert(d.value, d.currency), 0),
      deals: matching,
    };
  }).sort((a, b) => b.value - a.value || b.count - a.count);
}

export type ProductRow = {
  key: string;
  product: string;
  brand: string;
  quantity: number;
  value: number;
  /** Deals this product appears on — powers the drill-down. */
  deals: { deal: Deal; quantity: number; value: number }[];
};

export type CustomerProductRow = {
  key: string;
  company: string;
  dealCount: number;
  value: number;
  lines: { label: string; quantity: number; value: number }[];
};

/** Open deals only — won and lost are a different question. */
function openDealsIn(
  deals: Deal[],
  period: DashboardPeriod,
  now = Date.now(),
) {
  return deals.filter(
    (d) =>
      isOpenStage(d.stage) && withinPeriod(d.createdAt, period, now),
  );
}

/**
 * Line items across open deals, grouped by product + brand.
 *
 * Rejected lines are skipped, matching `dealValue()` — a line the customer
 * struck out is not something we are selling.
 */
export function topProducts(
  deals: Deal[],
  period: DashboardPeriod,
  convert: (amount: number, from: CurrencyCode) => number,
  now = Date.now(),
): ProductRow[] {
  const map = new Map<string, ProductRow>();

  for (const deal of openDealsIn(deals, period, now)) {
    for (const line of deal.lines) {
      if (!lineCounts(line)) continue;
      const key = `${line.product}__${line.brand}`;
      const value = convert(lineTotal(line), deal.currency);
      const row =
        map.get(key) ??
        ({
          key,
          product: line.product,
          brand: line.brand,
          quantity: 0,
          value: 0,
          deals: [],
        } satisfies ProductRow);
      row.quantity += line.quantity;
      row.value += value;

      const existing = row.deals.find((d) => d.deal.id === deal.id);
      if (existing) {
        existing.quantity += line.quantity;
        existing.value += value;
      } else {
        row.deals.push({ deal, quantity: line.quantity, value });
      }
      map.set(key, row);
    }
  }

  return [...map.values()].sort((a, b) => b.value - a.value);
}

/** The same open line items, clubbed under the customer they belong to. */
export function productsByCustomer(
  deals: Deal[],
  period: DashboardPeriod,
  convert: (amount: number, from: CurrencyCode) => number,
  now = Date.now(),
): CustomerProductRow[] {
  const map = new Map<string, CustomerProductRow>();

  for (const deal of openDealsIn(deals, period, now)) {
    const row =
      map.get(deal.companyId) ??
      ({
        key: deal.companyId,
        company: deal.company,
        dealCount: 0,
        value: 0,
        lines: [],
      } satisfies CustomerProductRow);
    row.dealCount += 1;

    for (const line of deal.lines) {
      if (!lineCounts(line)) continue;
      const value = convert(lineTotal(line), deal.currency);
      row.value += value;
      const label = `${line.product} · ${line.brand}`;
      const existing = row.lines.find((l) => l.label === label);
      if (existing) {
        existing.quantity += line.quantity;
        existing.value += value;
      } else {
        row.lines.push({ label, quantity: line.quantity, value });
      }
    }
    map.set(deal.companyId, row);
  }

  // Sorted by total value, as agreed — matching the other two views.
  return [...map.values()]
    .map((row) => ({
      ...row,
      lines: row.lines.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value);
}

export type ExpectedCloseRow = {
  deal: Deal;
  value: number;
  /** Value × probability — what a forecast should actually carry. */
  weighted: number;
};

/**
 * Open deals whose EXPECTED CLOSE date falls inside the period.
 *
 * Named "Expected to close" rather than "Closing this month": closing and
 * closed sit at opposite ends of the deal and the old name read as both.
 */
export function expectedToClose(
  deals: Deal[],
  period: DashboardPeriod,
  convert: (amount: number, from: CurrencyCode) => number,
  now = Date.now(),
): ExpectedCloseRow[] {
  const from = periodStart(period, now);

  return deals
    .filter((deal) => {
      if (!isOpenStage(deal.stage) || deal.onHold) return false;
      if (from === null) return true;
      const due = new Date(deal.expectedCloseDate).getTime();
      // A forward-looking window: anything not yet past its close date, plus
      // overdue ones inside the window, which still need chasing.
      return due >= from;
    })
    .map((deal) => {
      const value = convert(deal.value, deal.currency);
      const probability =
        deal.probability ?? STAGE_MAP[deal.stage]?.probability ?? 0;
      return { deal, value, weighted: (value * probability) / 100 };
    })
    .sort(
      (a, b) =>
        new Date(a.deal.expectedCloseDate).getTime() -
        new Date(b.deal.expectedCloseDate).getTime(),
    );
}

export type WaitingSampleRow = {
  deal: Deal;
  sentAt: string;
  daysWaiting: number;
};

/** Samples sent with no feedback recorded — oldest first. */
export function samplesAwaiting(
  deals: Deal[],
  period: DashboardPeriod,
  now = Date.now(),
): WaitingSampleRow[] {
  return deals
    .filter(
      (d) =>
        d.sample !== null &&
        d.sample.feedbackAt === null &&
        withinPeriod(d.sample.sentAt, period, now),
    )
    .map((deal) => ({
      deal,
      sentAt: deal.sample!.sentAt,
      daysWaiting: Math.floor(
        (now - new Date(deal.sample!.sentAt).getTime()) / 86_400_000,
      ),
    }))
    .sort((a, b) => b.daysWaiting - a.daysWaiting);
}

export type CashRow = {
  company: Company;
  /** What is still owed, not what the deal was worth. */
  value: number;
  daysOutstanding: number;
  /** Worst ageing across this customer's unpaid orders. */
  tone: AgeingTone;
  /** How many separate orders make up the balance. */
  orderCount: number;
};

/**
 * Money earned but not yet in the bank.
 *
 * Rewritten to read the deals rather than the company's stored flags. The old
 * version summed every won deal, so a customer who had paid half still showed
 * the full invoice — the one number on the dashboard you would act on was
 * overstated. It now subtracts what has actually been received.
 *
 * Ageing is counted from the DELIVERY date: money is only really due once the
 * customer has the goods.
 */
export function cashToCollect(
  companies: Company[],
  deals: Deal[],
  period: DashboardPeriod,
  convert: (amount: number, from: CurrencyCode) => number,
  now = Date.now(),
): CashRow[] {
  const owing = deals.filter(
    (d) =>
      d.stage === "won" &&
      isAwaitingPayment(d.fulfilment) &&
      withinPeriod(d.fulfilment.deliveredAt, period, now),
  );

  const byCompany = new Map<string, Deal[]>();
  for (const deal of owing) {
    byCompany.set(deal.companyId, [
      ...(byCompany.get(deal.companyId) ?? []),
      deal,
    ]);
  }

  const rows: CashRow[] = [];
  for (const [companyId, companyDeals] of byCompany) {
    const company = companies.find((c) => c.id === companyId);
    if (!company) continue;

    const value = companyDeals.reduce(
      (sum, d) =>
        sum + convert(amountOwed(d.value, d.fulfilment), d.currency),
      0,
    );
    // Nothing to chase once the balance is clear.
    if (value <= 0) continue;

    // The oldest unpaid order sets the tone — that is the one at risk.
    const ages = companyDeals
      .map((d) => daysSinceDelivery(d.fulfilment, now))
      .filter((n): n is number => n !== null);
    const daysOutstanding = ages.length > 0 ? Math.max(...ages) : 0;

    rows.push({
      company,
      value,
      daysOutstanding,
      tone: ageingTone(daysOutstanding),
      orderCount: companyDeals.length,
    });
  }

  return rows.sort((a, b) => b.value - a.value);
}

