"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Undo2, X, XCircle } from "lucide-react";
import type { Deal } from "@/lib/deals";
import { STAGE_MAP, type DealStage } from "@/lib/pipeline";
import { usePipeline } from "./use-pipeline";
import { BoardColumn } from "./board-column";
import { DealCardContent } from "./deal-card";
import { DealDrawer } from "./deal-drawer";
import { DealList } from "./deal-list";
import { PipelineToolbar } from "./pipeline-toolbar";
import { useCurrency } from "@/components/providers/currency-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PipelineBoard() {
  const {
    filtered,
    visibleDeals,
    columns,
    stats,
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    moveDeal,
    undo,
    undoMove,
    dismissUndo,
    outcomeView,
    toggleOutcomeView,
  } = usePipeline();
  const { format } = useCurrency();

  const [view, setView] = React.useState<"board" | "list">("board");
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<Deal | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDeal((event.active.data.current?.deal as Deal) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;

    // Dropped on a column, or on a card inside a column.
    const overStage =
      (over.data.current?.stageId as DealStage | undefined) ??
      (over.data.current?.deal as Deal | undefined)?.stage;
    if (!overStage) return;

    moveDeal(String(active.id), overStage);
  };

  const openDeal = React.useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setDrawerOpen(true);
  }, []);

  // Keep the open drawer in sync when its deal moves stage.
  const liveSelected = selectedDeal
    ? (filtered.find((d) => d.id === selectedDeal.id) ?? selectedDeal)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Summary — two headline tiles, then a 2×2 block of closed-deal metrics */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryTile
          label="Open pipeline"
          value={format(stats.openValue, { compact: true })}
          hint={`${stats.openCount} ${stats.openCount === 1 ? "deal" : "deals"}`}
        />
        <SummaryTile
          label="Weighted forecast"
          value={format(stats.weighted, { compact: true })}
          hint="Probability adjusted"
        />

        {/*
          Closed-deal metrics, paired so value sits above its rate:
            Closed won | Win rate
            Deal lost  | Loss rate
        */}
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <SummaryTile
            compact
            label="Closed won"
            value={format(stats.wonValue, { compact: true })}
            hint={
              stats.wonCount
                ? outcomeView === "won"
                  ? "Viewing won deals · tap to exit"
                  : `${stats.wonCount} ${stats.wonCount === 1 ? "deal" : "deals"} · tap to view`
                : "No won deals"
            }
            tone="positive"
            onClick={
              stats.wonCount ? () => toggleOutcomeView("won") : undefined
            }
            active={outcomeView === "won"}
          />
          <SummaryTile
            compact
            label="Win rate"
            value={`${stats.winRate}%`}
            hint={
              stats.closedCount
                ? `${stats.wonCount}W / ${stats.lostCount}L`
                : "No closed deals"
            }
            tone="positive"
          />
          <SummaryTile
            compact
            label="Deal lost"
            value={format(stats.lostValue, { compact: true })}
            hint={
              stats.lostCount
                ? outcomeView === "lost"
                  ? "Viewing lost deals · tap to exit"
                  : `${stats.lostCount} ${stats.lostCount === 1 ? "deal" : "deals"} · tap to view`
                : "No lost deals"
            }
            tone="negative"
            onClick={
              stats.lostCount ? () => toggleOutcomeView("lost") : undefined
            }
            active={outcomeView === "lost"}
          />
          <SummaryTile
            compact
            label="Loss rate"
            value={`${stats.lossRate}%`}
            hint={
              stats.closedCount
                ? `${stats.lostCount} of ${stats.closedCount} closed`
                : "No closed deals"
            }
            tone="negative"
          />
        </div>
      </div>

      <PipelineToolbar
        filters={filters}
        setFilters={setFilters}
        activeFilterCount={activeFilterCount}
        resetFilters={resetFilters}
        view={view}
        setView={setView}
      />

      {/* Outcome-view banner — makes it unmistakable the board is filtered */}
      <AnimatePresence initial={false}>
        {outcomeView !== "open" && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5",
                outcomeView === "won"
                  ? "border-success/40 bg-success/[0.07]"
                  : "border-destructive/40 bg-destructive/[0.07]",
              )}
            >
              {outcomeView === "won" ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <XCircle className="size-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">
                  Showing {outcomeView === "won" ? "won" : "lost"} deals only
                </span>
                <span className="ml-1.5 text-muted-foreground">
                  · placed in the stage each deal was{" "}
                  {outcomeView === "won" ? "won" : "lost"} from
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleOutcomeView(outcomeView)}
                className="shrink-0"
              >
                <X />
                Back to pipeline
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view === "board" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDeal(null)}
        >
          <div className="-mx-4 min-h-0 flex-1 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-6 sm:px-6">
            <div className="flex h-full min-h-[420px] gap-3">
              {columns.map((column) => (
                <BoardColumn
                  key={column.stage.id}
                  stage={column.stage}
                  deals={column.deals}
                  outcomeView={outcomeView}
                  total={column.total}
                  weighted={column.weighted}
                  onOpenDeal={openDeal}
                  onAddDeal={() => {}}
                />
              ))}
            </div>
          </div>

          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
            {activeDeal ? (
              <div className="w-[268px] sm:w-[290px]">
                <DealCardContent deal={activeDeal} dragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <DealList deals={visibleDeals} onOpenDeal={openDeal} />
      )}

      <DealDrawer
        deal={liveSelected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onMove={(id, stage) => moveDeal(id, stage)}
      />

      {/* Undo toast */}
      <AnimatePresence>
        {undo && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="safe-bottom fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-float)] lg:bottom-6"
          >
            <div className="min-w-0 flex-1 text-sm">
              <span className="truncate font-medium">{undo.dealTitle}</span>
              <span className="block text-xs text-muted-foreground">
                Moved to {STAGE_MAP[undo.toStage].label}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={undoMove}>
              <Undo2 />
              Undo
            </Button>
            <button
              onClick={dismissUndo}
              aria-label="Dismiss"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone = "neutral",
  compact = false,
  onClick,
  active = false,
}: {
  label: string;
  value: string;
  hint: string;
  /** Tints the value so won/lost metrics are scannable at a glance. */
  tone?: "neutral" | "positive" | "negative";
  /** Denser padding/type for the 2×2 block so it matches the tall tiles. */
  compact?: boolean;
  /** Makes the tile a toggle that reveals its deals on the board. */
  onClick?: () => void;
  active?: boolean;
}) {
  const interactive = Boolean(onClick);

  return (
    <Card
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-pressed": active,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            },
          }
        : {})}
      className={cn(
        "flex flex-col justify-center",
        compact ? "p-3" : "p-3.5",
        interactive &&
          "cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
        active &&
          tone === "positive" &&
          "border-success/60 bg-success/[0.06] shadow-[var(--shadow-soft)]",
        active &&
          tone === "negative" &&
          "border-destructive/60 bg-destructive/[0.06] shadow-[var(--shadow-soft)]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 font-medium text-muted-foreground",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        <span className="truncate">{label}</span>
        {interactive && (
          <ChevronDown
            className={cn(
              "size-3 shrink-0 transition-transform duration-200",
              active && "rotate-180",
              tone === "positive" && active && "text-success",
              tone === "negative" && active && "text-destructive",
            )}
          />
        )}
      </div>
      <div
        className={cn(
          "mt-0.5 font-semibold tabular-nums",
          compact ? "text-base sm:text-lg" : "mt-1 text-lg sm:text-xl",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "truncate text-muted-foreground",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {hint}
      </div>
    </Card>
  );
}
