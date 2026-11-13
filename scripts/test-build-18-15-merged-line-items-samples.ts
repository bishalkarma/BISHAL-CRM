/**
 * Automated verification suite for BUILD 18.15 — Merged "Line Items & Samples"
 * inside DealDrawer (Deal Value on Top + 4 Adaptive Card States incl. State 3
 * Auto-Compact Audit Strip).
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { buildSampleLedger, defaultSampleQtyForLine } from "../src/lib/samples";
import { LINE_STATUS_META, lineTotal, type LineItem } from "../src/lib/deal-model";
import { COMPANIES } from "../src/lib/companies";
import { CONTACTS } from "../src/lib/contacts";
import { DEALS } from "../src/lib/deals";

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

console.log("\nBUILD 18.15 — DealDrawer Layout Order & Zero Duplicate Lists");

check("DealDrawer renders Deal value ABOVE unified SampleTracker (Line Items & Samples)", () => {
  const dealDrawer = readFileSync("src/components/pipeline/deal-drawer.tsx", "utf8");
  const dealValueIdx = dealDrawer.indexOf("Deal value");
  const unifiedListIdx = dealDrawer.indexOf("<SampleTracker deal={deal} />");
  assert.ok(dealValueIdx !== -1, "Deal value card exists in DealDrawer");
  assert.ok(unifiedListIdx !== -1, "Unified SampleTracker rendered in DealDrawer");
  assert.ok(
    dealValueIdx < unifiedListIdx,
    "Deal value must sit above the unified Line Items & Samples section",
  );
  assert.equal(
    (dealDrawer.match(/<SampleTracker/g) ?? []).length,
    1,
    "SampleTracker rendered once (no duplicate top box)",
  );
  assert.ok(
    !dealDrawer.includes("deal.lines.map("),
    "DealDrawer no longer renders a second duplicate deal.lines.map() list",
  );
});

check("SampleTracker merges commercial quote details and sample custody in one card per product", () => {
  const tracker = readFileSync("src/components/pipeline/sample-tracker.tsx", "utf8");
  assert.ok(
    !tracker.includes("Sample Custody &amp; Verdict"),
    "Old separate 'Sample Custody & Verdict' header removed",
  );
  assert.match(tracker, /Line items & samples/);
  assert.match(tracker, /LINE_STATUS_META\[line\.status\]/);
  assert.match(tracker, /lineTotal\(line\)/);
  assert.match(tracker, /qtyPriceFormatter\.format\(line\.unitPrice\)/);
});

check("State 3 auto-compact strip triggers only when BOTH Verdict is decided AND Custody is settled", () => {
  const tracker = readFileSync("src/components/pipeline/sample-tracker.tsx", "utf8");
  assert.match(
    tracker,
    /const isCompactCompleted =\s*Boolean\(entry\) && isVerdictDecided && isCustodySettled && !isExpanded;/,
  );
  assert.match(tracker, /Change/);
  assert.match(tracker, /Mark Taken Back/);
  assert.match(tracker, /\+ Give sample/);
  assert.match(tracker, /Undo return/);
});

console.log("\nBUILD 18.15 — All 4 Unified Product Card States (D-2323 Scenario)");

check("4 product lines evaluate cleanly into States 1, 2, 3, and 4 with commercial totals intact", () => {
  const baseDeal = DEALS[0];
  const lines: LineItem[] = [
    // State 1: Sample currently out with hotel
    {
      id: "L-S1",
      product: "Electric Kettle Stainless 1 Ltr",
      brand: "Aolga",
      quantity: 10,
      unit: "Pcs",
      unitPrice: 95,
      status: "quoted",
      sample: {
        sentAt: "2026-10-26T12:00:00Z",
        feedbackAt: null,
        feedback: null,
        sampleQty: 1,
        returnedAt: null,
        returnStatus: "out",
        recipient: "Chef Marco",
      },
    },
    // State 2: Returned (Held 12 days), still awaiting Approve/Reject verdict (D-2323!)
    {
      id: "L-S2",
      product: "Electric Kettle Stainless 0.8 Ltr",
      brand: "Aolga",
      quantity: 10,
      unit: "Pcs",
      unitPrice: 85,
      status: "quoted",
      sample: {
        sentAt: "2026-10-28T12:00:00Z",
        feedbackAt: null,
        feedback: null,
        sampleQty: 1,
        returnedAt: "2026-11-09T12:00:00Z",
        returnStatus: "returned",
      },
    },
    // State 3: Approved + Returned -> Auto-compact 1-line strip!
    {
      id: "L-S3",
      product: "Espresso Cup 90ml",
      brand: "Porcelite",
      quantity: 100,
      unit: "Pcs",
      unitPrice: 12,
      status: "approved",
      sample: {
        sentAt: "2026-10-20T12:00:00Z",
        feedbackAt: "2026-10-25T12:00:00Z",
        feedback: "Approved",
        sampleQty: 2,
        returnedAt: "2026-10-26T12:00:00Z",
        returnStatus: "returned",
        returnNote: "Returned in good condition",
      },
    },
    // State 4: Regular quoted line item (no sample requested)
    {
      id: "L-S4",
      product: "Porcelain Banquet Plate 28cm",
      brand: "RAK Porcelain",
      quantity: 120,
      unit: "Pcs",
      unitPrice: 30,
      status: "quoted",
      sample: null,
    },
  ];

  const deal = { ...baseDeal, id: "D-2323", stage: "sampling" as const, lines };
  const ledger = buildSampleLedger({
    deals: [deal],
    customerSamples: [],
    companies: COMPANIES,
    contacts: CONTACTS,
    activities: [],
    now: new Date("2026-11-04T12:00:00Z").getTime(),
  });
  const byLine = new Map(ledger.map((e) => [e.lineId ?? "", e]));

  const classifyState = (line: LineItem, expanded = false) => {
    const entry = byLine.get(line.id) ?? null;
    if (!entry) return "state-4-unsampled";
    const verdictDecided = line.status === "approved" || line.status === "rejected";
    const custodySettled =
      entry.returnStatus === "returned" || entry.returnStatus === "consumable";
    if (verdictDecided && custodySettled && !expanded) return "state-3-compact";
    if (entry.returnStatus === "out") return "state-1-out";
    return "state-2-returned-open-verdict";
  };

  assert.equal(classifyState(lines[0]), "state-1-out");
  assert.equal(lineTotal(lines[0]), 950);
  assert.equal(defaultSampleQtyForLine(lines[0]), 1);
  assert.equal(LINE_STATUS_META[lines[0].status].label, "Quoted");

  assert.equal(classifyState(lines[1]), "state-2-returned-open-verdict");
  assert.equal(lineTotal(lines[1]), 850);
  assert.equal(byLine.get("L-S2")?.daysWithCustomer, 12);

  assert.equal(classifyState(lines[2], false), "state-3-compact");
  assert.equal(classifyState(lines[2], true), "state-2-returned-open-verdict");
  assert.equal(LINE_STATUS_META[lines[2].status].label, "Approved");
  assert.equal(byLine.get("L-S3")?.daysWithCustomer, 6);

  assert.equal(classifyState(lines[3]), "state-4-unsampled");
  assert.equal(lineTotal(lines[3]), 3600);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
