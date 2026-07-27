/**
 * The story thread.
 *
 * A summary that quotes only the newest entry cannot tell you what a deal is
 * about. Reading "reminder call to prepare for the stock" says nothing about
 * 455 pcs, AED 38,930, or the sample they already approved.
 *
 * This picks the entries that *changed the state* of the relationship and
 * lays them out in order, so a stranger can read the account cold and know
 * where it stands. Routine follow-ups are excluded — they are traffic, not
 * turning points.
 *
 * Runs on the device: no API key, no cost, and it can only ever quote text
 * that was actually logged.
 */

import { ACTIVITY_MAP, type Activity, type ActivityType } from "./activities";

const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* Significance                                                        */
/* ------------------------------------------------------------------ */

type Marker = { re: RegExp; weight: number; tag: StoryTag };

export type StoryTag =
  | "requirement"
  | "quotation"
  | "sample"
  | "order"
  | "payment"
  | "negotiation"
  | "risk"
  | "delivery";

/**
 * What makes an entry worth remembering. Weights are deliberate: an order or
 * a risk outranks a quotation, which outranks a routine touch.
 */
const MARKERS: Marker[] = [
  {
    re: /\b(requirement|require[sd]?|need(s|ed)?|asked for|looking for|enquir)/i,
    weight: 5,
    tag: "requirement",
  },
  {
    re: /\b(quotation|quote[ds]?|offer|pricing|price list|rate[s]?|aed|usd)\b/i,
    weight: 4,
    tag: "quotation",
  },
  { re: /\b(sample|demo|trial|tested|cupping)/i, weight: 4, tag: "sample" },
  {
    re: /\b(purchase order|p\.?\s?o\b|approved|approval|confirm(ed)?|won)\b/i,
    weight: 6,
    tag: "order",
  },
  {
    re: /\b(payment received|paid|settled|invoice cleared|released)\b/i,
    weight: 5,
    tag: "payment",
  },
  {
    re: /\b(discount|negotiat|revised|counter|final offer)/i,
    weight: 3,
    tag: "negotiation",
  },
  {
    re: /\b(another supplier|other supplier|comparing with|cancel(led|ed)?|reject(ed)?|too high|not interested|on hold|postpon)/i,
    weight: 7,
    tag: "risk",
  },
  {
    re: /\b(deliver(y|ed)?|dispatch(ed)?|stock|shipment|installation)\b/i,
    weight: 3,
    tag: "delivery",
  },
];

/** Face-to-face carries more weight than a message. */
const CHANNEL_WEIGHT: Record<ActivityType, number> = {
  meeting: 2,
  site_visit: 2,
  demo: 2,
  payment_follow_up: 2,
  call: 1,
  email: 1,
  whatsapp: 0,
  casual_follow_up: 0,
};

/** Below this, an entry is routine traffic and never enters the story. */
const SIGNIFICANT = 5;

type Scored = {
  activity: Activity;
  score: number;
  tags: StoryTag[];
  at: number;
};

function scoreActivity(activity: Activity): Scored {
  let score = CHANNEL_WEIGHT[activity.type] ?? 0;
  const tags: StoryTag[] = [];
  for (const marker of MARKERS) {
    if (!marker.re.test(activity.report)) continue;
    score += marker.weight;
    tags.push(marker.tag);
  }
  return {
    activity,
    score,
    tags,
    at: new Date(activity.occurredAt).getTime(),
  };
}

/* ------------------------------------------------------------------ */
/* Wording                                                             */
/* ------------------------------------------------------------------ */

function ago(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${(days / 365).toFixed(1)} years ago`;
}

/**
 * Tidies a report for display.
 *
 * The limit is deliberately generous: real notes here run from 32 to 231
 * characters, so 400 clears the longest with room to spare and nothing is
 * lost. Height is handled visually instead — the UI clamps a long line to two
 * rows and reveals the rest on tap, which keeps the panel compact without
 * deleting a single word.
 *
 * A cut only happens past 400, and even then it breaks at a comma or a
 * conjunction rather than mid-word. An earlier 95-character version removed
 * "order" from "approval of the purchase order", losing the one fact that
 * mattered.
 */
export function gist(report: string, max = 400) {
  const text = report
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/, "")
    // Filler openings that carry no information.
    .replace(/^(reminder |follow ?up |just |kindly )/i, "");
  if (text.length <= max) return text;

  const boundaries = [...text.matchAll(/[,;]| and | for | after | with /gi)]
    .map((m) => m.index ?? -1)
    .filter((i) => i > 0 && i <= max);
  const cut = boundaries[boundaries.length - 1];
  if (cut !== undefined && cut > max * 0.5) return text.slice(0, cut);

  const space = text.slice(0, max).lastIndexOf(" ");
  return `${text.slice(0, space > 0 ? space : max)}…`;
}

/* ------------------------------------------------------------------ */
/* The story                                                           */
/* ------------------------------------------------------------------ */

export type StoryLine = {
  id: string;
  when: string;
  text: string;
  tags: StoryTag[];
  type: ActivityType;
  typeLabel: string;
  /** Outcomes are worth colouring: a win, a payment, or a threat. */
  tone: "positive" | "risk" | "neutral";
};

/**
 * Lines grow with the relationship.
 *
 * Five was enough while testing because the test data had exactly five
 * turning points planted in it. A real two-year account has eight or more —
 * three orders won, a price objection, a competitor threat, a live quote —
 * and squeezing those into five silently dropped the orders.
 */
export function lineBudget(count: number) {
  if (count <= 10) return 5;
  if (count <= 40) return 6;
  if (count <= 100) return 7;
  return 8;
}

const OUTCOME_TAGS: StoryTag[] = ["order", "payment", "risk"];

function toneOf(tags: StoryTag[]): StoryLine["tone"] {
  if (tags.includes("risk")) return "risk";
  if (tags.includes("order") || tags.includes("payment")) return "positive";
  return "neutral";
}

/**
 * Builds the thread. Only past entries — a meeting booked for next week has
 * not happened, so it cannot be part of the history.
 */
export function buildStory(
  activities: Activity[],
  now = Date.now(),
): StoryLine[] {
  const past = activities
    .filter((a) => new Date(a.occurredAt).getTime() <= now)
    .map(scoreActivity)
    .sort((a, b) => a.at - b.at);

  if (past.length === 0) return [];
  if (past.length <= 3) return past.map((s) => toLine(s, now));

  const budget = lineBudget(past.length);
  const first = past[0];
  const last = past[past.length - 1];

  /*
    Spread the picks across the whole span rather than taking the highest
    scores outright, otherwise one busy month buries two quiet years.

    Empty slots are redistributed: a long quiet stretch would otherwise waste
    its slot and silently drop a quotation from a busier period.
  */
  const middle = past.slice(1, -1).filter((s) => s.score >= SIGNIFICANT);
  const span = last.at - first.at || 1;
  const slots = Math.max(budget - 2, 1);
  const picked: Scored[] = [];
  for (let i = 0; i < slots; i += 1) {
    const from = first.at + (span * i) / slots;
    const to = first.at + (span * (i + 1)) / slots;
    const inSlot = middle.filter(
      (s) => s.at >= from && s.at < to && !picked.includes(s),
    );
    if (inSlot.length === 0) continue;
    picked.push(inSlot.sort((a, b) => b.score - a.score)[0]);
  }

  // Backfill from whatever is left, highest scoring first.
  const spare = middle
    .filter((s) => !picked.includes(s))
    .sort((a, b) => b.score - a.score);
  while (picked.length < slots && spare.length > 0) {
    picked.push(spare.shift() as Scored);
  }

  /*
    Outcomes are the plot. The most recent order, payment and risk are pinned
    in regardless of where they fall, so a won deal can never be summarised
    away by a run of chatter that followed it.
  */
  const pinned = new Map<StoryTag, Scored>();
  for (const s of past) {
    for (const tag of s.tags) {
      if (OUTCOME_TAGS.includes(tag)) pinned.set(tag, s);
    }
  }

  // A routine first entry is not worth a line once there is real history.
  const head = first.score >= SIGNIFICANT || past.length <= 10 ? [first] : [];

  const chosen = [...head, ...picked, ...pinned.values(), last]
    .filter((s, i, all) => all.indexOf(s) === i)
    .sort((a, b) => a.at - b.at);

  // Keep the most recent when pinning pushes us over budget.
  return chosen.slice(-budget).map((s) => toLine(s, now));
}

function toLine(scored: Scored, now: number): StoryLine {
  const days = Math.max(Math.round((now - scored.at) / DAY), 0);
  return {
    id: scored.activity.id,
    when: ago(days),
    text: gist(scored.activity.report),
    tags: scored.tags,
    type: scored.activity.type,
    typeLabel: ACTIVITY_MAP[scored.activity.type].label,
    tone: toneOf(scored.tags),
  };
}
