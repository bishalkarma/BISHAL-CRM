import type { Activity } from "./activities";
import type { Company } from "./companies";
import type { SpancopStage } from "./spancop";

export const DISMISSED_SUGGESTIONS_KEY =
  "biscrm:dismissed-stage-suggestions:v1";
export const DISMISSED_SUGGESTIONS_EVENT =
  "biscrm:stage-dismissals-changed";

export type DismissedStageSuggestion = {
  /** Stage the user explicitly chose to keep (e.g. "suspect"). */
  keptStage: SpancopStage;
  /** Suggested stage at the moment Keep was tapped (e.g. "approach"). */
  suggestedStage: SpancopStage;
  /** Company's stored activityCount when Keep was tapped. */
  activityCountAtDismiss: number;
  /** Total activities (logged + scheduled) for this customer when Keep was tapped. */
  totalActivitiesAtDismiss: number;
  /** Known activity IDs for this customer when Keep was tapped. */
  activityIdsAtDismiss: string[];
  /** Latest activity timestamp known when Keep was tapped. */
  latestActivityStampAtDismiss: string | null;
  /** ISO timestamp when Keep was tapped. */
  dismissedAt: string;
};

export type DismissedSuggestionsMap = Record<string, DismissedStageSuggestion>;

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Latest known timestamp across a company's counter and its activity records. */
export function latestCustomerActivityStamp(
  company: Pick<Company, "lastActivityAt">,
  customerActivities: readonly Pick<Activity, "occurredAt" | "createdAt">[],
): string | null {
  let maxMs: number | null = parseTime(company.lastActivityAt);
  let maxIso: string | null = maxMs !== null ? company.lastActivityAt : null;

  for (const activity of customerActivities) {
    for (const candidate of [activity.createdAt, activity.occurredAt]) {
      const ms = parseTime(candidate);
      if (ms !== null && (maxMs === null || ms > maxMs)) {
        maxMs = ms;
        maxIso = candidate;
      }
    }
  }

  return maxIso;
}

/** Build a persistent snapshot locking the customer in their current stage until a new activity is logged. */
export function buildDismissedSuggestion(
  company: Pick<Company, "spancop" | "activityCount" | "lastActivityAt">,
  suggestedStage: SpancopStage,
  customerActivities: readonly Pick<Activity, "id" | "occurredAt" | "createdAt">[],
  nowIso: string = new Date().toISOString(),
): DismissedStageSuggestion {
  return {
    keptStage: company.spancop,
    suggestedStage,
    activityCountAtDismiss: company.activityCount,
    totalActivitiesAtDismiss: customerActivities.length,
    activityIdsAtDismiss: customerActivities.map((a) => a.id),
    latestActivityStampAtDismiss: latestCustomerActivityStamp(
      company,
      customerActivities,
    ),
    dismissedAt: nowIso,
  };
}

/**
 * Returns true once the user logs a new activity for this customer after tapping Keep.
 */
export function hasNewActivitySinceDismiss(
  company: Pick<Company, "activityCount" | "lastActivityAt">,
  customerActivities: readonly Pick<Activity, "id" | "occurredAt" | "createdAt">[],
  record: DismissedStageSuggestion,
): boolean {
  if (company.activityCount > record.activityCountAtDismiss) {
    return true;
  }

  if (
    record.totalActivitiesAtDismiss > 0 &&
    customerActivities.length > record.totalActivitiesAtDismiss
  ) {
    return true;
  }

  const knownIds = new Set(record.activityIdsAtDismiss);
  const dismissedMs = parseTime(record.dismissedAt);

  for (const activity of customerActivities) {
    if (knownIds.has(activity.id)) continue;
    const createdMs =
      parseTime(activity.createdAt) ?? parseTime(activity.occurredAt);
    // If activities were already loaded at dismiss time, any unseen ID is new;
    // otherwise require its creation timestamp to be at/after dismiss time so
    // late-loading historical rows never falsely unlock a kept stage.
    if (record.totalActivitiesAtDismiss > 0) {
      return true;
    }
    if (createdMs !== null && dismissedMs !== null && createdMs >= dismissedMs) {
      return true;
    }
  }

  const currentStampMs = parseTime(company.lastActivityAt);
  const dismissStampMs = parseTime(record.latestActivityStampAtDismiss);
  if (currentStampMs !== null) {
    if (dismissStampMs === null && record.activityCountAtDismiss === 0) {
      return true;
    }
    if (dismissStampMs !== null && currentStampMs > dismissStampMs) {
      return true;
    }
  }

  return false;
}

/**
 * True while the customer remains in the kept stage and no new activity has been logged.
 */
export function isSuggestionDismissed(
  company: Pick<Company, "id" | "spancop" | "activityCount" | "lastActivityAt">,
  customerActivities: readonly Pick<Activity, "id" | "occurredAt" | "createdAt">[],
  dismissedMap: DismissedSuggestionsMap,
): boolean {
  const record = dismissedMap[company.id];
  if (!record) return false;
  if (company.spancop !== record.keptStage) return false;
  return !hasNewActivitySinceDismiss(company, customerActivities, record);
}

/* ------------------------------------------------------------------ */
/* Browser persistence + same-tab synchronization                     */
/* ------------------------------------------------------------------ */

export function readDismissedSuggestions(): DismissedSuggestionsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DISMISSED_SUGGESTIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as DismissedSuggestionsMap;
  } catch {
    return {};
  }
}

export function writeDismissedSuggestions(next: DismissedSuggestionsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DISMISSED_SUGGESTIONS_KEY,
      JSON.stringify(next),
    );
    window.dispatchEvent(new CustomEvent(DISMISSED_SUGGESTIONS_EVENT));
  } catch {
    // Ignore storage quota / private-mode write errors gracefully.
  }
}

export function saveDismissedSuggestionsBatch(
  entries: Record<string, DismissedStageSuggestion>,
): DismissedSuggestionsMap {
  const next: DismissedSuggestionsMap = {
    ...readDismissedSuggestions(),
    ...entries,
  };
  writeDismissedSuggestions(next);
  return next;
}

export function clearDismissedSuggestion(
  companyId: string,
): DismissedSuggestionsMap {
  const current = readDismissedSuggestions();
  if (!(companyId in current)) return current;
  const next = { ...current };
  delete next[companyId];
  writeDismissedSuggestions(next);
  return next;
}

export function subscribeDismissedSuggestions(
  onChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === DISMISSED_SUGGESTIONS_KEY) {
      onChange();
    }
  };
  window.addEventListener(DISMISSED_SUGGESTIONS_EVENT, onChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(DISMISSED_SUGGESTIONS_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
