/** Regression coverage for pipeline Lost deals whose lines remain quoted. */
import { strict as assert } from "node:assert";
import { DEALS, type Deal } from "../src/lib/deals";
import { lossReasons } from "../src/lib/dashboard-metrics";
import type { LineItem } from "../src/lib/deal-model";

const now = Date.parse("2026-10-16T12:00:00Z");
const line = (id: string, status: LineItem["status"] = "quoted", rejectReason?: LineItem["rejectReason"]): LineItem => ({
  id, product: id, brand: "Test", quantity: 2, unit: "Pcs", unitPrice: 50,
  status, rejectReason,
});
const deal = (patch: Partial<Deal> = {}): Deal => ({
  ...DEALS[0], id: "loss-regression", stage: "lost", currency: "AED",
  lines: [line("quoted"), line("approved", "approved")], value: 200,
  lostReason: "Lead time", createdAt: "2025-01-01T12:00:00Z",
  periods: [{ openedAt: "2025-01-01T12:00:00Z", closedAt: "2026-10-15T12:00:00Z" }],
  ...patch,
});
const identity = (value: number) => value;
const rowsFor = (deals: Deal[]) => lossReasons(deals, "all", identity, now);
const count = (rows: ReturnType<typeof rowsFor>) => rows.reduce((sum, row) => sum + row.count, 0);
const value = (rows: ReturnType<typeof rowsFor>) => rows.reduce((sum, row) => sum + row.value, 0);
let passed = 0;
const check = (name: string, test: () => void) => {
  test(); passed++; console.log(`  ok   ${name}`);
};

check("Lost pipeline deal counts quoted and approved lines under the deal reason", () => {
  const rows = rowsFor([deal()]);
  assert.equal(rows.find(row => row.reason === "Lead time")?.count, 2);
  assert.equal(value(rows), 200);
});
check("explicit line reason takes precedence and each line counts once", () => {
  const rows = rowsFor([deal({ lines: [line("rejected", "rejected", "Budget Constraint"), line("quoted")] })]);
  assert.equal(count(rows), 2);
  assert.equal(value(rows), 200);
  assert.equal(rows.find(row => row.reason === "Budget Constraint")?.value, 100);
  assert.equal(rows.find(row => row.reason === "Lead time")?.value, 100);
});
check("rejected Lost line without its own reason inherits the deal reason", () => {
  const rows = rowsFor([deal({ lines: [line("rejected", "rejected")] })]);
  assert.equal(rows.find(row => row.reason === "Lead time")?.count, 1);
});
for (const stage of ["won", "quotation"] as const) {
  check(`${stage} deal counts only rejected lines, not the entire package`, () => {
    const rows = rowsFor([deal({ stage, lines: [line("quoted"), line("rejected", "rejected", "Lead time")] })]);
    assert.equal(count(rows), 1);
    assert.equal(value(rows), 100);
  });
}
check("loss without a reason is visible as Not recorded", () => {
  const rows = rowsFor([deal({ lostReason: undefined })]);
  assert.equal(rows.find(row => row.reason === "Not recorded")?.count, 2);
});
check("rejected item on a live deal never inherits a stale deal-level reason", () => {
  const rows = rowsFor([deal({ stage: "quotation", lines: [line("rejected", "rejected")] })]);
  assert.equal(rows.find(row => row.reason === "Not recorded")?.count, 1);
});
check("legacy lost deal without product lines retains its saved value", () => {
  const rows = rowsFor([deal({ lines: [], value: 450 })]);
  assert.equal(count(rows), 1);
  assert.equal(value(rows), 450);
  assert.equal(rows.flatMap(row => row.lines)[0].line, null);
});
check("lost deal with lines uses line amounts instead of adding deal.value twice", () => {
  assert.equal(value(rowsFor([deal({ value: 999 })])), 200);
});
check("loss period uses close date rather than old creation date", () => {
  assert.equal(count(lossReasons([deal()], "week", identity, now)), 2);
  assert.equal(count(lossReasons([deal({ periods: [{ openedAt: "2025-01-01", closedAt: "2026-09-01" }] })], "week", identity, now)), 0);
});
check("missing close date falls back to creation date", () => {
  const rows = lossReasons([deal({ periods: [], createdAt: "2026-10-15" })], "week", identity, now);
  assert.equal(count(rows), 2);
});
check("currency conversion applies to each line and legacy deal value", () => {
  const rows = lossReasons([deal(), deal({ id: "legacy", lines: [], value: 50 })], "all", amount => amount * 2, now);
  assert.equal(value(rows), 500);
});
check("drilldown contains one distinct deal despite multiple lost lines", () => {
  assert.equal(rowsFor([deal()]).find(row => row.reason === "Lead time")?.deals.length, 1);
});
check("empty input preserves the four standard reason rows without losses", () => {
  assert.equal(rowsFor([]).length, 4);
  assert.equal(count(rowsFor([])), 0);
});
check("calculation never mutates source deals or line statuses", () => {
  const input = [deal()];
  const before = JSON.stringify(input);
  rowsFor(input);
  assert.equal(JSON.stringify(input), before);
});
console.log(`\n${passed} passed, 0 failed\n`);
