"use client";

import { motion } from "framer-motion";
import { useData } from "@/components/providers/data-provider";
import { PIPELINE_STAGES, STAGE_MAP, type DealStage } from "@/lib/pipeline";
import type { Deal } from "@/lib/deals";
import { formatCompactCurrency } from "@/lib/utils";

const FUNNEL_STAGES: DealStage[] = PIPELINE_STAGES.map((stage) => stage.id);

/**
 * Deals are passed in rather than read here, so the funnel answers the same
 * period question as the rest of the dashboard. Reading the store directly
 * meant it silently showed all time while every tile beside it showed a month.
 */
export function PipelineFunnel({ deals }: { deals?: Deal[] }) {
  const { deals: storeDeals } = useData();
  const allDeals = deals ?? storeDeals;
  const rows = FUNNEL_STAGES.map((stage) => {
    const deals = allDeals.filter((deal) => deal.stage === stage);
    return {
      stage,
      count: deals.length,
      value: deals.reduce((sum, deal) => sum + deal.value, 0),
    };
  });

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-3.5">
      {rows.map((row, index) => (
        <div key={row.stage}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span
                className={`size-2 rounded-full ${STAGE_MAP[row.stage].color}`}
              />
              {STAGE_MAP[row.stage].label}
              <span className="text-xs font-normal text-muted-foreground">
                {row.count} {row.count === 1 ? "deal" : "deals"}
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatCompactCurrency(row.value)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(row.value / max) * 100}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.85,
                delay: index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`h-full rounded-full ${STAGE_MAP[row.stage].color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
