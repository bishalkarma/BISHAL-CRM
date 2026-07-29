/**
 * SPANCOP — company-level relationship stage.
 *
 * A repeating LOOP, not a one-way ladder:
 *
 *   Suspect → Prospect → Approach → Negotiate → Close → Order → Payment
 *                            ↑                                      │
 *                            └────────── cash collected ────────────┘
 *                            ↑
 *                            └────────── deal lost ─────────────────
 *
 * Approach is the resting state for every known customer between deals.
 *
 * Stage is SUGGESTED automatically but never applied silently — the user
 * confirms each move, and every transition is written to history.
 */

export type SpancopStage =
  | "suspect"
  | "prospect"
  | "approach"
  | "negotiate"
  | "close"
  | "order"
  | "payment";

export type SpancopDefinition = {
  id: SpancopStage;
  letter: string;
  label: string;
  description: string;
  /** Days at this stage before it is flagged as stalled. */
  stallDays: number;
  color: string;
  tint: string;
};

export const SPANCOP_STAGES: SpancopDefinition[] = [
  {
    id: "suspect",
    letter: "S",
    label: "Suspect",
    description: "Added but never contacted",
    stallDays: 30,
    color: "bg-muted-foreground/40",
    tint: "bg-secondary text-muted-foreground",
  },
  {
    id: "prospect",
    letter: "P",
    label: "Prospect",
    description: "Profile completed, not yet approached",
    stallDays: 21,
    color: "bg-chart-4",
    tint: "bg-chart-4/12 text-chart-4",
  },
  {
    id: "approach",
    letter: "A",
    label: "Approach",
    description: "In conversation — the resting state between deals",
    stallDays: 30,
    color: "bg-warning",
    tint: "bg-warning/15 text-warning",
  },
  {
    id: "negotiate",
    letter: "N",
    label: "Negotiate",
    description: "One or more deals are open",
    stallDays: 0,
    color: "bg-chart-1",
    tint: "bg-chart-1/12 text-chart-1",
  },
  {
    id: "close",
    letter: "C",
    label: "Close",
    description: "Deal won — awaiting the purchase order",
    stallDays: 14,
    color: "bg-success",
    tint: "bg-success/12 text-success",
  },
  {
    id: "order",
    letter: "O",
    label: "Order",
    description: "Purchase order received, not yet delivered",
    stallDays: 30,
    color: "bg-chart-5",
    tint: "bg-chart-5/12 text-chart-5",
  },
  {
    id: "payment",
    letter: "P",
    label: "Payment",
    description: "Delivered — cash still to collect",
    stallDays: 30,
    color: "bg-chart-3",
    tint: "bg-chart-3/12 text-chart-3",
  },
];

export const SPANCOP_MAP: Record<SpancopStage, SpancopDefinition> =
  Object.fromEntries(
    SPANCOP_STAGES.map((stage) => [stage.id, stage]),
  ) as Record<SpancopStage, SpancopDefinition>;

export const SPANCOP_ORDER: SpancopStage[] = SPANCOP_STAGES.map((s) => s.id);

/** What the engine knows about a company when computing its stage. */
export type SpancopSignals = {
  profileComplete: boolean;
  activityCount: number;
  openDealCount: number;
  /** Outcome of the most recently closed deal. */
  lastClosedDealOutcome?: "won" | "lost";
  hasPurchaseOrder: boolean;
  /** Delivered but cash not yet collected. */
  awaitingPayment: boolean;
  hasEverOrdered: boolean;
};

export type SpancopSuggestion = {
  stage: SpancopStage;
  reason: string;
};

/**
 * Compute the stage a company *should* be at.
 *
 * Rules are evaluated top-down; the first match wins. Rule 1 sits at the top
 * deliberately: while ANY deal is open the company stays at Negotiate, no
 * matter what else is true.
 */
export function suggestSpancopStage(
  signals: SpancopSignals,
): SpancopSuggestion {
  /*
    Order of precedence: FURTHEST POINT WINS.

    An open enquiry used to outrank everything, which meant a customer who
    owed money but sent a fresh query was dragged back to Negotiate — and
    Close, Order and Payment could never fill up for anyone who kept buying.

    Money already committed now outranks money merely hoped for: delivered
    goods awaiting payment, then a purchase order in hand, then an open
    enquiry. The new enquiry is not lost — it is still on the deal board,
    which is where deals belong.
  */

  // 1. Delivered, cash outstanding. The strongest claim on your attention.
  if (signals.awaitingPayment) {
    return { stage: "payment", reason: "Delivered — payment outstanding" };
  }

  // 2. PO received, not yet delivered.
  if (signals.hasPurchaseOrder) {
    return { stage: "order", reason: "Purchase order received" };
  }

  // 3. Any open deal.
  if (signals.openDealCount > 0) {
    return {
      stage: "negotiate",
      reason:
        signals.openDealCount === 1
          ? "1 open deal"
          : `${signals.openDealCount} open deals`,
    };
  }

  // 4. Won, but no PO yet.
  if (signals.lastClosedDealOutcome === "won") {
    return { stage: "close", reason: "Last deal won — awaiting PO" };
  }

  // 5. Known customer with no live opportunity: the resting state.
  //    Covers a lost deal, a completed cycle, or simple follow-up.
  if (signals.activityCount > 0 || signals.hasEverOrdered) {
    if (signals.lastClosedDealOutcome === "lost") {
      return { stage: "approach", reason: "Last deal lost — relationship open" };
    }
    if (signals.hasEverOrdered) {
      return { stage: "approach", reason: "Existing customer between deals" };
    }
    return {
      stage: "approach",
      reason:
        signals.activityCount === 1
          ? "1 activity logged"
          : `${signals.activityCount} activities logged`,
    };
  }

  // 6. Qualified on paper but never contacted.
  if (signals.profileComplete) {
    return { stage: "prospect", reason: "Profile complete, no contact yet" };
  }

  // 7. Default.
  return { stage: "suspect", reason: "No contact recorded" };
}

/** One entry in a company's stage history — the basis of period-flow reports. */
export type StageTransition = {
  id: string;
  companyId: string;
  from: SpancopStage | null;
  to: SpancopStage;
  /** How the move happened. */
  trigger: "manual" | "accepted-suggestion" | "seed";
  reason: string;
  at: string;
  by: string;
};

export type ApproachAlert = {
  kind: "not-converting" | "reorder-gap";
  label: string;
  detail: string;
};

/**
 * Approach is where every known customer rests, so a flat "stuck in Approach"
 * warning would fire constantly. Branch on order history instead:
 *
 *  - never ordered  → they are not converting
 *  - has ordered    → they are going quiet (protects revenue)
 */
export function approachAlert(
  signals: Pick<SpancopSignals, "hasEverOrdered">,
  daysInStage: number,
  daysSinceLastOrder: number | null,
): ApproachAlert | null {
  if (signals.hasEverOrdered) {
    if (daysSinceLastOrder !== null && daysSinceLastOrder >= 60) {
      return {
        kind: "reorder-gap",
        label: "Reorder gap",
        detail: `No order in ${daysSinceLastOrder} days`,
      };
    }
    return null;
  }
  if (daysInStage >= 30) {
    return {
      kind: "not-converting",
      label: "Not converting",
      detail: `In Approach ${daysInStage} days, never ordered`,
    };
  }
  return null;
}

/** Generic stalled check for the non-Approach stages. */
export function isStalled(stage: SpancopStage, daysInStage: number) {
  const def = SPANCOP_MAP[stage];
  if (!def.stallDays) return false;
  if (stage === "approach") return false; // handled by approachAlert
  return daysInStage >= def.stallDays;
}

/**
 * What deleting one activity would do to a company's SPANCOP stage.
 *
 * Deleting a journal entry is not a neutral act: the ladder reads
 * `activityCount`, so removing a company's only logged contact silently drops
 * it from Approach back to Prospect or Suspect. The confirmation dialog names
 * that consequence instead of letting it happen quietly.
 *
 * Returns null when nothing would move — the common case, and the dialog
 * stays short.
 */
export function stageAfterDelete(
  signals: SpancopSignals,
  currentStage: SpancopStage,
): { from: SpancopStage; to: SpancopStage } | null {
  if (signals.activityCount <= 0) return null;

  const after = suggestSpancopStage({
    ...signals,
    activityCount: signals.activityCount - 1,
  });

  // Only warn about a real move, and only when today's stage is the one the
  // engine put the company at. A manually placed stage is the user's own
  // decision and deleting an entry does not override it.
  const now = suggestSpancopStage(signals);
  if (now.stage !== currentStage) return null;
  if (after.stage === currentStage) return null;

  return { from: currentStage, to: after.stage };
}

/* ------------------------------------------------------------------ */
/* Company signals derived from deals                                  */
/* ------------------------------------------------------------------ */

/**
 * Roll a customer's deals up into the two flags the ladder reads.
 *
 * These used to be stored on the company and written by nobody, so Order and
 * Payment were permanently empty. Deriving them means the flags can never
 * drift out of step with the deals they describe.
 */
export function fulfilmentSignals(
  deals: {
    stage: string;
    fulfilment: {
      poNumber: string | null;
      deliveredAt: string | null;
      paidAt: string | null;
    };
  }[],
) {
  const won = deals.filter((d) => d.stage === "won");

  return {
    // Shipped and not settled — the customer owes money.
    awaitingPayment: won.some(
      (d) => d.fulfilment.deliveredAt !== null && d.fulfilment.paidAt === null,
    ),
    // PO in hand but nothing shipped yet.
    hasPurchaseOrder: won.some(
      (d) => d.fulfilment.poNumber !== null && d.fulfilment.deliveredAt === null,
    ),
    // Any completed cycle, ever.
    hasEverOrdered: won.some((d) => d.fulfilment.paidAt !== null),
  };
}
