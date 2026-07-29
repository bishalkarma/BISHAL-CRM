"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useData } from "@/components/providers/data-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  PIPELINE_STAGES,
  STAGE_MAP,
  isRotting,
  daysSince,
  type DealStage,
} from "@/lib/pipeline";
import type { Deal } from "@/lib/deals";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import {
  DetailDialog,
  type DetailRow,
} from "@/components/dashboard/detail-dialog";

const FUNNEL_STAGES: DealStage[] = PIPELINE_STAGES.map((stage) => stage.id);

/**
 * Deals are passed in rather than read here, so the funnel answers the same
 * period question as the rest of the dashboard. Reading the store directly
 * meant it silently showed all time while every tile beside it showed a month.
 */
export function PipelineFunnel({
  deals,
  periodLabel = "All time",
}: {
  deals?: Deal[];
  periodLabel?: string;
}) {
  const { deals: storeDeals } = useData();
  const { toDisplay, format } = useCurrency();
  const allDeals = deals ?? storeDeals;

  /** Which stage column the read-only pop-up is showing, if any. */
  const [openStage, setOpenStage] = React.useState<DealStage | null>(null);

  const rows = FUNNEL_STAGES.map((stage) => {
    const stageDeals = allDeals.filter((deal) => deal.stage === stage);
    return {
      stage,
      deals: stageDeals,
      count: stageDeals.length,
      value: stageDeals.reduce(
        (sum, deal) => sum + toDisplay(deal.value, deal.currency),
        0,
      ),
    };
  });

  const max = Math.max(...rows.map((row) => row.value), 1);
  const active = rows.find((row) => row.stage === openStage) ?? null;

  /* Biggest first: a stage pop-up answers "where is my money", not "what is
     newest". Idle deals carry the same rotting flag the board uses. */
  const detailRows: DetailRow[] = React.useMemo(() => {
    if (!active) return [];
    return [...active.deals]
      .sort(
        (a, b) =>
          toDisplay(b.value, b.currency) - toDisplay(a.value, a.currency),
      )
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        meta: `${deal.company} · ${deal.owner}`,
        value: format(toDisplay(deal.value, deal.currency), { compact: true }),
        hint: `closes ${new Date(deal.expectedCloseDate).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "short" },
        )}`,
        flag: isRotting(deal.stage, deal.lastActivityAt)
          ? `${daysSince(deal.lastActivityAt)} days idle`
          : undefined,
      }));
  }, [active, toDisplay, format]);

  return (
    <>
      <div className="space-y-3.5">
        {rows.map((row, index) => (
          <button
            key={row.stage}
            type="button"
            onClick={() => setOpenStage(row.stage)}
            className="block w-full rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-secondary/60"
            aria-label={`${STAGE_MAP[row.stage].label} — ${row.count} deals`}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span
                  className={`size-2 shrink-0 rounded-full ${STAGE_MAP[row.stage].color}`}
                />
                <span className="truncate">{STAGE_MAP[row.stage].label}</span>
                <span className="shrink-0 text-xs font-normal text-muted-foreground">
                  {row.count} {row.count === 1 ? "deal" : "deals"}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                <AnimatedNumber
                  value={row.value}
                  format={(v) => format(v, { compact: true })}
                />
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                transition={{
                  duration: 0.85,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`h-full rounded-full ${STAGE_MAP[row.stage].color}`}
              />
            </div>
          </button>
        ))}
      </div>

      <DetailDialog
        open={active !== null}
        onOpenChange={(next) => !next && setOpenStage(null)}
        title={active ? STAGE_MAP[active.stage].label : ""}
        summary={
          active
            ? `${active.count} ${active.count === 1 ? "deal" : "deals"} · ${format(
                active.value,
                { compact: true },
              )} · ${periodLabel}`
            : ""
        }
        rows={detailRows}
        emptyLabel="No deals in this stage for the selected period."
      />
    </>
  );
}
