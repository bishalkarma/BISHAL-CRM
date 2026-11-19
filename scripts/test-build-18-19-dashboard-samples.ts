import assert from "node:assert/strict";
import { DEALS } from "../src/lib/deals";
import { samplesWithCustomer } from "../src/lib/dashboard-metrics";
import type { Deal } from "../src/lib/deals";
import type { LineItem } from "../src/lib/deal-model";

const template = DEALS.find((deal) => deal.lines.length > 0);
assert.ok(template, "seed deals include a product line");
const lineTemplate = template.lines[0] as LineItem;
const sentAt = "2026-10-01T12:00:00.000Z";
const now = new Date("2026-10-20T12:00:00.000Z").getTime();

function dealWithSample(
  id: string,
  stage: Deal["stage"],
  sample: NonNullable<LineItem["sample"]>,
): Deal {
  return {
    ...template!,
    id,
    stage,
    lines: [{ ...lineTemplate, id: `${id}-line`, sample }],
  };
}

const rows = samplesWithCustomer(
  [
    dealWithSample("lead-out-awaiting", "lead", {
      sentAt,
      feedbackAt: null,
      feedback: null,
      returnStatus: "out",
    }),
    dealWithSample("negotiation-out-replied", "negotiation", {
      sentAt,
      feedbackAt: "2026-10-10T12:00:00.000Z",
      feedback: "Approved",
      returnStatus: "out",
    }),
    dealWithSample("closed-returned", "negotiation", {
      sentAt,
      feedbackAt: "2026-10-10T12:00:00.000Z",
      feedback: "Approved",
      returnedAt: "2026-10-12T12:00:00.000Z",
      returnStatus: "returned",
    }),
    dealWithSample("qualified-consumable", "qualified", {
      sentAt,
      feedbackAt: null,
      feedback: null,
      returnStatus: "consumable",
    }),
  ],
  "all",
  (amount) => amount,
  now,
);

assert.deepEqual(
  rows.map((row) => row.deal.id).sort(),
  ["lead-out-awaiting", "negotiation-out-replied"],
  "shows every physically-out sample in any stage, regardless of feedback, and excludes returned/consumable samples",
);
assert.equal(rows.find((row) => row.deal.id === "lead-out-awaiting")?.feedbackReceived, false);
assert.equal(rows.find((row) => row.deal.id === "negotiation-out-replied")?.feedbackReceived, true);
assert.equal(rows[0].daysWithCustomer, 19);
console.log("BUILD 18.19 dashboard sample-custody checks passed (3 assertions)");
