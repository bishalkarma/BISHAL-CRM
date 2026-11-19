"use client";

import * as React from "react";
import { isClosedDeal, isOpenDeal, type Deal, type DealPriority } from "@/lib/deals";
import {
  currentRunDays,
  lineCommercialStatus,
  lostLineValue,
  potentialValue,
  wonValue,
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
import { fulfilmentSignals, suggestSpancopStage } from "@/lib/spancop";

export type PipelineFilters = {
  query: string;
  companyId: string;
  owners: string[];
  priorities: DealPriority[];
  rottingOnly: boolean;
};

const EMPTY_FILTERS: PipelineFilters = {
  query: "",
  companyId: "",
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
    companies,
    moveStage,
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

      // Dragging changes only the active customer-journey stage. Deal closure
      // is driven by every line reaching Won/Lost in the line-item tracker.
      updateDealShared(dealId, {
        stage: toStage,
        lifecycleStatus: "open",
        closedAt: null,
        closedFromStage: undefined,
        probability: null,
        lastActivityAt: nowIso,
      });

      /*
        Move the customer with the deal.

        This wire never existed: winning a deal wrote deals.stage and stopped,
        while the SPANCOP tile reads companies.spancop — so Close, Order and
        Payment could never fill up no matter how many deals were won.

        Only the customer's OTHER deals are considered, because this one has
        just changed and the store has not caught up yet.
      */
      const siblings = deals.filter(
        (d) => d.companyId === deal.companyId && d.id !== dealId,
      );
      const company = companies.find((c) => c.id === deal.companyId);
      if (company) {
        const suggestion = suggestSpancopStage({
          profileComplete: Boolean(company.email && company.remarks),
          activityCount: company.activityCount,
          openDealCount: siblings.filter((d) => isOpenStage(d.stage)).length +
            (isOpenStage(toStage) ? 1 : 0),
          lastClosedDealOutcome:
            toStage === "won" || toStage === "lost"
              ? toStage
              : company.lastClosedDealOutcome,
          ...fulfilmentSignals([
            ...siblings,
            { ...deal, stage: toStage },
          ]),
        });
        if (suggestion.stage !== company.spancop) {
          moveStage(
            deal.companyId,
            suggestion.stage,
            suggestion.reason,
            "automatic",
          );
        }
      }
    },
    [deals, companies, updateDealShared, moveStage],
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
      if (filters.companyId && deal.companyId !== filters.companyId) return false;
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
        if (!isOpenDeal(deal)) return false;
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
   *  "open" — active pipeline
   *  "won"  — closed opportunities containing Won lines
   *  "lost" — closed opportunities containing Lost lines
   * A mixed opportunity can appear in both outcome views.
   */
  const [outcomeView, setOutcomeView] = React.useState<OutcomeView>("open");

  const toggleOutcomeView = React.useCallback((outcome: "won" | "lost") => {
    setOutcomeView((current) => (current === outcome ? "open" : outcome));
  }, []);

  /** Deals grouped into board columns, in stage order. */
  const columns = React.useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => {
        // Outcome views show neutral Closed deals that contain at least one
        // matching line, grouped under the last active stage for context.
        const stageDeals = outcomeView === "open"
          ? filtered.filter((deal) => isOpenDeal(deal) && deal.stage === stage.id)
            : filtered.filter((deal) =>
              deal.stage === stage.id &&
              deal.lines.some((line) => lineCommercialStatus(line) === outcomeView),
            );

        const total = stageDeals.reduce((sum, deal) => {
          const amount = outcomeView === "open"
            ? potentialValue(deal.lines)
            : outcomeView === "won"
              ? wonValue(deal.lines)
              : lostLineValue(deal.lines);
          return sum + toDisplay(amount, deal.currency);
        }, 0);

        // Weighting only means something for open deals; a closed deal's
        // value is already realised, so the weighted figure mirrors the total.
        const weighted =
          outcomeView === "open"
            ? stageDeals.reduce((sum, deal) => {
                const probability =
                  deal.probability ?? STAGE_MAP[deal.stage].probability;
                return (
                  sum +
                  toDisplay(potentialValue(deal.lines), deal.currency) * (probability / 100)
                );
              }, 0)
            : total;

        return { stage, deals: stageDeals, total, weighted };
      }),
    [filtered, toDisplay, outcomeView],
  );

  const stats = React.useMemo(() => {
    const open = filtered.filter(isOpenDeal);
    const closedDeals = filtered.filter(isClosedDeal);
    const wonCount = filtered.reduce(
      (sum, deal) => sum + deal.lines.filter((line) => lineCommercialStatus(line) === "won").length,
      0,
    );
    const lostCount = filtered.reduce(
      (sum, deal) => sum + deal.lines.filter((line) => lineCommercialStatus(line) === "lost").length,
      0,
    );
    const openValue = open.reduce(
      (sum, deal) => sum + toDisplay(potentialValue(deal.lines), deal.currency),
      0,
    );
    const weighted = open.reduce((sum, deal) => {
      const probability = deal.probability ?? STAGE_MAP[deal.stage].probability;
      return sum + toDisplay(potentialValue(deal.lines), deal.currency) * (probability / 100);
    }, 0);
    const wonAmount = filtered.reduce(
      (sum, deal) => sum + toDisplay(wonValue(deal.lines), deal.currency),
      0,
    );
    const lostAmount = filtered.reduce(
      (sum, deal) => sum + toDisplay(lostLineValue(deal.lines), deal.currency),
      0,
    );
    const decidedItems = wonCount + lostCount;
    const winRate = decidedItems ? Math.round((wonCount / decidedItems) * 100) : 0;

  return {
    openCount: open.length,
      openValue,
      weighted,
      wonValue: wonAmount,
      wonCount,
      lostValue: lostAmount,
      lostCount,
      closedCount: closedDeals.length,
      winRate,
      lossRate: decidedItems ? 100 - winRate : 0,
    };
  }, [filtered, toDisplay]);

  /** Deals for the list view, filtered by line outcome when selected. */
  const visibleDeals = React.useMemo(
    () => outcomeView === "open"
      ? filtered.filter(isOpenDeal)
      : filtered.filter((deal) => deal.lines.some((line) => lineCommercialStatus(line) === outcomeView)),
    [filtered, outcomeView],
  );

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.companyId ? 1 : 0) +
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
