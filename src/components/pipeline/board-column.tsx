"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckCircle2, Plus, XCircle } from "lucide-react";
import type { Deal } from "@/lib/deals";
import { STAGE_MAP, type StageDefinition } from "@/lib/pipeline";
import { SortableDealCard } from "./deal-card";
import { useCurrency } from "@/components/providers/currency-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BoardColumn({
  stage,
  deals,
  closedDeals = [],
  total,
  weighted,
  onOpenDeal,
  onAddDeal,
}: {
  stage: StageDefinition;
  deals: Deal[];
  /** Won/lost deals that closed from this stage, shown when revealed. */
  closedDeals?: Deal[];
  total: number;
  weighted: number;
  onOpenDeal: (deal: Deal) => void;
  onAddDeal: (stage: StageDefinition) => void;
}) {
  const { format } = useCurrency();
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stageId: stage.id },
  });

  return (
    <div className="group/col flex h-full w-[268px] shrink-0 flex-col sm:w-[290px]">
      {/* Column header */}
      <div className="mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", stage.color)} />
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="truncate text-sm font-semibold">{stage.label}</h3>
            </TooltipTrigger>
            <TooltipContent>{stage.description}</TooltipContent>
          </Tooltip>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {deals.length}
          </span>
          <button
            onClick={() => onAddDeal(stage)}
            aria-label={`Add deal to ${stage.label}`}
            className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/col:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 pl-4">
          <span className="text-sm font-semibold tabular-nums">
            {format(total, { compact: true })}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                · {format(weighted, { compact: true })} wtd
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Weighted forecast at {stage.probability}% stage probability
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl border border-dashed p-2 transition-colors duration-200",
          isOver
            ? "border-accent bg-accent/[0.06]"
            : "border-transparent bg-secondary/40",
        )}
      >
        <SortableContext
          items={deals.map((deal) => deal.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} onOpen={onOpenDeal} />
          ))}
        </SortableContext>

        {deals.length === 0 && closedDeals.length === 0 && (
          <button
            onClick={() => onAddDeal(stage)}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground",
              isOver && "border-accent text-accent",
            )}
          >
            <Plus className="size-4" />
            {isOver ? "Drop here" : "No deals"}
          </button>
        )}

        {/* Revealed closed deals — read-only, excluded from column totals */}
        <AnimatePresence initial={false}>
          {closedDeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pb-1.5 pt-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Closed here · {closedDeals.length}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {closedDeals.map((deal, index) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.26,
                      delay: index * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <ClosedDealCard deal={deal} onOpen={onOpenDeal} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Read-only card for a won/lost deal surfaced in the stage it closed from.
 * Deliberately flatter than an open deal card — not draggable, and tinted by
 * outcome so it can't be mistaken for live pipeline.
 */
function ClosedDealCard({
  deal,
  onOpen,
}: {
  deal: Deal;
  onOpen: (deal: Deal) => void;
}) {
  const { toDisplay, format } = useCurrency();
  const won = deal.stage === "won";
  const Icon = won ? CheckCircle2 : XCircle;

  return (
    <button
      onClick={() => onOpen(deal)}
      className={cn(
        "w-full rounded-xl border border-dashed p-2.5 text-left transition-all duration-200 hover:border-solid hover:shadow-[var(--shadow-soft)]",
        won
          ? "border-success/40 bg-success/[0.06] hover:border-success/70"
          : "border-destructive/40 bg-destructive/[0.06] hover:border-destructive/70",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            won ? "text-success" : "text-destructive",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-xs font-medium leading-snug">
            {deal.title}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="size-2.5 shrink-0" />
            <span className="truncate">{deal.company}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            won ? "text-success" : "text-destructive",
          )}
        >
          {format(toDisplay(deal.value, deal.currency), { compact: true })}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
              won
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {STAGE_MAP[deal.stage].label}
          </span>
          <Avatar className="size-4">
            <AvatarFallback className="bg-secondary text-[8px]">
              {initials(deal.owner)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {deal.lostReason && (
        <div className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
          {deal.lostReason}
        </div>
      )}
    </button>
  );
}
