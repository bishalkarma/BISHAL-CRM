/**
 * Customer history summary.
 *
 * The problem: with real use, one customer accumulates hundreds of log
 * entries. Scrolling them one by one to answer "where are we with these
 * people?" does not scale.
 *
 * The approach: derive the answer from the records themselves. This file is
 * pure — same activities in, same summary out, no network, no API key, no
 * cost, works offline, and cannot invent a fact that is not in the data.
 * Every number below is traceable to a logged activity.
 *
 * A hosted language model can be layered on later for prose polish; the
 * headline, stats and signals it would need are exactly what this produces.
 */

import {
  ACTIVITY_MAP,
  isOpenTask,
  type Activity,
  type ActivityType,
} from "./activities";

const DAY = 86_400_000;

/** Whole-day gap, so the time of day never shifts a count. */
function dayGap(from: string, to: number | string = Date.now()) {
  const a = new Date(from).getTime();
  const b = typeof to === "number" ? to : new Date(to).getTime();
  return Math.max(Math.round((b - a) / DAY), 0);
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "today" / "yesterday" / "6 days ago" — reads naturally mid-sentence. */
function ago(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** How the relationship is trending — the single most useful signal. */
export type Momentum = "active" | "cooling" | "quiet" | "new";

export type SummarySignal = {
  tone: "positive" | "warning" | "danger" | "neutral";
  text: string;
};

export type CustomerSummary = {
  /** One-line answer to "where are we with this customer?". */
  headline: string;
  momentum: Momentum;
  /** Plain-language reason behind the momentum verdict. */
  momentumNote: string;

  total: number;
  /** Days between the first and most recent interaction. */
  spanDays: number;
  daysSinceLast: number;
  /** Average days between interactions; null when there is only one. */
  cadenceDays: number | null;

  /** Type mix, busiest first — "3 calls, 2 emails". */
  mix: string;
  typeCounts: { type: ActivityType; label: string; count: number }[];

  /** Distinct deals that came up in conversation. */
  dealIds: string[];
  contactCount: number;

  lastActivity: Activity | null;
  openTasks: Activity[];
  /** Overdue-first, so the worst news is never buried. */
  signals: SummarySignal[];
};

/**
 * Builds the summary for one customer's activities.
 * Returns null for an empty history — there is nothing to summarise.
 */
export function summariseCustomer(
  activities: Activity[],
  now = Date.now(),
): CustomerSummary | null {
  if (activities.length === 0) return null;

  const sorted = [...activities].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const total = sorted.length;
  const spanDays = dayGap(first.occurredAt, last.occurredAt);
  const daysSinceLast = dayGap(last.occurredAt, now);

  // Average gap between touches, measured across the span we actually have.
  const cadenceDays =
    total > 1 ? Math.max(Math.round(spanDays / (total - 1)), 1) : null;

  const counts = new Map<ActivityType, number>();
  for (const a of sorted) counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
  const typeCounts = [...counts.entries()]
    .map(([type, count]) => ({
      type,
      label: ACTIVITY_MAP[type].label,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const mix = typeCounts
    .map((t) => plural(t.count, t.label.toLowerCase()))
    .join(", ");

  const dealIds = [
    ...new Set(sorted.filter((a) => a.dealId).map((a) => a.dealId as string)),
  ];
  const contactCount = new Set(
    sorted.filter((a) => a.contactId).map((a) => a.contactId),
  ).size;

  const openTasks = sorted
    .filter(isOpenTask)
    .sort(
      (a, b) =>
        new Date(a.taskDueAt ?? a.occurredAt).getTime() -
        new Date(b.taskDueAt ?? b.occurredAt).getTime(),
    );

  /*
    Momentum. Judged against the customer's OWN rhythm, not a fixed number of
    days: a account normally touched weekly going 20 days silent matters more
    than a quarterly account doing the same.
  */
  let momentum: Momentum;
  let momentumNote: string;
  if (total === 1) {
    momentum = "new";
    momentumNote = `Only one interaction so far, ${ago(daysSinceLast)}.`;
  } else if (daysSinceLast > 30) {
    momentum = "quiet";
    momentumNote = `No contact for ${plural(daysSinceLast, "day")}.`;
  } else if (cadenceDays !== null && daysSinceLast > cadenceDays * 2) {
    momentum = "cooling";
    momentumNote = `Usually every ${plural(cadenceDays, "day")}, but ${plural(
      daysSinceLast,
      "day",
    )} since the last contact.`;
  } else {
    momentum = "active";
    momentumNote = `Steady contact, roughly every ${plural(
      cadenceDays ?? daysSinceLast,
      "day",
    )}.`;
  }

  /*
    Headline — the sentence a salesperson would actually say out loud.
  */
  const scope =
    spanDays > 0
      ? `${plural(total, "interaction")} over ${plural(spanDays, "day")}`
      : plural(total, "interaction");
  const dealPart =
    dealIds.length === 0
      ? "no deal linked yet"
      : dealIds.length === 1
        ? `around ${dealIds[0]}`
        : `across ${plural(dealIds.length, "deal")}`;
  const headline = `${scope}, ${dealPart}. Last ${ACTIVITY_MAP[
    last.type
  ].label.toLowerCase()} ${ago(daysSinceLast)}.`;

  /* Signals — the things worth acting on, worst first. */
  const signals: SummarySignal[] = [];

  const overdue = openTasks.filter(
    (t) => t.taskDueAt && new Date(t.taskDueAt).getTime() < now,
  );
  if (overdue.length > 0) {
    signals.push({
      tone: "danger",
      text: `${plural(overdue.length, "task")} overdue — ${overdue[0].task}`,
    });
  }

  if (momentum === "quiet") {
    signals.push({
      tone: "danger",
      text: `Dormant ${plural(daysSinceLast, "day")} — worth a re-approach.`,
    });
  } else if (momentum === "cooling") {
    signals.push({ tone: "warning", text: momentumNote });
  }

  if (openTasks.length === 0) {
    signals.push({
      tone: "warning",
      text: "Nothing scheduled — no next step on the books.",
    });
  }

  const payments = sorted.filter((a) => a.type === "payment_follow_up").length;
  if (payments > 0) {
    signals.push({
      tone: "warning",
      text: `${plural(payments, "payment follow-up")} logged — money outstanding.`,
    });
  }

  const samples = sorted.filter((a) => a.type === "demo").length;
  if (samples > 0) {
    signals.push({
      tone: "neutral",
      text: `${plural(samples, "sample/demo")} submitted.`,
    });
  }

  if (signals.length === 0) {
    signals.push({ tone: "positive", text: "On track, next step scheduled." });
  }

  return {
    headline,
    momentum,
    momentumNote,
    total,
    spanDays,
    daysSinceLast,
    cadenceDays,
    mix,
    typeCounts,
    dealIds,
    contactCount,
    lastActivity: last,
    openTasks,
    signals,
  };
}

export const MOMENTUM_STYLES: Record<
  Momentum,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-success/12 text-success" },
  cooling: { label: "Cooling", className: "bg-warning/15 text-warning" },
  quiet: { label: "Gone quiet", className: "bg-destructive/12 text-destructive" },
  new: { label: "New", className: "bg-accent/12 text-accent" },
};

export const SIGNAL_STYLES: Record<SummarySignal["tone"], string> = {
  positive: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};
