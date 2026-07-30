/*
  The three stored counters must always match the records.

  This is the class of bug that hid the Burj Al Arab suggestion: a counter
  bumped in memory, never recomputed, silently wrong after a reload.
*/
import { recomputeCounters, countersDiffer } from "../src/lib/recompute";
import type { Activity } from "../src/lib/activities";
import type { Deal } from "../src/lib/deals";
import type { Company } from "../src/lib/companies";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const act = (companyId: string, occurredAt: string) =>
  ({ id: Math.random().toString(), companyId, occurredAt }) as Activity;
const deal = (companyId: string, stage: string, value: number) =>
  ({ companyId, stage, value, currency: "AED" }) as Deal;

console.log("\nActivity count");
const A = [act("C1", day(-5)), act("C1", day(-1)), act("C2", day(-3))];
check("counts only this customer", recomputeCounters("C1", A, []).activityCount === 2);
check("other customer unaffected", recomputeCounters("C2", A, []).activityCount === 1);
check("unknown customer is zero", recomputeCounters("C9", A, []).activityCount === 0);

console.log("\nFuture entries are bookings, not history");
const withFuture = [...A, act("C1", day(+7))];
check("future entry not counted", recomputeCounters("C1", withFuture, []).activityCount === 2);
check("future entry not the last contact",
  recomputeCounters("C1", withFuture, []).lastActivityAt === A[1].occurredAt);

console.log("\nLast contact date");
check("newest past entry wins", recomputeCounters("C1", A, []).lastActivityAt === A[1].occurredAt);
check("no activities gives null", recomputeCounters("C9", A, []).lastActivityAt === null);
const reordered = [act("C3", day(-2)), act("C3", day(-30))];
check("order in the array does not matter",
  recomputeCounters("C3", reordered, []).lastActivityAt === reordered[0].occurredAt);

console.log("\nLifetime value counts won deals only");
const D = [deal("C1","won",1000), deal("C1","lost",5000), deal("C1","negotiation",9000), deal("C2","won",250)];
check("sums won only", recomputeCounters("C1", [], D).lifetimeValue === 1000);
check("lost excluded", recomputeCounters("C1", [], D).lifetimeValue !== 6000);
check("open excluded", recomputeCounters("C1", [], D).lifetimeValue !== 10000);
check("per customer", recomputeCounters("C2", [], D).lifetimeValue === 250);

console.log("\nCurrency is converted before summing");
const eur = [{ companyId: "C4", stage: "won", value: 100, currency: "EUR" } as Deal];
check("converter applied", recomputeCounters("C4", [], eur, (v) => v * 4).lifetimeValue === 400);

console.log("\ncountersDiffer guards a pointless write");
const base = { activityCount: 2, lastActivityAt: A[1].occurredAt, lifetimeValue: 1000 } as Company;
check("no change is detected", !countersDiffer(base, recomputeCounters("C1", A, D)));
check("count change detected", countersDiffer({ ...base, activityCount: 5 }, recomputeCounters("C1", A, D)));
check("value change detected", countersDiffer({ ...base, lifetimeValue: 99 }, recomputeCounters("C1", A, D)));
check("date change detected", countersDiffer({ ...base, lastActivityAt: null }, recomputeCounters("C1", A, D)));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
