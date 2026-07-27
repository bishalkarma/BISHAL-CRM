/**
 * The customer story, as three bullets.
 *
 * Runs entirely on the device: no API key, no per-call cost, no network,
 * instant, works offline. Every line is assembled from records that were
 * actually logged, so it cannot invent a promise or a price.
 *
 * Three bullets, because that is what a salesperson needs before a call:
 *   1. where it stands   — the latest real interaction
 *   2. what has happened — the whole history, in one line
 *   3. what is next      — the most urgent outstanding thing
 *
 * Two counting rules, both agreed with the user:
 *
 *   THREAD MODEL — a log and the follow-up task created on it are one unit.
 *   The interaction is not finished until its task is done. "6 interactions ·
 *   1 still open" is honest in a way that a single number is not.
 *
 *   FUTURE-DATED ENTRIES — a meeting booked for next week has not happened,
 *   so it is never counted as history. It stays visible as "upcoming", and
 *   its task still surfaces as the next step, because that work is real now.
 */

import { type Activity, type ActivityType } from "./activities";
import { detectRisk, type RiskFlag } from "./activity-risk";

const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* Thread helpers — the shared definition of "counted"                 */
/* ------------------------------------------------------------------ */

/** Has this actually happened yet? Future-dated entries have not. */
export function hasHappened(activity: Activity, now = Date.now()) {
  return new Date(activity.occurredAt).getTime() <= now;
}

/** Booked for later — real, but not history. */
export function isUpcoming(activity: Activity, now = Date.now()) {
  return !hasHappened(activity, now);
}

/**
 * An open thread: it happened, but the follow-up it created is still pending.
 * The conversation is live.
 */
export function isOpenThread(activity: Activity, now = Date.now()) {
  return (
    hasHappened(activity, now) && Boolean(activity.task) && !activity.taskDone
  );
}

/** Happened, and nothing left hanging off it. */
export function isClosedThread(activity: Activity, now = Date.now()) {
  return hasHappened(activity, now) && !isOpenThread(activity, now);
}

export type ThreadCounts = {
  /** Interactions that have actually happened. */
  logged: number;
  /** Of those, how many still have a pending follow-up. */
  open: number;
  closed: number;
  /** Booked for a future date — excluded from `logged`. */
  upcoming: number;
};

export function countThreads(
  activities: Activity[],
  now = Date.now(),
): ThreadCounts {
  let logged = 0;
  let open = 0;
  let upcoming = 0;
  for (const activity of activities) {
    if (isUpcoming(activity, now)) {
      upcoming += 1;
      continue;
    }
    logged += 1;
    if (isOpenThread(activity, now)) open += 1;
  }
  return { logged, open, closed: logged - open, upcoming };
}

/* ------------------------------------------------------------------ */
/* Wording helpers                                                     */
/* ------------------------------------------------------------------ */

function dayGap(from: string, to: number | string = Date.now()) {
  const a = new Date(from).getTime();
  const b = typeof to === "number" ? to : new Date(to).getTime();
  return Math.max(Math.round((b - a) / DAY), 0);
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function ago(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

/**
 * Channel-aware phrasing so a contact name always slots in grammatically.
 * Built after "visited the property Reena Thomas" and "messaged on WhatsApp
 * Grace" came out of an earlier version.
 */
const PHRASING: Record<
  ActivityType,
  { verb: string; prep: string; tail?: string }
> = {
  site_visit: { verb: "visited the property", prep: "and met" },
  call: { verb: "called", prep: "" },
  email: { verb: "emailed", prep: "" },
  meeting: { verb: "met", prep: "" },
  demo: { verb: "sent samples", prep: "to" },
  casual_follow_up: { verb: "followed up", prep: "with" },
  whatsapp: { verb: "messaged", prep: "", tail: "on WhatsApp" },
  payment_follow_up: { verb: "chased payment", prep: "with" },
};

function didWhat(type: ActivityType, who: string | null) {
  const { verb, prep, tail } = PHRASING[type];
  const parts = [verb];
  if (who) {
    if (prep) parts.push(prep);
    parts.push(who);
  }
  if (tail) parts.push(tail);
  return parts.join(" ");
}

/** Trims a report to a clause, never mid-word. */
function clause(report: string, max = 95) {
  const clean = report.trim().replace(/\s+/g, " ").replace(/[.。]+$/, "");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Lower-cases for mid-sentence use, but protects names and acronyms. */
function inlineCase(text: string) {
  const words = text.split(/\s+/);
  const first = words[0]?.replace(/[.,:;]$/, "") ?? "";
  const isAcronym = first.length > 1 && first === first.toUpperCase();
  const isTitle = /^(Mr|Mrs|Ms|Dr|Chef|Eng)\.?$/i.test(first);
  const looksLikeName =
    /^[A-Z][a-z]+$/.test(first) && /^[A-Z]/.test(words[1] ?? "");
  if (isAcronym || isTitle || looksLikeName) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------ */
/* The summary                                                         */
/* ------------------------------------------------------------------ */

export type BulletKind =
  | "now"
  | "history"
  | "next"
  | "overdue"
  | "upcoming"
  | "none";

export type Bullet = { kind: BulletKind; text: string };

export type CustomerBrief = {
  bullets: Bullet[];
  counts: ThreadCounts;
  risk: RiskFlag | null;
  /** Distinct deals that came up in conversation. */
  dealIds: string[];
  /** Average days between interactions; null with fewer than two. */
  cadenceDays: number | null;
  daysSinceLast: number | null;
};

/**
 * Builds the three-bullet brief. Returns null when there is nothing at all.
 */
export function briefCustomer(
  activities: Activity[],
  contactName?: (id: string | null) => string | null,
  now = Date.now(),
): CustomerBrief | null {
  if (activities.length === 0) return null;

  const happened = activities
    .filter((a) => hasHappened(a, now))
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
  const upcoming = activities
    .filter((a) => isUpcoming(a, now))
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

  const counts = countThreads(activities, now);
  const nameOf = (id: string | null) => (contactName ? contactName(id) : null);
  const bullets: Bullet[] = [];

  /* ---- 1. Where it stands ---------------------------------------- */
  if (happened.length > 0) {
    const last = happened[happened.length - 1];
    const days = dayGap(last.occurredAt, now);
    bullets.push({
      kind: "now",
      text: `${sentenceCase(ago(days))} we ${didWhat(
        last.type,
        nameOf(last.contactId),
      )} — ${inlineCase(clause(last.report))}.`,
    });
  } else {
    bullets.push({
      kind: "now",
      text: "Nothing logged yet — the first entry is still ahead.",
    });
  }

  /* ---- 2. What has been happening (wording B) --------------------- */
  const dealIds = [
    ...new Set(happened.filter((a) => a.dealId).map((a) => a.dealId as string)),
  ];
  let cadenceDays: number | null = null;

  if (happened.length > 0) {
    const first = happened[0];
    const last = happened[happened.length - 1];
    if (happened.length > 1) {
      cadenceDays = Math.max(
        Math.round(
          dayGap(first.occurredAt, new Date(last.occurredAt).getTime()) /
            (happened.length - 1),
        ),
        1,
      );
    }
    // Total leads, the exception follows — so nothing looks hidden.
    const openPart = counts.open > 0 ? ` · ${counts.open} still open` : "";
    const cadencePart = cadenceDays
      ? `, about every ${plural(cadenceDays, "day")}`
      : "";
    const dealPart = dealIds.length ? ` · ${dealIds.join(", ")}` : "";
    bullets.push({
      kind: "history",
      text: `${plural(
        counts.logged,
        "interaction",
      )}${openPart} since ${ago(dayGap(first.occurredAt, now))}${cadencePart}${dealPart}.`,
    });
  } else if (counts.upcoming > 0) {
    bullets.push({
      kind: "history",
      text: `${plural(counts.upcoming, "entry")} booked, none logged yet.`,
    });
  }

  /* ---- 3. What is next -------------------------------------------- */
  /*
    A task on a future-dated entry still counts here. The meeting has not
    happened, but "send the revised quote" is real work due now.
  */
  const openTasks = activities
    .filter((a) => a.task && !a.taskDone)
    .sort(
      (a, b) =>
        new Date(a.taskDueAt ?? a.occurredAt).getTime() -
        new Date(b.taskDueAt ?? b.occurredAt).getTime(),
    );

  if (openTasks.length > 0) {
    const task = openTasks[0];
    const dueIn = task.taskDueAt
      ? Math.round((new Date(task.taskDueAt).getTime() - now) / DAY)
      : null;
    const when =
      dueIn === null
        ? ""
        : dueIn < 0
          ? ` — overdue ${plural(-dueIn, "day")}`
          : dueIn === 0
            ? " — due today"
            : ` — due in ${plural(dueIn, "day")}`;
    const more =
      openTasks.length > 1
        ? ` (+${openTasks.length - 1} more)`
        : "";
    bullets.push({
      kind: dueIn !== null && dueIn < 0 ? "overdue" : "next",
      text: `${clause(task.task ?? "", 70)}${when}${more}.`,
    });
  } else if (upcoming.length > 0) {
    const next = upcoming[0];
    const inDays = Math.max(
      Math.round((new Date(next.occurredAt).getTime() - now) / DAY),
      0,
    );
    bullets.push({
      kind: "upcoming",
      text: `Upcoming ${next.type.replace(/_/g, " ")} ${
        inDays === 0 ? "later today" : `in ${plural(inDays, "day")}`
      }.`,
    });
  } else {
    bullets.push({
      kind: "none",
      text: "Nothing scheduled — no next step booked.",
    });
  }

  return {
    bullets,
    counts,
    risk: detectRisk(activities, now),
    dealIds,
    cadenceDays,
    daysSinceLast:
      happened.length > 0
        ? dayGap(happened[happened.length - 1].occurredAt, now)
        : null,
  };
}
