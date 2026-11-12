/**
 * Automated verification suite for BUILD 18.14 — End-to-End Sample Custody,
 * Standalone Customer Samples, Follow-Up Guard & Central Samples Register.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  SAMPLE_FOLLOWUP_DAYS,
  SAMPLE_OVERDUE_DAYS,
  buildSampleLedger,
  computeSampleRegisterStats,
  defaultSampleFollowUpDateInput,
  defaultSampleQtyForLine,
  effectiveSampleReturnStatus,
  sampleCustodyTone,
  sampleDaysWithCustomer,
  type CustomerSample,
} from "../src/lib/samples";
import {
  fromCustomerSample,
  fromLineItem,
  toCustomerSample,
  toLineItem,
} from "../src/lib/supabase-mappers";
import { COMPANIES } from "../src/lib/companies";
import { CONTACTS } from "../src/lib/contacts";
import { DEALS } from "../src/lib/deals";
import type { Activity } from "../src/lib/activities";

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

const DAY = 86_400_000;
const fixedNow = new Date("2026-11-12T12:00:00Z").getTime();

console.log("\nBUILD 18.14 — Sample Custody Day Clock & Alert Thresholds");

check("7d follow-up and 14d overdue pickup thresholds match agreed Option A", () => {
  assert.equal(SAMPLE_FOLLOWUP_DAYS, 7);
  assert.equal(SAMPLE_OVERDUE_DAYS, 14);
  assert.equal(sampleCustodyTone(3, "out"), "out-fresh");
  assert.equal(sampleCustodyTone(7, "out"), "out-followup");
  assert.equal(sampleCustodyTone(13, "out"), "out-followup");
  assert.equal(sampleCustodyTone(14, "out"), "out-overdue");
  assert.equal(sampleCustodyTone(25, "returned"), "returned");
  assert.equal(sampleCustodyTone(25, "consumable"), "consumable");
});

check("days with customer ticks live while out and freezes permanently once returned", () => {
  const sent = "2026-10-26T12:00:00Z";
  assert.equal(sampleDaysWithCustomer(sent, null, fixedNow), 17);
  // Returned on Nov 04 (9 days after Oct 26) -> freezes at 9 even when checked 30 days later!
  assert.equal(
    sampleDaysWithCustomer(sent, "2026-11-04T12:00:00Z", fixedNow + 30 * DAY),
    9,
  );
});

check("defaultSampleQtyForLine distinguishes small sample counts from bulk quote quantities", () => {
  assert.equal(
    defaultSampleQtyForLine({
      id: "L1",
      product: "Dessert Spoon",
      brand: "Vague",
      quantity: 200,
      unit: "Pcs",
      unitPrice: 8,
      status: "quoted",
      sample: { sentAt: "2026-11-01T00:00:00Z", feedbackAt: null, feedback: null },
    }),
    1,
  );
  assert.equal(
    defaultSampleQtyForLine({
      id: "L2",
      product: "Kettle",
      brand: "Aolga",
      quantity: 2,
      unit: "Pcs",
      unitPrice: 95,
      status: "quoted",
      sample: { sentAt: "2026-11-01T00:00:00Z", feedbackAt: null, feedback: null },
    }),
    2,
  );
  assert.equal(
    defaultSampleQtyForLine({
      id: "L3",
      product: "Dessert Spoon",
      brand: "Vague",
      quantity: 200,
      unit: "Pcs",
      unitPrice: 8,
      status: "quoted",
      sample: {
        sentAt: "2026-11-01T00:00:00Z",
        feedbackAt: null,
        feedback: null,
        sampleQty: 3,
      },
    }),
    3,
  );
});

check("default follow-up date adds +7 days from handover date", () => {
  assert.equal(defaultSampleFollowUpDateInput("2026-11-04"), "2026-11-11");
});

console.log("\nBUILD 18.14 — Unified Ledger: Won/Lost Persistence + Standalone Customer Samples + Follow-Ups");

check("samples on Won and Lost deals stay visible in Out With Customer until physically taken back", () => {
  const baseDeal = DEALS[0];
  const wonWithUnreturnedSample = {
    ...baseDeal,
    id: "D-WON-SMP",
    stage: "won" as const,
    lines: [
      {
        id: "L-WON-1",
        product: "Chopping Board",
        brand: "ChefLine",
        quantity: 50,
        unit: "Pcs" as const,
        unitPrice: 45,
        status: "approved" as const,
        sample: {
          sentAt: "2026-10-25T12:00:00Z",
          feedbackAt: "2026-10-30T12:00:00Z",
          feedback: "Chef liked it",
          sampleQty: 2,
          returnedAt: null,
          returnStatus: "out" as const,
          recipient: "Afsal · Purchasing",
          followUpActivityId: "AC-FU-1",
        },
      },
    ],
  };

  const lostReturnedSample = {
    ...baseDeal,
    id: "D-LOST-SMP",
    stage: "lost" as const,
    lostReason: "Item not in scope" as const,
    lines: [
      {
        id: "L-LOST-1",
        product: "Dry Iron",
        brand: "Philips",
        quantity: 30,
        unit: "Pcs" as const,
        unitPrice: 85,
        status: "rejected" as const,
        rejectReason: "Item not in scope" as const,
        sample: {
          sentAt: "2026-10-15T12:00:00Z",
          feedbackAt: "2026-10-22T12:00:00Z",
          feedback: null,
          sampleQty: 1,
          returnedAt: "2026-10-24T12:00:00Z",
          returnStatus: "returned" as const,
          returnNote: "Collected back in box",
        },
      },
    ],
  };

  const standaloneOut: CustomerSample = {
    id: "SM-100",
    companyId: baseDeal.companyId,
    contactId: null,
    product: "Porcelain Show Plate",
    brand: "Rak",
    sampleQty: 2,
    unit: "Pcs",
    sentAt: "2026-11-03T12:00:00Z",
    returnedAt: null,
    returnStatus: "out",
    verdict: "pending",
    recipientName: "Exec Chef",
    handoverNote: "Dropped off during cold visit",
    returnNote: "",
    followUpActivityId: null,
    owner: "Bishal Karma",
    owner_id: null,
    created_by: null,
    createdAt: "2026-11-03T12:00:00Z",
    updatedAt: "2026-11-03T12:00:00Z",
  };

  const standaloneCancelled: CustomerSample = {
    ...standaloneOut,
    id: "SM-CANCELLED",
    returnStatus: "cancelled",
  };

  const followUpAct: Activity = {
    id: "AC-FU-1",
    companyId: baseDeal.companyId,
    contactId: null,
    dealId: "D-WON-SMP",
    type: "demo",
    report: "Gave chopping board sample",
    occurredAt: "2026-10-25T12:00:00Z",
    task: "Follow up & collect sample: Chopping Board (2 Pcs)",
    taskDueAt: "2026-11-01T12:00:00Z",
    taskDone: false,
    remind: true,
    owner: "Bishal Karma",
    createdAt: "2026-10-25T12:00:00Z",
  };

  const ledger = buildSampleLedger({
    deals: [wonWithUnreturnedSample, lostReturnedSample],
    customerSamples: [standaloneOut, standaloneCancelled],
    companies: COMPANIES,
    contacts: CONTACTS,
    activities: [followUpAct],
    now: fixedNow,
  });

  assert.equal(ledger.length, 3, "cancelled standalone sample excluded");
  // Oldest 'out' first: Chopping Board (18d out) -> Porcelain Plate (9d out) -> Dry Iron (returned, 9d held)
  assert.equal(ledger[0].product, "Chopping Board");
  assert.equal(ledger[0].daysWithCustomer, 18);
  assert.equal(ledger[0].tone, "out-overdue");
  assert.equal(ledger[0].dealAlertNote, "Deal Won — sample still at customer!");
  assert.equal(ledger[0].followUpTask?.id, "AC-FU-1");

  assert.equal(ledger[1].product, "Porcelain Show Plate");
  assert.equal(ledger[1].source, "standalone");
  assert.equal(ledger[1].daysWithCustomer, 9);
  assert.equal(ledger[1].tone, "out-followup");

  assert.equal(ledger[2].product, "Dry Iron");
  assert.equal(ledger[2].returnStatus, "returned");
  assert.equal(ledger[2].daysWithCustomer, 9);

  const stats = computeSampleRegisterStats(ledger);
  assert.equal(stats.outCount, 2);
  assert.equal(stats.overdueCount, 1);
  assert.equal(stats.followUpWindowCount, 1);
  assert.equal(stats.returnedCount, 1);
  assert.equal(stats.avgDaysHeld, 9);
});

console.log("\nBUILD 18.14 — Supabase Mappers & Structural Wiring");

check("toLineItem / fromLineItem round-trip all 7 new custody fields without losing data", () => {
  const row = fromLineItem(
    {
      id: "L-MAP-1",
      product: "Kettle 1L",
      brand: "Aolga",
      quantity: 25,
      unit: "Pcs",
      unitPrice: 110,
      status: "quoted",
      sample: {
        sentAt: "2026-10-28T12:00:00Z",
        feedbackAt: null,
        feedback: null,
        sampleQty: 1,
        returnedAt: "2026-11-04T12:00:00Z",
        returnStatus: "returned",
        recipient: "Taiwo · Storekeeper",
        handoverNote: "With box",
        returnNote: "Good condition",
        followUpActivityId: "AC-99",
      },
    },
    "D-2323",
    0,
  );
  const mapped = toLineItem(row);
  assert.equal(mapped.sample?.sampleQty, 1);
  assert.equal(mapped.sample?.returnedAt, "2026-11-04T12:00:00Z");
  assert.equal(mapped.sample?.returnStatus, "returned");
  assert.equal(mapped.sample?.recipient, "Taiwo · Storekeeper");
  assert.equal(mapped.sample?.handoverNote, "With box");
  assert.equal(mapped.sample?.returnNote, "Good condition");
  assert.equal(mapped.sample?.followUpActivityId, "AC-99");
  assert.equal(
    effectiveSampleReturnStatus(
      mapped.sample?.returnStatus,
      mapped.sample?.returnedAt,
    ),
    "returned",
  );
});

check("toCustomerSample / fromCustomerSample round-trip standalone customer samples", () => {
  const sample: CustomerSample = {
    id: "SM-MAP-1",
    companyId: "C-101",
    contactId: "P-1",
    product: "Espresso Cup",
    brand: "Porcelite",
    sampleQty: 4,
    unit: "Pcs",
    sentAt: "2026-11-01T12:00:00Z",
    returnedAt: null,
    returnStatus: "out",
    verdict: "pending",
    recipientName: "F&B Manager",
    handoverNote: "4 cups left at tasting",
    returnNote: "",
    followUpActivityId: "AC-101",
    owner: "Bishal Karma",
    owner_id: null,
    created_by: null,
    createdAt: "2026-11-01T12:00:00Z",
    updatedAt: "2026-11-01T12:00:00Z",
  };
  const back = toCustomerSample(fromCustomerSample(sample));
  assert.deepEqual(back, sample);
});

check("Left Sidebar Sell section places Samples directly below Activities", () => {
  const navSrc = readFileSync("src/lib/navigation.ts", "utf8");
  const actIdx = navSrc.indexOf('href: "/activities"');
  const smpIdx = navSrc.indexOf('href: "/samples"');
  const reportsIdx = navSrc.indexOf('href: "/reports"');
  assert.ok(actIdx !== -1 && smpIdx > actIdx && reportsIdx > smpIdx);
  assert.match(navSrc, /label:\s*"Samples"/);
});

check("DealDrawer, CompanyDrawer, SamplesPage, and SQL migration are wired cleanly", () => {
  const dealDrawer = readFileSync("src/components/pipeline/deal-drawer.tsx", "utf8");
  const companyDrawer = readFileSync("src/components/companies/company-drawer.tsx", "utf8");
  const samplesPage = readFileSync("src/app/(app)/samples/page.tsx", "utf8");
  const sql = readFileSync("supabase/11-sample-tracking.sql", "utf8");

  assert.match(dealDrawer, /deal\.lines\.some\(\(l\) => Boolean\(l\.sample\?\.sentAt\)\)/);
  assert.equal(
    (companyDrawer.match(/<CustomerSampleCustody/g) ?? []).length,
    2,
    "rendered in both mobile and desktop CompanyDrawer",
  );
  assert.match(samplesPage, /<SamplesView \/>/);
  assert.match(sql, /create table if not exists customer_samples/i);
  assert.match(sql, /add column if not exists sample_returned_at/i);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
