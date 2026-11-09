/** Unit and source/layout guards for BUILD 18.9 Suggested Stage Changes revamp + Keep Until New Activity memory. */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  buildDismissedSuggestion,
  hasNewActivitySinceDismiss,
  isSuggestionDismissed,
  type DismissedSuggestionsMap,
} from "../src/lib/spancop-dismissals";

const dialogSource = readFileSync("src/components/companies/suggestions-dialog.tsx", "utf8");
const useCompaniesSource = readFileSync("src/components/companies/use-companies.tsx".replace(".tsx", ".ts"), "utf8");
const drawerSource = readFileSync("src/components/companies/company-drawer.tsx", "utf8");
const companiesViewSource = readFileSync("src/components/companies/companies-view.tsx", "utf8");

let passed = 0;
const check = (name: string, test: () => void) => {
  test();
  passed++;
  console.log(`  ok   ${name}`);
};

const baseCompany = {
  id: "C-CORAL",
  spancop: "suspect" as const,
  activityCount: 2,
  lastActivityAt: "2026-11-01T10:00:00.000Z",
};

const initialActivities = [
  {
    id: "AC-1",
    occurredAt: "2026-10-28T09:00:00.000Z",
    createdAt: "2026-10-28T09:05:00.000Z",
  },
  {
    id: "AC-2",
    occurredAt: "2026-11-01T10:00:00.000Z",
    createdAt: "2026-11-01T10:02:00.000Z",
  },
];

const dismissTime = "2026-11-05T12:00:00.000Z";
const record = buildDismissedSuggestion(
  baseCompany,
  "approach",
  initialActivities,
  dismissTime,
);
const map: DismissedSuggestionsMap = { [baseCompany.id]: record };

check("kept suggestion stays suppressed across close, navigation, and reload when no new activity exists", () => {
  assert.equal(hasNewActivitySinceDismiss(baseCompany, initialActivities, record), false);
  assert.equal(isSuggestionDismissed(baseCompany, initialActivities, map), true);
});

check("deleting an old activity does not falsely count as a new activity", () => {
  const afterDeleteCompany = {
    ...baseCompany,
    activityCount: 1,
    lastActivityAt: "2026-10-28T09:00:00.000Z",
  };
  assert.equal(
    isSuggestionDismissed(afterDeleteCompany, [initialActivities[0]], map),
    true,
  );
});

check("late-loading historical activities created before Keep never falsely unlock a kept stage", () => {
  const recordBeforeActivitiesLoaded = buildDismissedSuggestion(
    baseCompany,
    "approach",
    [],
    dismissTime,
  );
  const partialMap: DismissedSuggestionsMap = {
    [baseCompany.id]: recordBeforeActivitiesLoaded,
  };
  assert.equal(
    isSuggestionDismissed(baseCompany, initialActivities, partialMap),
    true,
  );
});

check("logging a new activity immediately unlocks the suggestion (activityCount increment)", () => {
  const updatedCompany = {
    ...baseCompany,
    activityCount: 3,
    lastActivityAt: "2026-11-05T14:00:00.000Z",
  };
  const nextActivities = [
    {
      id: "AC-3",
      occurredAt: "2026-11-05T14:00:00.000Z",
      createdAt: "2026-11-05T14:00:00.000Z",
    },
    ...initialActivities,
  ];
  assert.equal(isSuggestionDismissed(updatedCompany, nextActivities, map), false);
});

check("logging a backdated new activity after deleting an older one still unlocks via unseen ID", () => {
  const sameCountCompany = {
    ...baseCompany,
    activityCount: 2,
    lastActivityAt: "2026-11-01T10:00:00.000Z",
  };
  const backdatedReplacement = [
    initialActivities[0],
    {
      id: "AC-BACKDATED",
      occurredAt: "2026-10-30T08:00:00.000Z",
      createdAt: "2026-11-05T15:00:00.000Z",
    },
  ];
  assert.equal(
    isSuggestionDismissed(sameCountCompany, backdatedReplacement, map),
    false,
  );
});

check("scheduling a future follow-up activity for that customer also unlocks the suggestion", () => {
  const futureScheduled = [
    {
      id: "AC-FUTURE",
      occurredAt: "2026-11-12T09:00:00.000Z",
      createdAt: "2026-11-05T13:30:00.000Z",
    },
    ...initialActivities,
  ];
  assert.equal(isSuggestionDismissed(baseCompany, futureScheduled, map), false);
});

check("moving the customer to another stage invalidates the old keptStage lock", () => {
  const movedCompany = { ...baseCompany, spancop: "prospect" as const };
  assert.equal(isSuggestionDismissed(movedCompany, initialActivities, map), false);
});

check("SuggestionsDialog Option A renders full-width header, horizontal stage+reason strip, 50/50 mobile buttons, and Keep all footer", () => {
  assert.match(dialogSource, /w-\[calc\(100%-1rem\)\]\s+max-w-2xl/);
  assert.match(dialogSource, /grid grid-cols-2 gap-2 sm:flex sm:justify-end/);
  assert.match(dialogSource, /Move to \{to\.label\}/);
  assert.match(dialogSource, /Keep \{from\.label\}/);
  assert.match(dialogSource, /Keep all \{suggestions\.length\} in current stage/);
});

check("useCompanies, CompaniesView, and CompanyDrawer all share persistent Keep Until New Activity state", () => {
  assert.match(useCompaniesSource, /saveDismissedSuggestionsBatch/);
  assert.match(useCompaniesSource, /clearDismissedSuggestion\(companyId\)/);
  assert.match(useCompaniesSource, /isSuggestionDismissed\(/);
  assert.match(companiesViewSource, /onDismissAll=\{dismissAllSuggestions\}/);
  assert.match(drawerSource, /const suggestion = suggestionFor\(company, deals\);/);
  assert.match(drawerSource, /!isSuggestionDismissed\(company, companyActivities, dismissed\)/);
});

console.log(`\n${passed} passed, 0 failed`);
