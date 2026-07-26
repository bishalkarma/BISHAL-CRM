"use client";

import * as React from "react";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { STAGE_MAP } from "@/lib/pipeline";
import type { Deal } from "@/lib/deals";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, relativeTime } from "@/lib/utils";

/** Manual probability wins; otherwise use the stage default. */
const probabilityOf = (deal: Deal) =>
  deal.probability ?? STAGE_MAP[deal.stage].probability;

export function DealsTable() {
  const { deals } = useData();
  const OPEN_DEALS = React.useMemo(
    () =>
      deals
        .filter((deal) => deal.stage !== "won" && deal.stage !== "lost")
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [deals],
  );

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {OPEN_DEALS.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="rounded-xl border border-border p-3 transition-colors active:bg-secondary/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{deal.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {deal.company} · {deal.city}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrency(deal.value)}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <Badge variant="outline" className="gap-1.5">
                <span
                  className={`size-1.5 rounded-full ${STAGE_MAP[deal.stage].color}`}
                />
                {STAGE_MAP[deal.stage].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Closes {relativeTime(deal.expectedCloseDate)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2.5 font-semibold">Deal</th>
              <th className="pb-2.5 font-semibold">Stage</th>
              <th className="pb-2.5 text-right font-semibold">Value</th>
              <th className="hidden pb-2.5 font-semibold lg:table-cell">
                Confidence
              </th>
              <th className="hidden pb-2.5 text-right font-semibold md:table-cell">
                Closing
              </th>
            </tr>
          </thead>
          <tbody>
            {OPEN_DEALS.map((deal, index) => (
              <motion.tr
                key={deal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="group cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/50"
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{deal.title}</span>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {deal.company} · {deal.accountType}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
                    <span
                      className={`size-1.5 rounded-full ${STAGE_MAP[deal.stage].color}`}
                    />
                    {STAGE_MAP[deal.stage].label}
                  </Badge>
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {formatCurrency(deal.value)}
                </td>
                <td className="hidden py-3 pr-3 lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={probabilityOf(deal)}
                      className="h-1.5 w-20"
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {probabilityOf(deal)}%
                    </span>
                  </div>
                </td>
                <td className="hidden py-3 text-right text-xs text-muted-foreground md:table-cell">
                  {relativeTime(deal.expectedCloseDate)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
