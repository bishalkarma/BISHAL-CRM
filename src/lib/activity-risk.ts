/**
 * Soft risk detection.
 *
 * Counting how often you talk to a customer says nothing about whether the
 * news is good. A journal can look busy right up to the moment the customer
 * says "we went with another supplier" — so this reads what was actually
 * written and raises a quiet warning.
 *
 * Deliberately conservative, in this order:
 *   1. clear good news anywhere in the note wins outright
 *   2. only whole phrases match, never bare words
 *   3. a negator immediately before a match cancels it
 *
 * That ordering exists because the first version flagged
 * "No cancellation, order is confirmed" and "Sorry for the delay" — a CRM
 * that cries wolf gets ignored, which is worse than one that stays quiet.
 *
 * The wording is always tentative ("may be", "possible"). This is a prompt to
 * go and look, never a verdict, and it never moves a SPANCOP stage.
 */

import type { Activity } from "./activities";

type RiskPattern = { re: RegExp; why: string };

/**
 * Whole phrases only. Bare words like "drop", "switch" or "sorry" were tried
 * and produced false alarms on ordinary sales notes.
 */
const RISK_PATTERNS: RiskPattern[] = [
  {
    re: /\b(mov(e|ed|ing)|go(ing)?|went|shift(ed)?|switch(ed|ing)?)\s+(to\s+|with\s+)?(an|the)?\s*(other|another|different)\s+(supplier|vendor|brand|company)\b/,
    why: "may be moving to another supplier",
  },
  {
    re: /\b(approved|selected|chose|choosing|awarded|finalised|finalized)\s+(the\s+)?(other|another|different)\s+(supplier|vendor|brand|company)\b/,
    why: "another vendor may be approved",
  },
  {
    // "go with prestige brand" — but never "go with us / our brand".
    re: /\bgo(ing)?\s+with\s+(?!us\b|our\b|ours\b)\w+\s+(brand|supplier|vendor)\b/,
    why: "may be choosing another brand",
  },
  { re: /\b(cancel(led|ed)?|cancellation)\b/, why: "a cancellation was mentioned" },
  { re: /\b(postpon(e|ed)|on hold|deferred)\b/, why: "may be on hold" },
  {
    re: /\b(too expensive|(price|quotation|rate|quote)\s+is\s+(very\s+|too\s+)?high|over budget|no budget|budget is over|budget over)\b/,
    why: "price objection raised",
  },
  {
    re: /\b(not interested|no requirement|no longer|closed the file)\b/,
    why: "interest may have dropped",
  },
  {
    re: /\b(reject(ed)?|declin(e|ed)|turn(ed)? down)\b/,
    why: "something was rejected",
  },
  { re: /\blost\b/, why: "a loss was mentioned" },
];

/** A negator this close before a match flips its meaning. */
const NEGATION = /\b(no|not|never|didn'?t|don'?t|doesn'?t|isn'?t|wasn'?t|won'?t|without)\b/;
const NEGATION_WINDOW = 28;

/** Unambiguous good news — overrides everything else in the same note. */
const GOOD_NEWS =
  /\b(confirmed|approved it|po received|purchase order|order placed|all good|agreed|signed|delivered|are happy|is fine)\b/;

/**
 * Reads one report. Returns the reason for concern, or null when clean.
 */
export function riskInReport(report: string): string | null {
  const text = report.toLowerCase();
  if (GOOD_NEWS.test(text)) return null;

  for (const { re, why } of RISK_PATTERNS) {
    const match = text.match(re);
    if (!match || match.index === undefined) continue;
    const before = text.slice(Math.max(0, match.index - NEGATION_WINDOW), match.index);
    if (NEGATION.test(before)) continue;
    return why;
  }
  return null;
}

export type RiskFlag = {
  why: string;
  /** Whole days since the entry that raised it. */
  daysAgo: number;
  activityId: string;
};

/** How far back to look. Deep enough that a routine note cannot bury bad news. */
const SCAN_DEPTH = 5;

/**
 * Scans the most recent entries, newest first.
 *
 * Depth matters: a customer can say "we're going elsewhere" on Monday and get
 * a routine follow-up on Tuesday. Reading only the newest entry would miss the
 * one that counts.
 */
export function detectRisk(
  activities: Activity[],
  now = Date.now(),
): RiskFlag | null {
  const recent = activities
    .filter((a) => new Date(a.occurredAt).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, SCAN_DEPTH);

  for (const activity of recent) {
    const why = riskInReport(activity.report);
    if (!why) continue;
    return {
      why,
      daysAgo: Math.max(
        Math.round(
          (now - new Date(activity.occurredAt).getTime()) / 86_400_000,
        ),
        0,
      ),
      activityId: activity.id,
    };
  }
  return null;
}
