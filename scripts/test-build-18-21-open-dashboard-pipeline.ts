import assert from "node:assert/strict";
import { DEALS } from "@/lib/deals";
import { openPipelineStageRows } from "@/lib/dashboard-metrics";

const base = DEALS.find((deal) => deal.lines.length > 0);
assert.ok(base, "demo deal fixture exists");
const sourceLine = base.lines[0];
assert.ok(sourceLine, "demo deal has a line item");

const potentialLine = {
  ...sourceLine,
  id: "test-potential",
  quantity: 2,
  unitPrice: 50,
  commercialStatus: "potential" as const,
};
const wonLine = {
  ...sourceLine,
  id: "test-won",
  quantity: 1,
  unitPrice: 25,
  commercialStatus: "won" as const,
};

const fixtures = [
  {
    ...base,
    id: "test-open-mixed",
    stage: "negotiation" as const,
    lifecycleStatus: "open" as const,
    lines: [potentialLine, wonLine],
    value: 125,
  },
  {
    ...base,
    id: "test-closed-in-open-stage",
    stage: "negotiation" as const,
    lifecycleStatus: "closed" as const,
    lines: [potentialLine],
    value: 100,
  },
  {
    ...base,
    id: "test-open-lead",
    stage: "lead" as const,
    lifecycleStatus: "open" as const,
    lines: [potentialLine],
    value: 100,
  },
];

const rows = openPipelineStageRows(fixtures, (amount) => amount);
const negotiation = rows.find((row) => row.stage === "negotiation");
const lead = rows.find((row) => row.stage === "lead");

assert.equal(negotiation?.count, 1, "closed deals in an active stage are excluded");
assert.equal(negotiation?.value, 100, "pipeline value excludes already-won lines");
assert.equal(lead?.count, 1, "ongoing lead is included");
assert.equal(lead?.value, 100, "ongoing lead potential value is retained");

console.log("BUILD 18.21 dashboard pipeline: 4 assertions passed");
