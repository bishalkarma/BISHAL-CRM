"use client";

import * as React from "react";
import {
  COMPANIES,
  STAGE_TRANSITIONS,
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
  type SpancopStage,
  type StageTransition,
} from "@/lib/spancop";

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

/** The stage the engine thinks a company should be at. */
export function suggestionFor(company: Company) {
  return suggestSpancopStage({
    profileComplete: Boolean(company.email && company.remarks),
    activityCount: company.activityCount,
    openDealCount: company.openDealIds.length,
    lastClosedDealOutcome: company.lastClosedDealOutcome,
    hasPurchaseOrder: company.hasPurchaseOrder,
    awaitingPayment: company.awaitingPayment,
    hasEverOrdered: company.hasEverOrdered,
  });
}

export function useCompanies() {
  const [companies, setCompanies] = React.useState<Company[]>(COMPANIES);
  const [transitions, setTransitions] =
    React.useState<StageTransition[]>(STAGE_TRANSITIONS);
  const [filters, setFilters] = React.useState<CompanyFilters>(EMPTY);
  /** Suggestions the user chose to ignore, so they stop nagging. */
  const [dismissed, setDismissed] = React.useState<Record<string, SpancopStage>>(
    {},
  );

  /** Apply a stage change and write it to history. */
  const moveStage = React.useCallback(
    (
      companyId: string,
      to: SpancopStage,
      reason: string,
      trigger: StageTransition["trigger"] = "manual",
    ) => {
      setCompanies((current) =>
        current.map((c) =>
          c.id === companyId
            ? { ...c, spancop: to, spancopSince: new Date().toISOString() }
            : c,
        ),
      );
      setTransitions((current) => {
        const company = companies.find((c) => c.id === companyId);
        return [
          {
            id: `T-${Date.now()}`,
            companyId,
            from: company?.spancop ?? null,
            to,
            trigger,
            reason,
            at: new Date().toISOString(),
            by: "Bishal Karma",
          },
          ...current,
        ];
      });
    },
    [companies],
  );

  const dismissSuggestion = React.useCallback(
    (companyId: string, stage: SpancopStage) =>
      setDismissed((current) => ({ ...current, [companyId]: stage })),
    [],
  );

  const addCompany = React.useCallback((company: Company) => {
    setCompanies((current) => [company, ...current]);
    setTransitions((current) => [
      {
        id: `T-${Date.now()}`,
        companyId: company.id,
        from: null,
        to: company.spancop,
        trigger: "seed",
        reason: "Company created",
        at: new Date().toISOString(),
        by: "Bishal Karma",
      },
      ...current,
    ]);
  }, []);

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

  /** Pending suggestions that differ from the current stage. */
  const pendingSuggestions = React.useMemo(
    () =>
      companies
        .map((company) => ({ company, suggestion: suggestionFor(company) }))
        .filter(
          ({ company, suggestion }) =>
            suggestion.stage !== company.spancop &&
            dismissed[company.id] !== suggestion.stage,
        ),
    [companies, dismissed],
  );

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
    filters.business.length +
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
    addCompany,
  };
}
