/**
 * Pipeline stage model.
 *
 * Stage order is defined by the business:
 *   Lead → Qualified → Quotation → Negotiation → Sampling → Won / Lost
 *
 * Sampling sits AFTER negotiation on purpose: commercial terms are agreed
 * first, then samples go out for the chef's / F&B manager's final sign-off
 * before the contract is awarded.
 */

export type DealStage =
  | "lead"
  | "qualified"
  | "quotation"
  | "negotiation"
  | "sampling"
  | "won"
  | "lost";

export type StageDefinition = {
  id: DealStage;
  label: string;
  shortLabel: string;
  description: string;
  /** Default win probability applied when a deal enters this stage. */
  probability: number;
  /** Days after which a deal in this stage is considered stalled. */
  rotDays: number;
  /** Tailwind bg-* class for dots and bars. */
  color: string;
  /** CSS var for charts. */
  chartColor: string;
  /** Text/tint classes for the column header chip. */
  tint: string;
};

/** Open stages, in board order. */
export const PIPELINE_STAGES: StageDefinition[] = [
  {
    id: "lead",
    label: "Lead",
    shortLabel: "Lead",
    description: "New enquiry, not yet verified",
    probability: 10,
    rotDays: 14,
    color: "bg-chart-4",
    chartColor: "var(--color-chart-4)",
    tint: "bg-chart-4/12 text-chart-4",
  },
  {
    id: "qualified",
    label: "Qualified",
    shortLabel: "Qualified",
    description: "Budget, need and decision maker confirmed",
    probability: 25,
    rotDays: 14,
    color: "bg-chart-3",
    chartColor: "var(--color-chart-3)",
    tint: "bg-chart-3/12 text-chart-3",
  },
  {
    id: "quotation",
    label: "Quotation",
    shortLabel: "Quote",
    description: "Formal pricing issued to the customer",
    probability: 45,
    rotDays: 10,
    color: "bg-chart-2",
    chartColor: "var(--color-chart-2)",
    tint: "bg-chart-2/12 text-chart-2",
  },
  {
    id: "negotiation",
    label: "Negotiation",
    shortLabel: "Nego",
    description: "Rates, credit terms and volumes under discussion",
    probability: 65,
    rotDays: 10,
    color: "bg-chart-1",
    chartColor: "var(--color-chart-1)",
    tint: "bg-chart-1/12 text-chart-1",
  },
  {
    id: "sampling",
    label: "Sampling",
    shortLabel: "Sampling",
    description: "Samples with the chef for final approval",
    probability: 80,
    rotDays: 7,
    color: "bg-chart-5",
    chartColor: "var(--color-chart-5)",
    tint: "bg-chart-5/12 text-chart-5",
  },
];

export const CLOSED_STAGES: StageDefinition[] = [
  {
    id: "won",
    label: "Won",
    shortLabel: "Won",
    description: "Contract awarded",
    probability: 100,
    rotDays: 0,
    color: "bg-success",
    chartColor: "var(--color-success)",
    tint: "bg-success/12 text-success",
  },
  {
    id: "lost",
    label: "Lost",
    shortLabel: "Lost",
    description: "Closed without an award",
    probability: 0,
    rotDays: 0,
    color: "bg-destructive",
    chartColor: "var(--color-destructive)",
    tint: "bg-destructive/12 text-destructive",
  },
];

export const ALL_STAGES: StageDefinition[] = [
  ...PIPELINE_STAGES,
  ...CLOSED_STAGES,
];

export const STAGE_MAP: Record<DealStage, StageDefinition> = Object.fromEntries(
  ALL_STAGES.map((stage) => [stage.id, stage]),
) as Record<DealStage, StageDefinition>;

export const STAGE_ORDER: DealStage[] = ALL_STAGES.map((s) => s.id);

export function isOpenStage(stage: DealStage) {
  return stage !== "won" && stage !== "lost";
}

/** A deal is "rotting" when untouched longer than its stage allows. */
export function isRotting(stage: DealStage, lastActivityIso: string) {
  const def = STAGE_MAP[stage];
  if (!def || !isOpenStage(stage)) return false;
  const days = (Date.now() - new Date(lastActivityIso).getTime()) / 86_400_000;
  return days > def.rotDays;
}

export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
