"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Deal } from "@/lib/deals";
import { STAGE_MAP, isRotting } from "@/lib/pipeline";
import { useCurrency } from "@/components/providers/currency-provider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials, relativeTime } from "@/lib/utils";

/** Compact list view — the mobile-friendly alternative to the board. */
export function DealList({
  deals,
  onOpenDeal,
}: {
  deals: Deal[];
  onOpenDeal: (deal: Deal) => void;
}) {
  const { toDisplay, format } = useCurrency();

  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        No deals match your filters.
      </div>
    );
  }

  const sorted = [...deals].sort(
    (a, b) =>
      toDisplay(b.value, b.currency) - toDisplay(a.value, a.currency),
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card scrollbar-thin">
      <div className="min-w-[720px]">
      {/* Desktop header */}
      <div className="hidden border-b border-border bg-secondary/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[minmax(0,2.2fr)_130px_120px_110px_90px]">
        <span>Deal</span>
        <span>Stage</span>
        <span className="text-right">Value</span>
        <span className="text-right">Closing</span>
        <span className="text-right">Owner</span>
      </div>

      <ul className="divide-y divide-border">
        {sorted.map((deal, index) => {
          const stage = STAGE_MAP[deal.stage];
          const rotting = isRotting(deal.stage, deal.lastActivityAt);
          return (
            <motion.li
              key={deal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: Math.min(index * 0.03, 0.3) }}
            >
              <button
                onClick={() => onOpenDeal(deal)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-secondary/50 md:grid md:grid-cols-[minmax(0,2.2fr)_130px_120px_110px_90px] md:items-center md:gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {deal.title}
                    </span>
                    {rotting && (
                      <AlertTriangle className="size-3.5 shrink-0 text-warning" />
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {deal.company} · {deal.city}
                  </div>
                </div>

                {/* Mobile meta row */}
                <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
                  <Badge className={cn("gap-1.5", stage.tint)}>
                    <span className={cn("size-1.5 rounded-full", stage.color)} />
                    {stage.label}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">
                    {format(toDisplay(deal.value, deal.currency), {
                      compact: true,
                    })}
                  </span>
                </div>

                <div className="hidden md:block">
                  <Badge className={cn("gap-1.5", stage.tint)}>
                    <span className={cn("size-1.5 rounded-full", stage.color)} />
                    {stage.label}
                  </Badge>
                </div>
                <div className="hidden text-right text-sm font-semibold tabular-nums md:block">
                  {format(toDisplay(deal.value, deal.currency), {
                    compact: true,
                  })}
                </div>
                <div className="hidden text-right text-xs text-muted-foreground md:block">
                  {relativeTime(deal.expectedCloseDate)}
                </div>
                <div className="hidden justify-end md:flex">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-accent/12 text-[9px] text-accent">
                      {initials(deal.owner)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>
      </div>
    </div>
  );
}
