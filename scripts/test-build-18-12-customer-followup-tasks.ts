/**
 * BUILD 18.12 Verification Suite:
 * Customer Follow-up <-> Open Task live link + Option B Open Task Bar in CompanyDrawer
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { Activity } from "../src/lib/activities";
import type { Company } from "../src/lib/companies";
import {
  deriveNextFollowUp,
  formatOpenTaskMeta,
  openTasksForCompany,
  resolveCompanyFollowUps,
} from "../src/lib/customer-followups";
import { countersDiffer, recomputeCounters } from "../src/lib/recompute";

const ROOT = process.cwd();
const NOW = new Date("2026-11-06T12:00:00.000Z").getTime(); // Fri, 6 Nov 2026

function makeActivity(overrides: Partial<Activity>): Activity {
  return {
    id: overrides.id ?? "AC-1",
    companyId: overrides.companyId ?? "C-RAFFLES",
    contactId: overrides.contactId ?? "P-1",
    dealId: overrides.dealId ?? null,
    type: overrides.type ?? "call",
    report: overrides.report ?? "Called Mr. Ganesh, gave an introduction.",
    occurredAt: overrides.occurredAt ?? "2026-11-05T10:00:00.000Z",
    task: overrides.task ?? null,
    taskDueAt: overrides.taskDueAt ?? null,
    taskDone: overrides.taskDone ?? false,
    remind: overrides.remind ?? true,
    owner: overrides.owner ?? "Bishal Karma",
    createdAt: overrides.createdAt ?? "2026-11-05T10:00:00.000Z",
  };
}

let passed = 0;
function check(label: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`✓ ${label}`);
}

check("Raffles scenario: open Monday task links stale null nextFollowUp -> Mon 9 Nov", () => {
  const raffles = {
    id: "C-RAFFLES",
    name: "Raffles Dubai Wafi Mall",
    nextFollowUp: null,
  } as Company;

  const activities = [
    makeActivity({
      id: "AC-RAFFLES-1",
      companyId: "C-RAFFLES",
      occurredAt: "2026-11-05T10:00:00.000Z",
      task: "Follow up with Mr. Ganesh on brand intro",
      taskDueAt: "2026-11-09T09:00:00.000Z", // Mon, 9 Nov 2026
      taskDone: false,
    }),
  ];

  const [resolved] = resolveCompanyFollowUps([raffles], activities, NOW);
  assert.equal(resolved.nextFollowUp, "2026-11-09T09:00:00.000Z");

  const tasks = openTasksForCompany("C-RAFFLES", activities);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].task, "Follow up with Mr. Ganesh on brand intro");

  const meta = formatOpenTaskMeta(tasks[0], NOW);
  assert.equal(meta.urgency, "soon");
  assert.equal(meta.eyebrow, "OPEN TASK · MON 9 NOV");
});

check("Multiple open tasks prioritize Overdue -> Today -> Upcoming -> Undated, and step forward as completed", () => {
  const overdueTask = makeActivity({
    id: "AC-OVERDUE",
    task: "Send revised price list",
    taskDueAt: "2026-11-04T09:00:00.000Z",
    taskDone: false,
  });
  const mondayTask = makeActivity({
    id: "AC-MONDAY",
    task: "Call Ganesh Sir on Monday",
    taskDueAt: "2026-11-09T09:00:00.000Z",
    taskDone: false,
  });
  const undatedTask = makeActivity({
    id: "AC-UNDATED",
    task: "Check warehouse stock",
    taskDueAt: null,
    taskDone: false,
  });

  const ordered = openTasksForCompany("C-RAFFLES", [
    undatedTask,
    mondayTask,
    overdueTask,
  ]);
  assert.deepEqual(
    ordered.map((t) => t.id),
    ["AC-OVERDUE", "AC-MONDAY", "AC-UNDATED"],
  );
  assert.equal(
    deriveNextFollowUp("C-RAFFLES", ordered, NOW),
    "2026-11-04T09:00:00.000Z",
  );
  assert.match(formatOpenTaskMeta(ordered[0], NOW).eyebrow, /^OVERDUE TASK · /);

  // Complete overdue task -> Monday becomes nextFollowUp
  const afterOverdueDone = ordered.map((t) =>
    t.id === "AC-OVERDUE" ? { ...t, taskDone: true } : t,
  );
  assert.equal(
    deriveNextFollowUp("C-RAFFLES", afterOverdueDone, NOW),
    "2026-11-09T09:00:00.000Z",
  );

  // Complete Monday task -> no dated task left -> nextFollowUp becomes null, while undated open task stays visible in bar
  const afterMondayDone = afterOverdueDone.map((t) =>
    t.id === "AC-MONDAY" ? { ...t, taskDone: true } : t,
  );
  assert.equal(deriveNextFollowUp("C-RAFFLES", afterMondayDone, NOW), null);
  const remainingOpen = openTasksForCompany("C-RAFFLES", afterMondayDone);
  assert.equal(remainingOpen.length, 1);
  assert.equal(
    formatOpenTaskMeta(remainingOpen[0], NOW).eyebrow,
    "OPEN TASK · NO DUE DATE",
  );
});

check("Future-booked activity sets nextFollowUp without inflating past activityCount", () => {
  const bookedMeeting = makeActivity({
    id: "AC-FUTURE",
    companyId: "C-BOOKED",
    type: "meeting",
    occurredAt: "2026-11-11T10:00:00.000Z",
    task: null,
    taskDueAt: null,
  });

  const counters = recomputeCounters("C-BOOKED", [bookedMeeting], [], (v) => v, NOW);
  assert.equal(counters.activityCount, 0);
  assert.equal(counters.lastActivityAt, null);
  assert.equal(counters.nextFollowUp, "2026-11-11T10:00:00.000Z");

  const staleCompany = {
    activityCount: 0,
    lastActivityAt: null,
    lifetimeValue: 0,
    nextFollowUp: null,
  } as Company;
  assert.equal(countersDiffer(staleCompany, counters), true);
  assert.equal(
    countersDiffer({ ...staleCompany, nextFollowUp: "2026-11-11T10:00:00.000Z" }, counters),
    false,
  );
});

check("DataProvider syncs next_follow_up across load, addActivity, updateActivity, deleteActivity, and syncCounters", () => {
  const dpSrc = fs.readFileSync(
    path.join(ROOT, "src/components/providers/data-provider.tsx"),
    "utf8",
  );
  assert.ok(dpSrc.includes("resolveCompanyFollowUps"));
  assert.ok(dpSrc.includes("companies: linkedCompanies"));
  assert.ok(
    (dpSrc.match(/next_follow_up:/g) ?? []).length >= 4,
    "DataProvider must persist next_follow_up across load self-heal, syncCounters, addActivity, and deleteActivity",
  );
});

check("Option B CompanyDrawer renders Open Task bar + 1-tap Done button wired to LogActivityDialog", () => {
  const drawerSrc = fs.readFileSync(
    path.join(ROOT, "src/components/companies/company-drawer.tsx"),
    "utf8",
  );
  assert.ok(drawerSrc.includes("openTasksForCompany"));
  assert.ok(drawerSrc.includes("formatOpenTaskMeta"));
  assert.ok(drawerSrc.includes("renderOpenTaskBar(true)"));
  assert.ok(drawerSrc.includes("renderOpenTaskBar(false)"));
  assert.ok(drawerSrc.includes("onClick={() => setCompletingTask(primaryOpenTask)}"));
  assert.ok(drawerSrc.includes("completing={completingTask}"));

  const cellSrc = fs.readFileSync(
    path.join(ROOT, "src/components/companies/follow-up-cell.tsx"),
    "utf8",
  );
  assert.ok(cellSrc.includes('weekday: "short"'));
});

console.log(`\nBUILD 18.12 customer follow-up link suite passed (${passed}/5 checks).`);
