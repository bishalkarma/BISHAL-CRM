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
import { Undo2, X } from "lucide-react";
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
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
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
        <SummaryTile
          label="Closed won"
          value={format(stats.wonValue, { compact: true })}
          hint={`${stats.wonCount} ${stats.wonCount === 1 ? "deal" : "deals"}`}
          tone="positive"
        />
        <SummaryTile
          label="Deal lost"
          value={format(stats.lostValue, { compact: true })}
          hint={`${stats.lostCount} ${stats.lostCount === 1 ? "deal" : "deals"}`}
          tone="negative"
        />
        <SummaryTile
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

      <PipelineToolbar
        filters={filters}
        setFilters={setFilters}
        activeFilterCount={activeFilterCount}
        resetFilters={resetFilters}
        view={view}
        setView={setView}
      />

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
        <DealList deals={filtered} onOpenDeal={openDeal} />
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
}: {
  label: string;
  value: string;
  hint: string;
  /** Tints the value so won/lost metrics are scannable at a glance. */
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card className="p-3.5">
      <div className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums sm:text-xl",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </div>
      <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
    </Card>
  );
}
