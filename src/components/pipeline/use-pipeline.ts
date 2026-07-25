"use client";

import * as React from "react";
import { DEALS, type Deal, type DealPriority } from "@/lib/deals";
import {
  PIPELINE_STAGES,
  STAGE_MAP,
  isOpenStage,
  type DealStage,
} from "@/lib/pipeline";
import { useCurrency } from "@/components/providers/currency-provider";

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

export type UndoState = {
  dealId: string;
  dealTitle: string;
  fromStage: DealStage;
  toStage: DealStage;
} | null;

export function usePipeline() {
  const { display, toDisplay } = useCurrency();
  const [deals, setDeals] = React.useState<Deal[]>(DEALS);
  const [filters, setFilters] = React.useState<PipelineFilters>(EMPTY_FILTERS);
  const [undo, setUndo] = React.useState<UndoState>(null);
  const undoTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Move a deal to a new stage, syncing its probability to the stage default. */
  const moveDeal = React.useCallback(
    (dealId: string, toStage: DealStage, options?: { silent?: boolean }) => {
      setDeals((current) => {
        const deal = current.find((d) => d.id === dealId);
        if (!deal || deal.stage === toStage) return current;

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

        return current.map((d) =>
          d.id === dealId
            ? {
                ...d,
                stage: toStage,
                // Manual overrides are dropped so the new stage default applies.
                probability: isOpenStage(toStage)
                  ? null
                  : STAGE_MAP[toStage].probability,
                lastActivityAt: new Date().toISOString(),
              }
            : d,
        );
      });
    },
    [],
  );

  const undoMove = React.useCallback(() => {
    if (!undo) return;
    moveDeal(undo.dealId, undo.fromStage, { silent: true });
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [undo, moveDeal]);

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
        !`${deal.title} ${deal.company} ${deal.contact} ${deal.city} ${deal.id}`
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
        const daysIdle =
          (Date.now() - new Date(deal.lastActivityAt).getTime()) / 86_400_000;
        if (daysIdle <= def.rotDays) return false;
      }
      return true;
    });
  }, [deals, filters]);

  /** Deals grouped into board columns, in stage order. */
  const columns = React.useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => {
        const stageDeals = filtered.filter((deal) => deal.stage === stage.id);
        const total = stageDeals.reduce(
          (sum, deal) => sum + toDisplay(deal.value, deal.currency),
          0,
        );
        const weighted = stageDeals.reduce((sum, deal) => {
          const probability = deal.probability ?? STAGE_MAP[deal.stage].probability;
          return sum + toDisplay(deal.value, deal.currency) * (probability / 100);
        }, 0);
        return { stage, deals: stageDeals, total, weighted };
      }),
    [filtered, toDisplay],
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

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    filters.owners.length +
    filters.priorities.length +
    (filters.rottingOnly ? 1 : 0);

  return {
    deals,
    filtered,
    columns,
    stats,
    filters,
    setFilters,
    resetFilters: () => setFilters(EMPTY_FILTERS),
    activeFilterCount,
    moveDeal,
    undo,
    undoMove,
    dismissUndo,
    displayCurrency: display,
  };
}
