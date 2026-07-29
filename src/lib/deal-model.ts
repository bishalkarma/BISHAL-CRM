/**
 * Deal domain logic — line items, ageing and value.
 *
 * Agreed rules:
 *  • One deal per enquiry; products are line items (Option B)
 *  • Deal value = sum of APPROVED lines. Lines left "quoted" count as approved,
 *    so the common case needs no extra work.
 *  • Ageing counts ACTIVE days only — dormant time between Lost and Reopened
 *    is excluded, because we don't control when a dead deal comes back.
 */


export type LineStatus = "quoted" | "approved" | "rejected";

export type LostReason =
  | "Budget Constraint"
  | "Item not in scope"
  | "Lead time"
  | "Query Cancelled";

export const LOST_REASONS: LostReason[] = [
  "Budget Constraint",
  "Item not in scope",
  "Lead time",
  "Query Cancelled",
];

/**
 * Deal category — mandatory, so dashboard analysis of "which category brings
 * the most enquiries" is reliable. Deal-level, not line-level: a mixed
 * enquiry becomes two deals, which keeps the analysis clean.
 */
export const DEAL_CATEGORIES = [
  "OS&E — Operating Supplies and Equipment",
  "FF&E — Furniture, Fixtures and Equipment",
  "FOH — Front of House",
  "BOH — Back of House",
] as const;

export const UNITS = ["Pcs", "Kg", "Ltr", "Box", "Carton", "Set"] as const;
export type Unit = (typeof UNITS)[number];

export type LineItem = {
  id: string;
  product: string;
  brand: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  status: LineStatus;
  /** Only when status is "rejected". */
  rejectReason?: LostReason;
};

export const LINE_STATUS_META: Record<
  LineStatus,
  { label: string; tint: string; dot: string }
> = {
  quoted: {
    label: "Quoted",
    tint: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  approved: {
    label: "Approved",
    tint: "bg-success/12 text-success",
    dot: "bg-success",
  },
  rejected: {
    label: "Rejected",
    tint: "bg-destructive/12 text-destructive",
    dot: "bg-destructive",
  },
};

export function lineTotal(line: LineItem) {
  return line.quantity * line.unitPrice;
}

/**
 * A line counts toward deal value unless it was explicitly rejected.
 * "Quoted" is treated as approved so a single-click Won stays accurate
 * for anyone who never bothers to mark lines.
 */
export function lineCounts(line: LineItem) {
  return line.status !== "rejected";
}

export function dealValue(lines: LineItem[]) {
  return lines.filter(lineCounts).reduce((sum, l) => sum + lineTotal(l), 0);
}

export function rejectedValue(lines: LineItem[]) {
  return lines
    .filter((l) => l.status === "rejected")
    .reduce((sum, l) => sum + lineTotal(l), 0);
}

export function quotedValue(lines: LineItem[]) {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

/* ------------------------------------------------------------------ */
/* Ageing                                                              */
/* ------------------------------------------------------------------ */

/**
 * A period during which the deal was actively worked.
 * `closedAt` is null while the period is still running.
 */
export type ActivePeriod = { openedAt: string; closedAt: string | null };

const DAY = 86_400_000;

/** Whole days between two instants, never negative. */
function daysBetween(from: string, to: string | number) {
  const end = typeof to === "number" ? to : new Date(to).getTime();
  return Math.max(0, Math.floor((end - new Date(from).getTime()) / DAY));
}

/**
 * Total days the deal has actually been worked, excluding any dormant
 * stretch between a Lost and a later Reopen.
 */
export function activeDays(periods: ActivePeriod[], now = Date.now()) {
  return periods.reduce(
    (sum, p) => sum + daysBetween(p.openedAt, p.closedAt ?? now),
    0,
  );
}

/** Days in the CURRENT run only — what rotting alerts should use. */
export function currentRunDays(periods: ActivePeriod[], now = Date.now()) {
  const open = periods.find((p) => p.closedAt === null);
  return open ? daysBetween(open.openedAt, now) : 0;
}

/** Dormant days are stored but never counted toward cycle time. */
export function dormantDays(periods: ActivePeriod[]) {
  let total = 0;
  for (let i = 1; i < periods.length; i++) {
    const prevClose = periods[i - 1].closedAt;
    if (prevClose) total += daysBetween(prevClose, periods[i].openedAt);
  }
  return total;
}

export function isReopened(periods: ActivePeriod[]) {
  return periods.length > 1;
}

/** Close the running period — used when a deal is won or lost. */
export function closePeriods(
  periods: ActivePeriod[],
  at = new Date().toISOString(),
): ActivePeriod[] {
  return periods.map((p) => (p.closedAt === null ? { ...p, closedAt: at } : p));
}

/** Start a new period — used when a closed deal is reopened. */
export function reopenPeriods(
  periods: ActivePeriod[],
  at = new Date().toISOString(),
): ActivePeriod[] {
  if (periods.some((p) => p.closedAt === null)) return periods;
  return [...periods, { openedAt: at, closedAt: null }];
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

/**
 * `enquiryFrom` is locked at creation so the "who feeds us business" report
 * stays accurate. `currentContactId` moves automatically when an activity is
 * logged with a different person at the same company.
 */
export type ContactTrailEntry = {
  contactId: string;
  at: string;
  note: string;
};

export type SampleRecord = {
  sentAt: string;
  feedbackAt: string | null;
  feedback: string | null;
};

export function daysToFeedback(sample: SampleRecord) {
  if (!sample.feedbackAt) return null;
  return daysBetween(sample.sentAt, sample.feedbackAt);
}

/* ------------------------------------------------------------------ */
/* Order fulfilment — the C · O · P half of the customer journey       */
/* ------------------------------------------------------------------ */

/**
 * What has happened to a won deal after it was won.
 *
 * Kept on the deal rather than the company because one customer can run
 * several orders at once: the PO, the delivery and the money all belong to a
 * single deal. The company-level flags stay a fast summary for SPANCOP.
 *
 * Every date here is stamped by the app when a button is pressed — nothing is
 * typed, so a date can never be mistyped or back-dated by accident.
 */
export type Fulfilment = {
  poNumber: string | null;
  poDate: string | null;
  deliveredAt: string | null;
  /** True when only part of the order shipped. */
  partialDelivery: boolean;
  /** Free text: what is still to come on a partial delivery. */
  deliveryNote: string | null;
  /** Set only when the balance reaches zero. */
  paidAt: string | null;
  /** Running total received, in the deal's own currency. */
  amountReceived: number;
};

export const EMPTY_FULFILMENT: Fulfilment = {
  poNumber: null,
  poDate: null,
  deliveredAt: null,
  partialDelivery: false,
  deliveryNote: null,
  paidAt: null,
  amountReceived: 0,
};

/** The four steps of the tracker shown on a won deal. */
export type FulfilmentStep = "won" | "po" | "delivered" | "paid";

export const FULFILMENT_STEPS: { id: FulfilmentStep; label: string }[] = [
  { id: "won", label: "Won" },
  { id: "po", label: "PO" },
  { id: "delivered", label: "Delivered" },
  { id: "paid", label: "Paid" },
];

/** How far along a won deal is. Drives the tracker and the next button. */
export function fulfilmentStage(f: Fulfilment): FulfilmentStep {
  if (f.paidAt) return "paid";
  if (f.deliveredAt) return "delivered";
  if (f.poNumber) return "po";
  return "won";
}

/**
 * What is still owed on this deal.
 *
 * Guarded at zero: an over-payment is a data-entry slip, not a negative debt,
 * and a negative number would quietly reduce the dashboard total.
 */
export function balanceOutstanding(value: number, f: Fulfilment) {
  if (f.paidAt) return 0;
  return Math.max(0, value - f.amountReceived);
}

/**
 * Days since delivery, for the ageing clock.
 *
 * Counted from the delivery date, not the PO date — the money is only really
 * due once the customer has the goods. Null until something has shipped.
 */
export function daysSinceDelivery(f: Fulfilment, now = Date.now()) {
  if (!f.deliveredAt) return null;
  return Math.floor((now - new Date(f.deliveredAt).getTime()) / 86_400_000);
}

export type AgeingTone = "fresh" | "chase" | "risk";

/** Agreed thresholds: under 30 days normal, 30–60 chase, over 60 at risk. */
export function ageingTone(days: number | null): AgeingTone {
  if (days === null || days < 30) return "fresh";
  if (days <= 60) return "chase";
  return "risk";
}

/** A deal counts as cash owed once it has shipped and is not settled. */
export function isAwaitingPayment(f: Fulfilment) {
  return Boolean(f.deliveredAt) && !f.paidAt;
}
