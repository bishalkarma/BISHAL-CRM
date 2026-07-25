"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Deal } from "@/lib/deals";
import type { StageDefinition } from "@/lib/pipeline";
import { SortableDealCard } from "./deal-card";
import { useCurrency } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BoardColumn({
  stage,
  deals,
  total,
  weighted,
  onOpenDeal,
  onAddDeal,
}: {
  stage: StageDefinition;
  deals: Deal[];
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

        {deals.length === 0 && (
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
      </div>
    </div>
  );
}
