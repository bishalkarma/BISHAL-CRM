"use client";

import * as React from "react";
import type { Activity } from "@/lib/activities";
import {
  daysInStage,
  daysSinceLastOrder,
  type BusinessType,
  type Company,
  type Emirate,
} from "@/lib/companies";
import {
  approachAlert,
  isStalled,
  suggestSpancopStage,
  fulfilmentSignals,
  type SpancopStage,
} from "@/lib/spancop";
import {
  buildDismissedSuggestion,
  clearDismissedSuggestion,
  isSuggestionDismissed,
  readDismissedSuggestions,
  saveDismissedSuggestionsBatch,
  subscribeDismissedSuggestions,
  type DismissedStageSuggestion,
  type DismissedSuggestionsMap,
} from "@/lib/spancop-dismissals";
import type { Deal } from "@/lib/deals";
import { useData } from "@/components/providers/data-provider";

export type CompanyFilters = {
  query: string;
  business: BusinessType[];
  emirates: Emirate[];
  stages: SpancopStage[];
  owners: string[];
  alertsOnly: boolean;
};

const EMPTY: CompanyFilters = {
  query: "",
  business: [],
  emirates: [],
  stages: [],
  owners: [],
  alertsOnly: false,
};

export type CompanyAlert = {
  kind: "not-converting" | "reorder-gap" | "stalled";
  label: string;
  detail: string;
};

/** Derives the alert (if any) for a company. */
export function alertFor(company: Company): CompanyAlert | null {
  const inStage = daysInStage(company);

  if (company.spancop === "approach") {
    const alert = approachAlert(
      { hasEverOrdered: company.hasEverOrdered },
      inStage,
      daysSinceLastOrder(company),
    );
    return alert
      ? { kind: alert.kind, label: alert.label, detail: alert.detail }
      : null;
  }

  if (isStalled(company.spancop, inStage)) {
    return {
      kind: "stalled",
      label: "Stalled",
      detail: `${inStage} days in ${company.spancop}`,
    };
  }
  return null;
}

/**
 * The stage the engine thinks a company should be at.
 *
 * `deals` is optional so existing callers keep working, but when it is given
 * the PO / delivery / payment flags are derived from the deals themselves
 * rather than trusting stored booleans that nothing ever wrote to.
 */
export function suggestionFor(company: Company, deals?: Deal[]) {
  const derived = deals
    ? fulfilmentSignals(deals.filter((d) => d.companyId === company.id))
    : null;

  return suggestSpancopStage({
    profileComplete: Boolean(company.email && company.remarks),
    activityCount: company.activityCount,
    openDealCount: company.openDealIds.length,
    lastClosedDealOutcome: company.lastClosedDealOutcome,
    hasPurchaseOrder: derived?.hasPurchaseOrder ?? company.hasPurchaseOrder,
    awaitingPayment: derived?.awaitingPayment ?? company.awaitingPayment,
    hasEverOrdered: derived?.hasEverOrdered ?? company.hasEverOrdered,
  });
}

/**
 * Client-synced map of dismissed stage suggestions persisted in localStorage.
 * Hydration-safe: starts empty during SSR/first paint and syncs on mount + changes.
 */
export function useDismissedSuggestions(): [
  DismissedSuggestionsMap,
  React.Dispatch<React.SetStateAction<DismissedSuggestionsMap>>,
] {
  const [dismissed, setDismissed] = React.useState<DismissedSuggestionsMap>({});

  React.useEffect(() => {
    setDismissed(readDismissedSuggestions());
    return subscribeDismissedSuggestions(() => {
      setDismissed(readDismissedSuggestions());
    });
  }, []);

  return [dismissed, setDismissed];
}

export function useCompanies() {
  const {
    companies,
    deals,
    activities,
    transitions,
    moveStage: moveStageShared,
    addCompany,
    addCompanies,
  } = useData();
  const [filters, setFilters] = React.useState<CompanyFilters>(EMPTY);
  /** Suggestions the user chose to keep in their current stage until a new activity is logged. */
  const [dismissed, setDismissed] = useDismissedSuggestions();

  const activitiesByCompany = React.useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      const bucket = map.get(activity.companyId);
      if (bucket) bucket.push(activity);
      else map.set(activity.companyId, [activity]);
    }
    return map;
  }, [activities]);

  /** Apply a stage change, clear any prior Keep lock, and write it to history. */
  const moveStage = React.useCallback(
    (
      companyId: string,
      to: SpancopStage,
      reason: string,
      trigger: "manual" | "accepted-suggestion" | "seed" = "manual",
    ) => {
      setDismissed(clearDismissedSuggestion(companyId));
      moveStageShared(companyId, to, reason, trigger);
    },
    [moveStageShared, setDismissed],
  );

  const dismissSuggestion = React.useCallback(
    (companyId: string, stage: SpancopStage) => {
      const company = companies.find((c) => c.id === companyId);
      if (!company) return;
      const customerActivities = activitiesByCompany.get(companyId) ?? [];
      const entry = buildDismissedSuggestion(
        company,
        stage,
        customerActivities,
      );
      setDismissed(saveDismissedSuggestionsBatch({ [companyId]: entry }));
    },
    [companies, activitiesByCompany, setDismissed],
  );

  const filtered = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return companies.filter((c) => {
      if (
        q &&
        !`${c.name} ${c.cluster ?? ""} ${c.area} ${c.contactName} ${c.emirate}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filters.business.length && !filters.business.includes(c.business))
        return false;
      if (filters.emirates.length && !filters.emirates.includes(c.emirate))
        return false;
      if (filters.stages.length && !filters.stages.includes(c.spancop))
        return false;
      if (filters.owners.length && !filters.owners.includes(c.owner))
        return false;
      if (filters.alertsOnly && !alertFor(c)) return false;
      return true;
    });
  }, [companies, filters]);

  /** Live snapshot: how many companies sit at each stage right now. */
  const snapshot = React.useMemo(() => {
    const counts: Record<SpancopStage, number> = {
      suspect: 0,
      prospect: 0,
      approach: 0,
      negotiate: 0,
      close: 0,
      order: 0,
      payment: 0,
    };
    filtered.forEach((c) => (counts[c.spancop] += 1));
    return counts;
  }, [filtered]);

  /** Pending suggestions that differ from the current stage and are not locked by Keep. */
  const pendingSuggestions = React.useMemo(
    () =>
      companies
        // Deals are passed so PO, delivery and payment are read from the
        // deals themselves rather than stored flags nothing used to write.
        .map((company) => ({
          company,
          suggestion: suggestionFor(company, deals),
        }))
        .filter(
          ({ company, suggestion }) =>
            suggestion.stage !== company.spancop &&
            !isSuggestionDismissed(
              company,
              activitiesByCompany.get(company.id) ?? [],
              dismissed,
            ),
        ),
    [companies, deals, activitiesByCompany, dismissed],
  );

  const dismissAllSuggestions = React.useCallback(() => {
    if (pendingSuggestions.length === 0) return;
    const nowIso = new Date().toISOString();
    const batch: Record<string, DismissedStageSuggestion> = {};
    for (const { company, suggestion } of pendingSuggestions) {
      batch[company.id] = buildDismissedSuggestion(
        company,
        suggestion.stage,
        activitiesByCompany.get(company.id) ?? [],
        nowIso,
      );
    }
    setDismissed(saveDismissedSuggestionsBatch(batch));
  }, [pendingSuggestions, activitiesByCompany, setDismissed]);

  const alerts = React.useMemo(
    () =>
      filtered
        .map((company) => ({ company, alert: alertFor(company) }))
        .filter((x): x is { company: Company; alert: CompanyAlert } =>
          Boolean(x.alert),
        ),
    [filtered],
  );

  const activeFilterCount =
    (filters.query ? 1 : 0) +
    (filters.business.length ? 1 : 0) * filters.business.length +
    filters.emirates.length +
    filters.stages.length +
    filters.owners.length +
    (filters.alertsOnly ? 1 : 0);

  return {
    companies,
    filtered,
    transitions,
    filters,
    setFilters,
    resetFilters: () => setFilters(EMPTY),
    activeFilterCount,
    snapshot,
    pendingSuggestions,
    alerts,
    moveStage,
    dismissSuggestion,
    dismissAllSuggestions,
    addCompany,
    addCompanies,
  };
}
