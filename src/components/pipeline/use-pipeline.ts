"use client";

import * as React from "react";
import type { Deal, DealPriority } from "@/lib/deals";
import {
  closePeriods,
  currentRunDays,
  reopenPeriods,
  type LostReason,
} from "@/lib/deal-model";
import {
  PIPELINE_STAGES,
  STAGE_MAP,
  isOpenStage,
  type DealStage,
} from "@/lib/pipeline";
import { useCurrency } from "@/components/providers/currency-provider";
import { useData } from "@/components/providers/data-provider";

export type PipelineFilters = {
  query: string;
  owners: string[];
  priorities: DealPriority[];
  rottingOnly: boolean;
};

const EMPTY_FILTERS: PipelineFilters = {
  query: "",
  owners: [],
  priorities: [],
  rottingOnly: false,
};

/** Which set of deals the board is displaying. */
export type OutcomeView = "open" | "won" | "lost";

export type UndoState = {
  dealId: string;
  dealTitle: string;
  fromStage: DealStage;
  toStage: DealStage;
} | null;

export function usePipeline() {
  const { display, toDisplay } = useCurrency();
  // Deals come from the shared store so every change persists to Supabase.
  // A private useState here was why new deals vanished on refresh.
  const {
    deals,
    addDeal: addDealShared,
    updateDeal: updateDealShared,
  } = useData();
  const [filters, setFilters] = React.useState<PipelineFilters>(EMPTY_FILTERS);
  const [undo, setUndo] = React.useState<UndoState>(null);
  const undoTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Move a deal to a new stage, syncing its probability to the stage default. */
  /** Set when a drag lands on Lost — the reason prompt must resolve first. */
  const [pendingLost, setPendingLost] = React.useState<Deal | null>(null);

  const moveDeal = React.useCallback(
    (
      dealId: string,
      toStage: DealStage,
      options?: { silent?: boolean; lostReason?: LostReason; lostNote?: string },
    ) => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal || deal.stage === toStage) return;

      if (!options?.silent) {
        setUndo({
          dealId,
          dealTitle: deal.title,
          fromStage: deal.stage,
          toStage,
        });
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndo(null), 6000);
      }

      const nowIso = new Date().toISOString();
      const closing = !isOpenStage(toStage);
      const reopening = !isOpenStage(deal.stage) && isOpenStage(toStage);

      // Routed through the shared store so the stage change reaches Supabase.
      updateDealShared(dealId, {
        stage: toStage,
        // Ageing counts active days only: close the run when the deal closes,
        // start a fresh one when it is reopened.
        periods: closing
          ? closePeriods(deal.periods, nowIso)
          : reopening
            ? reopenPeriods(deal.periods, nowIso)
            : deal.periods,
        lostReason: toStage === "lost" ? options?.lostReason : undefined,
        lostNote: toStage === "lost" ? options?.lostNote : undefined,
        // Remember where a deal closed from so it can still be shown in that
        // column. Reopening a deal clears the marker.
        closedFromStage: isOpenStage(toStage)
          ? undefined
          : isOpenStage(deal.stage)
            ? deal.stage
            : deal.closedFromStage,
        // Manual overrides are dropped so the new stage default applies.
        probability: isOpenStage(toStage)
          ? null
          : STAGE_MAP[toStage].probability,
        lastActivityAt: nowIso,
      });
    },
    [deals, updateDealShared],
  );

  const undoMove = React.useCallback(() => {
    if (!undo) return;
    moveDeal(undo.dealId, undo.fromStage, { silent: true });
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [undo, moveDeal]);

  const addDeal = React.useCallback(
    (deal: Deal) => addDealShared(deal),
    [addDealShared],
  );

  const updateDeal = React.useCallback(
    (dealId: string, patch: Partial<Deal>) => updateDealShared(dealId, patch),
    [updateDealShared],
  );

  const dismissUndo = React.useCallback(() => {
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  React.useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  // ---- Filtering -----------------------------------------------------
  const filtered = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return deals.filter((deal) => {
      if (
        q &&
        !`${deal.title} ${deal.company} ${deal.city} ${deal.id} ${deal.lines
          .map((l) => `${l.product} ${l.brand}`)
          .join(" ")}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (filters.owners.length && !filters.owners.includes(deal.owner)) {
        return false;
      }
      if (
        filters.priorities.length &&
        !filters.priorities.includes(deal.priority)
      ) {
        return false;
      }
      if (filters.rottingOnly) {
        const def = STAGE_MAP[deal.stage];
        if (!isOpenStage(deal.stage)) return false;
        // Use the current active run so a reopened deal is not instantly red.
        const runDays = currentRunDays(deal.periods);
        const idle =
          (Date.now() - new Date(deal.lastActivityAt).getTime()) / 86_400_000;
        if (Math.min(runDays, idle) <= def.rotDays) return false;
      }
      return true;
    });
  }, [deals, filters]);

  /**
   * Which set of deals the board is currently showing.
   *
   *  "open" — the live pipeline (default)
   *  "won"  — ONLY won deals, placed in the stage they were won from
   *  "lost" — ONLY lost deals, placed in the stage they were lost from
   *
   * Tapping the "Closed won" / "Deal lost" tiles switches into that view;
   * tapping the active tile again returns to the open pipeline.
   */
  const [outcomeView, setOutcomeView] = React.useState<OutcomeView>("open");

  const toggleOutcomeView = React.useCallback((outcome: "won" | "lost") => {
    setOutcomeView((current) => (current === outcome ? "open" : outcome));
  }, []);

  /** Deals grouped into board columns, in stage order. */
  const columns = React.useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => {
        // In an outcome view the board shows only closed deals of that
        // outcome, positioned in the stage they closed from. Otherwise it
        // shows the live pipeline for this stage.
        const stageDeals =
          outcomeView === "open"
            ? filtered.filter((deal) => deal.stage === stage.id)
            : filtered.filter(
                (deal) =>
                  deal.stage === outcomeView &&
                  (deal.closedFromStage ?? "lead") === stage.id,
              );

        const total = stageDeals.reduce(
          (sum, deal) => sum + toDisplay(deal.value, deal.currency),
          0,
        );

        // Weighting only means something for open deals; a closed deal's
        // value is already realised, so the weighted figure mirrors the total.
        const weighted =
          outcomeView === "open"
            ? stageDeals.reduce((sum, deal) => {
                const probability =
                  deal.probability ?? STAGE_MAP[deal.stage].probability;
                return (
                  sum +
                  toDisplay(deal.value, deal.currency) * (probability / 100)
                );
              }, 0)
            : total;

        return { stage, deals: stageDeals, total, weighted };
      }),
    [filtered, toDisplay, outcomeView],
  );

  const stats = React.useMemo(() => {
    const open = filtered.filter((deal) => isOpenStage(deal.stage));
    const won = filtered.filter((deal) => deal.stage === "won");
    const lost = filtered.filter((deal) => deal.stage === "lost");
    const openValue = open.reduce(
      (sum, deal) => sum + toDisplay(deal.value, deal.currency),
      0,
    );
    const weighted = open.reduce((sum, deal) => {
      const probability = deal.probability ?? STAGE_MAP[deal.stage].probability;
      return sum + toDisplay(deal.value, deal.currency) * (probability / 100);
    }, 0);
    const wonValue = won.reduce(
      (sum, deal) => sum + toDisplay(deal.value, deal.currency),
      0,
    );
    const lostValue = lost.reduce(
      (sum, deal) => sum + toDisplay(deal.value, deal.currency),
      0,
    );

    // Win and loss rates are shares of *closed* deals, so they always sum
    // to 100% (rounding aside) and stay consistent with each other.
    const closed = won.length + lost.length;
    const winRate = closed ? Math.round((won.length / closed) * 100) : 0;

    return {
      openCount: open.length,
      openValue,
      weighted,
      wonValue,
      wonCount: won.length,
      lostValue,
      lostCount: lost.length,
      closedCount: closed,
      winRate,
      // Derived from winRate so the two tiles can never disagree.
      lossRate: closed ? 100 - winRate : 0,
    };
  }, [filtered, toDisplay]);

  /** Deals for the list view, honouring the current outcome view. */
  const visibleDeals = React.useMemo(
    () =>
      outcomeView === "open"
        ? filtered
        : filtered.filter((deal) => deal.stage === outcomeView),
    [filtered, outcomeView],
  );

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    filters.owners.length +
    filters.priorities.length +
    (filters.rottingOnly ? 1 : 0);

  return {
    deals,
    filtered,
    visibleDeals,
    columns,
    stats,
    filters,
    setFilters,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    activeFilterCount,
    moveDeal,
    pendingLost,
    setPendingLost,
    addDeal,
    updateDeal,
    undo,
    undoMove,
    dismissUndo,
    outcomeView,
    toggleOutcomeView,
    displayCurrency: display,
  };
}
