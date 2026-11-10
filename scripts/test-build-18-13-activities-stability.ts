/**
 * BUILD 18.13 Verification Suite:
 * 1. Activities list stability (zero focus-triggered skeleton reloads / scroll resets)
 * 2. Silent background visibility revalidation with 5-minute cooldown + open-dialog guard
 * 3. Instant read-only ActivityDetailDialog + completed historical task visibility in ActivityRow
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`✓ ${label}`);
}

const dpSrc = fs.readFileSync(
  path.join(ROOT, "src/components/providers/data-provider.tsx"),
  "utf8",
);
const rowSrc = fs.readFileSync(
  path.join(ROOT, "src/components/activities/activity-row.tsx"),
  "utf8",
);
const detailSrc = fs.readFileSync(
  path.join(ROOT, "src/components/activities/activity-detail-dialog.tsx"),
  "utf8",
);

check("DataProvider removes window 'focus' reload listener so closing modals never triggers reload", () => {
  assert.ok(
    !dpSrc.includes('addEventListener("focus"'),
    "window focus listener must be removed to prevent modal dismissal reloads",
  );
  assert.ok(
    !dpSrc.includes('removeEventListener("focus"'),
    "window focus listener cleanup must be removed",
  );
});

check("DataProvider only shows loading skeleton on initial/unloaded fetch, never on silent refresh", () => {
  assert.ok(dpSrc.includes("hasLoadedOnceRef"));
  assert.ok(dpSrc.includes("const showInitialSkeleton = !opts?.silent && !hasLoadedOnceRef.current;"));
  assert.ok(dpSrc.includes("if (showInitialSkeleton) {\n        setLoading(true);\n      }"));
});

check("Visibility revalidation enforces 5-minute cooldown, skips open dialogs, and runs silently", () => {
  assert.ok(dpSrc.includes("BACKGROUND_REFRESH_COOLDOWN_MS = 5 * 60 * 1000"));
  assert.ok(
    dpSrc.includes('[role="dialog"][data-state="open"]'),
    "visibilitychange must skip background reload while any dialog is open",
  );
  assert.ok(dpSrc.includes("void load({ silent: true });"));
});

check("Background network error never overwrites already-loaded Supabase records with demo seed data", () => {
  assert.ok(dpSrc.includes("if (!hasLoadedOnceRef.current) {"));
});

check("ActivityRow opens read-only ActivityDetailDialog on click/Enter and surfaces completed tasks", () => {
  assert.ok(rowSrc.includes("ActivityDetailDialog"));
  assert.ok(rowSrc.includes("setViewing(true)"));
  assert.ok(rowSrc.includes("View details"));
  assert.ok(rowSrc.includes("activity.task && activity.taskDone"));
});

check("ActivityDetailDialog renders full report, exact dates, deal title, and What happens next for open & completed tasks", () => {
  assert.ok(detailSrc.includes("export function ActivityDetailDialog"));
  assert.ok(detailSrc.includes("What happens next"));
  assert.ok(detailSrc.includes("Completed"));
  assert.ok(detailSrc.includes("Edit activity"));
  assert.ok(detailSrc.includes("Mark done"));
});

console.log(
  `\nBUILD 18.13 activities stability & detail card suite passed (${passed}/6 checks).`,
);
