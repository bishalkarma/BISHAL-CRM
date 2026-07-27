/**
 * The written story of a customer relationship.
 *
 * `activity-summary.ts` answers "what are the numbers?". This answers
 * "what is the story?" — the paragraph a colleague would say if you asked
 * them to catch you up before a call.
 *
 * It runs entirely on the device. No API key, no per-call cost, no network,
 * instant, and it works on a plane. Crucially it can only ever restate what
 * was actually logged: every sentence is assembled from real records, so it
 * cannot hallucinate a promise or a price that was never written down.
 *
 * How it reads a journal, in the order a person would:
 *   1. how the relationship opened
 *   2. what has been happening since, and at what rhythm
 *   3. whether a deal ever entered the conversation
 *   4. where it stands right now
 *   5. what is outstanding
 */

import { type Activity, type ActivityType } from "./activities";
import { summariseCustomer, type CustomerSummary } from "./activity-summary";

const DAY = 86_400_000;

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
 * Past-tense phrasing per channel, split so a contact name always slots in
 * grammatically: verb + (preposition) + name + tail.
 *   site visit → "visited the property and met Reena Thomas"
 *   whatsapp   → "messaged Grace Mensah on WhatsApp"
 */
const PHRASING: Record<
  ActivityType,
  { verb: string; prep: string; tail?: string }
> = {
  site_visit: { verb: "visited the property", prep: "and met" },
  call: { verb: "called", prep: "" },
  email: { verb: "emailed", prep: "" },
  meeting: { verb: "met", prep: "" },
  demo: { verb: "submitted samples", prep: "to" },
  casual_follow_up: { verb: "followed up", prep: "with", tail: "informally" },
  whatsapp: { verb: "messaged", prep: "", tail: "on WhatsApp" },
  payment_follow_up: { verb: "chased payment", prep: "with" },
};

/** Builds "emailed Ankit" / "messaged Grace on WhatsApp" / "called". */
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

/** Trims a logged report to a clause that can sit inside a sentence. */
function clause(report: string, max = 110) {
  const clean = report.trim().replace(/\s+/g, " ").replace(/[.。]+$/, "");
  if (clean.length <= max) return clean;
  // Cut on a word boundary so it never ends mid-word.
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * Lower-cases the first word so a report can sit mid-sentence — but leaves
 * proper nouns and acronyms alone. "Sent the quote" → "sent the quote",
 * while "Mr. Ankit called" and "USD lock" keep their capitals.
 */
function inlineCase(text: string) {
  const firstWord = text.split(/\s+/)[0]?.replace(/[.,:;]$/, "") ?? "";
  const isAcronym = firstWord.length > 1 && firstWord === firstWord.toUpperCase();
  const isTitle = /^(Mr|Mrs|Ms|Dr|Chef|Eng)\.?$/i.test(firstWord);
  // A capitalised word whose *next* word is also capitalised reads as a name.
  const words = text.split(/\s+/);
  const looksLikeName =
    /^[A-Z][a-z]+$/.test(firstWord) && /^[A-Z]/.test(words[1] ?? "");
  if (isAcronym || isTitle || looksLikeName) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export type Narrative = {
  /** 3–6 sentences, the full catch-up. */
  paragraph: string;
  /** Each sentence separately, for staggered reveal in the UI. */
  sentences: string[];
  /** The one line to lead with — "Waiting on them since Tuesday." */
  standfirst: string;
  /** Suggested next move, derived from the pattern. Never a promise. */
  suggestion: string | null;
  summary: CustomerSummary;
};

/**
 * Writes the story. Returns null when there is nothing logged.
 */
export function narrateCustomer(
  activities: Activity[],
  contactName?: (id: string | null) => string | null,
  now = Date.now(),
): Narrative | null {
  const summary = summariseCustomer(activities, now);
  if (!summary) return null;

  const sorted = [...activities].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const nameOf = (id: string | null) => (contactName ? contactName(id) : null);

  const sentences: string[] = [];

  /* ---- 1. How it opened ------------------------------------------- */
  const openedDays = dayGap(first.occurredAt, now);
  const firstWho = nameOf(first.contactId);
  /*
    With a single entry the opening IS the latest state, so step 4 is skipped
    to avoid saying the same thing twice.
  */
  const onlyOne = sorted.length === 1;
  if (onlyOne) {
    sentences.push(
      `First contact ${ago(openedDays)} — ${didWhat(
        first.type,
        firstWho,
      )}: ${inlineCase(clause(first.report))}.`,
    );
  } else {
    sentences.push(
      `The relationship opened ${ago(openedDays)} when we ${didWhat(
        first.type,
        firstWho,
      )}.`,
    );
  }

  /* ---- 2. What has happened since, and how often ------------------ */
  if (sorted.length > 1) {
    const channels = summary.typeCounts
      .slice(0, 3)
      .map((t) => plural(t.count, t.label.toLowerCase()))
      .join(", ");
    const rhythm =
      summary.cadenceDays !== null
        ? summary.cadenceDays <= 7
          ? "keeping close contact"
          : summary.cadenceDays <= 21
            ? "touching base every few weeks"
            : "with long gaps between touches"
        : "";
    sentences.push(
      `Since then there have been ${plural(
        summary.total,
        "interaction",
      )} — ${channels} — ${rhythm}.`,
    );
  }

  /* ---- 3. Did a deal ever enter the conversation? ------------------ */
  if (summary.dealIds.length === 1) {
    const dealTouches = sorted.filter((a) => a.dealId).length;
    sentences.push(
      `Talk has centred on ${summary.dealIds[0]}, which came up in ${plural(
        dealTouches,
        "conversation",
      )}.`,
    );
  } else if (summary.dealIds.length > 1) {
    sentences.push(
      `${plural(
        summary.dealIds.length,
        "deal",
      )} have been discussed: ${summary.dealIds.join(", ")}.`,
    );
  } else if (summary.total > 2) {
    sentences.push(
      `No deal has been linked to any of it yet — this is still relationship building.`,
    );
  }

  /* ---- 4. Where it stands right now -------------------------------- */
  if (!onlyOne) {
    const lastWho = nameOf(last.contactId);
    sentences.push(
      `Most recently, ${ago(summary.daysSinceLast)}, we ${didWhat(
        last.type,
        lastWho,
      )}: ${inlineCase(clause(last.report))}.`,
    );
  }

  /* ---- 5. What is outstanding -------------------------------------- */
  const overdue = summary.openTasks.filter(
    (t) => t.taskDueAt && new Date(t.taskDueAt).getTime() < now,
  );
  if (overdue.length > 0) {
    const worst = overdue[0];
    const late = worst.taskDueAt ? dayGap(worst.taskDueAt, now) : 0;
    // "due 0 days ago" is nonsense — same-day slips read as "due today".
    const when = late === 0 ? "was due today" : `was due ${plural(late, "day")} ago`;
    sentences.push(
      `${
        overdue.length === 1 ? "One task is" : `${overdue.length} tasks are`
      } overdue — "${clause(worst.task ?? "", 70)}" ${when}.`,
    );
  } else if (summary.openTasks.length > 0) {
    const next = summary.openTasks[0];
    // Days remaining = due date minus now, so the arguments run that way round.
    const due = next.taskDueAt
      ? Math.max(
          Math.round(
            (new Date(next.taskDueAt).getTime() - now) / DAY,
          ),
          0,
        )
      : null;
    sentences.push(
      `Next up: "${clause(next.task ?? "", 70)}"${
        due !== null
          ? due === 0
            ? ", due today"
            : `, due in ${plural(due, "day")}`
          : ""
      }.`,
    );
  } else {
    sentences.push(`Nothing is scheduled — there is no next step on the books.`);
  }

  /* ---- Standfirst: the single most useful line --------------------- */
  let standfirst: string;
  if (overdue.length > 0) {
    standfirst = `${plural(overdue.length, "task")} overdue — needs action today.`;
  } else if (summary.momentum === "quiet") {
    standfirst = `Dormant ${plural(
      summary.daysSinceLast,
      "day",
    )} — worth a re-approach.`;
  } else if (summary.momentum === "cooling") {
    standfirst = `Slowing down — ${plural(
      summary.daysSinceLast,
      "day",
    )} since the last contact.`;
  } else if (summary.openTasks.length === 0) {
    standfirst = `Active, but nothing is scheduled next.`;
  } else {
    standfirst = `On track — next step is booked.`;
  }

  /* ---- Suggestion: pattern-based, never invented -------------------- */
  let suggestion: string | null = null;
  const hasQuoteTalk = sorted.some((a) =>
    /quot|price|offer|rate/i.test(a.report),
  );
  const sampled = sorted.some((a) => a.type === "demo");
  const chasingMoney = sorted.some((a) => a.type === "payment_follow_up");

  if (overdue.length > 0) {
    suggestion = `Clear the overdue task first, then log what came of it.`;
  } else if (summary.momentum === "quiet") {
    suggestion = summary.dealIds.length
      ? `Reopen the conversation on ${summary.dealIds[0]} before it goes cold.`
      : `Send a re-approach — no contact in ${plural(
          summary.daysSinceLast,
          "day",
        )}.`;
  } else if (chasingMoney) {
    suggestion = `Payment is outstanding — confirm the release date in writing.`;
  } else if (sampled && summary.openTasks.length === 0) {
    suggestion = `Samples were submitted but nothing is scheduled — collect the feedback.`;
  } else if (hasQuoteTalk && summary.openTasks.length === 0) {
    suggestion = `Pricing has been discussed with no next step — chase the decision.`;
  } else if (summary.openTasks.length === 0) {
    suggestion = `Set a follow-up so this does not go quiet.`;
  }

  return {
    paragraph: sentences.join(" "),
    sentences,
    standfirst,
    suggestion,
    summary,
  };
}
