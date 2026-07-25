/**
 * Period stage records.
 *
 * SPANCOP is a loop: collecting cash returns a customer to Approach. So the
 * closing stage alone can't distinguish a customer who ran a full cycle from
 * one who did nothing — both end at Approach.
 *
 * Every period therefore records FOUR values per customer, all derived from
 * the transition log, so past periods can be rebuilt at any time.
 */

import { SPANCOP_ORDER, type SpancopStage, type StageTransition } from "./spancop";

export type PeriodType = "week" | "month" | "quarter" | "year";

export type PeriodRange = {
  type: PeriodType;
  label: string;
  start: Date;
  end: Date;
  /** True for the period we are currently inside. */
  isCurrent: boolean;
};

export type CustomerPeriodRecord = {
  companyId: string;
  openingStage: SpancopStage;
  closingStage: SpancopStage;
  /** The value that survives the loop — real progress in the period. */
  furthestReached: SpancopStage;
  movements: number;
  reachedPayment: boolean;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Monday-based week start, matching UAE business convention closely enough. */
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  return x;
}

export function buildPeriod(type: PeriodType, offset = 0, now = new Date()): PeriodRange {
  let start: Date;
  let end: Date;
  let label: string;

  if (type === "week") {
    start = startOfWeek(now);
    start.setDate(start.getDate() + offset * 7);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
    label =
      offset === 0
        ? "This week"
        : `Week of ${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } else if (type === "month") {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    label =
      offset === 0
        ? "This month"
        : start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } else if (type === "quarter") {
    const q = Math.floor(now.getMonth() / 3) + offset;
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), q * 3 + 3, 1);
    label =
      offset === 0
        ? "This quarter"
        : `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(now.getFullYear() + offset + 1, 0, 1);
    label = offset === 0 ? "This year" : String(start.getFullYear());
  }

  return { type, label, start, end, isCurrent: offset === 0 };
}

const rank = (stage: SpancopStage) => SPANCOP_ORDER.indexOf(stage);

/** The further along the ladder, the higher the rank. */
export function furthestOf(a: SpancopStage, b: SpancopStage) {
  return rank(b) > rank(a) ? b : a;
}

/**
 * Build one record per company for the given period.
 *
 * `currentStages` supplies today's stage, needed because a company with no
 * transitions inside the window still has an opening and closing stage.
 */
export function buildPeriodRecords(
  transitions: StageTransition[],
  currentStages: Record<string, SpancopStage>,
  period: PeriodRange,
): CustomerPeriodRecord[] {
  const startMs = period.start.getTime();
  const endMs = period.end.getTime();

  return Object.entries(currentStages).map(([companyId, currentStage]) => {
    const all = transitions
      .filter((t) => t.companyId === companyId)
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const inPeriod = all.filter((t) => {
      const at = new Date(t.at).getTime();
      return at >= startMs && at < endMs;
    });

    // Opening stage = whatever the last transition before the window set,
    // falling back to the first known stage or today's.
    const before = all.filter((t) => new Date(t.at).getTime() < startMs);
    const openingStage: SpancopStage =
      before.length > 0
        ? before[before.length - 1].to
        : (inPeriod[0]?.from ?? currentStage);

    const closingStage: SpancopStage =
      inPeriod.length > 0 ? inPeriod[inPeriod.length - 1].to : openingStage;

    let furthestReached = openingStage;
    inPeriod.forEach((t) => {
      furthestReached = furthestOf(furthestReached, t.to);
    });

    return {
      companyId,
      openingStage,
      closingStage,
      furthestReached,
      movements: inPeriod.length,
      reachedPayment: furthestReached === "payment",
    };
  });
}

export type StageFlow = {
  stage: SpancopStage;
  /** Companies sitting here right now. */
  current: number;
  /** Companies whose furthest point in the period was this stage. */
  furthest: number;
  in: number;
  out: number;
};

/** Funnel data: live counts, furthest-reached counts, and movement in/out. */
export function buildStageFlow(
  transitions: StageTransition[],
  currentStages: Record<string, SpancopStage>,
  period: PeriodRange,
): StageFlow[] {
  const records = buildPeriodRecords(transitions, currentStages, period);
  const startMs = period.start.getTime();
  const endMs = period.end.getTime();

  const inWindow = transitions.filter((t) => {
    const at = new Date(t.at).getTime();
    return at >= startMs && at < endMs;
  });

  return SPANCOP_ORDER.map((stage) => ({
    stage,
    current: Object.values(currentStages).filter((s) => s === stage).length,
    furthest: records.filter((r) => r.furthestReached === stage).length,
    in: inWindow.filter((t) => t.to === stage).length,
    out: inWindow.filter((t) => t.from === stage).length,
  }));
}

/**
 * Stage-to-stage conversion within the period, e.g. Approach → Negotiate.
 * Denominator is everyone who was at the source stage at any point.
 */
export function conversionRate(
  flows: StageFlow[],
  from: SpancopStage,
  to: SpancopStage,
) {
  const source = flows.find((f) => f.stage === from);
  const target = flows.find((f) => f.stage === to);
  if (!source || !target) return 0;
  const base = source.current + source.out;
  if (base === 0) return 0;
  return Math.round((target.in / base) * 100);
}
