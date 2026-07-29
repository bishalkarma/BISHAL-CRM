/* Verifies the stage warning shown before deleting an activity. */
import { stageAfterDelete, type SpancopSignals } from "../src/lib/spancop";

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

const base: SpancopSignals = {
  profileComplete: false,
  activityCount: 0,
  openDealCount: 0,
  lastClosedDealOutcome: undefined,
  hasPurchaseOrder: false,
  awaitingPayment: false,
  hasEverOrdered: false,
};

console.log("\nWarns when the last activity goes");
const only = { ...base, activityCount: 1 };
const r1 = stageAfterDelete(only, "approach");
check("approach -> suspect warned", r1?.to === "suspect", JSON.stringify(r1));

const onlyComplete = { ...base, activityCount: 1, profileComplete: true };
const r2 = stageAfterDelete(onlyComplete, "approach");
check("approach -> prospect when profile complete", r2?.to === "prospect", JSON.stringify(r2));

console.log("\nStays silent when nothing moves");
const many = { ...base, activityCount: 5 };
check("5 activities -> no warning", stageAfterDelete(many, "approach") === null);

const withDeal = { ...base, activityCount: 1, openDealCount: 2 };
check("open deal holds Negotiate", stageAfterDelete(withDeal, "negotiate") === null);

const ordered = { ...base, activityCount: 1, hasEverOrdered: true };
check("existing customer stays Approach", stageAfterDelete(ordered, "approach") === null);

const paying = { ...base, activityCount: 1, awaitingPayment: true, hasPurchaseOrder: true };
check("payment stage unaffected", stageAfterDelete(paying, "payment") === null);

console.log("\nEdge cases");
check("zero activities returns null", stageAfterDelete(base, "suspect") === null);
check("manual stage override is respected",
  stageAfterDelete({ ...base, activityCount: 1 }, "order") === null);

const r3 = stageAfterDelete({ ...base, activityCount: 1 }, "approach");
check("from is the current stage", r3?.from === "approach");

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
