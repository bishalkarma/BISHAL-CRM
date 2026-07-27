"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Building2, CalendarClock, GripVertical } from "lucide-react";
import type { Deal } from "@/lib/deals";
import { STAGE_MAP, isRotting, daysSince } from "@/lib/pipeline";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/components/providers/currency-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials, relativeTime } from "@/lib/utils";

const PRIORITY_BAR: Record<Deal["priority"], string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground/40",
};

export function DealCardContent({
  deal,
  dragging,
  onOpen,
}: {
  deal: Deal;
  dragging?: boolean;
  onOpen?: (deal: Deal) => void;
}) {
  const { display, toDisplay, format } = useCurrency();
  const rotting = isRotting(deal.stage, deal.lastActivityAt);
  const probability = deal.probability ?? STAGE_MAP[deal.stage].probability;
  const isForeign = deal.currency !== display;

  return (
    <div
      onClick={() => onOpen?.(deal)}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-[var(--shadow-soft)] transition-all duration-200",
        dragging
          ? "rotate-[1.5deg] scale-[1.02] shadow-[var(--shadow-float)]"
          : "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-card)]",
      )}
    >
      {/* Priority accent rail */}
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          PRIORITY_BAR[deal.priority],
        )}
      />

      <div className="flex items-start gap-2 pl-1.5">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 break-words text-sm font-medium leading-snug">
            {deal.title}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{deal.company}</span>
          </div>
        </div>
        {rotting && (
          <span
            title={`No activity for ${daysSince(deal.lastActivityAt)} days`}
            className="flex size-5 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning"
          >
            <AlertTriangle className="size-3" />
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2 pl-1.5">
        <span className="text-[15px] font-semibold tabular-nums">
          {format(toDisplay(deal.value, deal.currency), { compact: true })}
        </span>
        {isForeign && (
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
            {CURRENCIES[deal.currency].symbol}{" "}
            {new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(deal.value)}
          </span>
        )}
      </div>

      {/* Probability meter */}
      <div className="mt-2 flex items-center gap-2 pl-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${probability}%` }}
          />
        </div>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {probability}%
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 pl-1.5">
        <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3 shrink-0" />
          <span className="truncate">
            {relativeTime(deal.expectedCloseDate)}
          </span>
        </span>
        <Avatar className="size-5 shrink-0">
          <AvatarFallback className="bg-accent/12 text-[9px] text-accent">
            {initials(deal.owner)}
          </AvatarFallback>
        </Avatar>
      </div>

      {deal.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pl-1.5">
          {deal.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function SortableDealCard({
  deal,
  onOpen,
}: {
  deal: Deal;
  onOpen?: (deal: Deal) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative touch-manipulation", isDragging && "opacity-40")}
    >
      {/* Drag handle — keeps card body clickable and lets the board scroll on touch */}
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag ${deal.title}`}
        className="absolute right-1 top-1 z-10 flex size-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/col:opacity-100 active:cursor-grabbing sm:size-6"
      >
        <GripVertical className="size-3.5" />
      </button>
      <DealCardContent deal={deal} onOpen={onOpen} />
    </div>
  );
}
