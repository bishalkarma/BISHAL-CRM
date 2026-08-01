/* Verifies the five new dashboard tiles against the seed data. */
import { DEALS } from "../src/lib/deals";
import { COMPANIES } from "../src/lib/companies";
import {
  lossReasons,
  topProducts,
  productsByCustomer,
  expectedToClose,
  samplesAwaiting,
  cashToCollect,
} from "../src/lib/dashboard-metrics";

const id = (n: number) => n;
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log("\nWhy we lose");
const lost = lossReasons(DEALS, "all", id);
check("returns all four reasons", lost.length === 4, `got ${lost.length}`);
// Counted per rejected LINE now, from won, lost and open deals alike.
check("counts every rejected line", lost.reduce((s, r) => s + r.count, 0) ===
  DEALS.flatMap(d => d.lines.filter(l => l.status === "rejected" && l.rejectReason)).length);
check("sorted by value desc", lost.every((r, i) => i === 0 || lost[i-1].value >= r.value));
check("week window is a subset of all", lossReasons(DEALS, "week", id).reduce((s,r)=>s+r.count,0) <= lost.reduce((s,r)=>s+r.count,0));

console.log("\nTop products");
const prods = topProducts(DEALS, "all", id);
check("only open deals feed it", prods.every(p => p.deals.every(d => d.deal.stage !== "won" && d.deal.stage !== "lost")));
check("no rejected lines counted", prods.every(p => p.value > 0));
check("sorted by value desc", prods.every((p, i) => i === 0 || prods[i-1].value >= p.value));
check("quantity is positive", prods.every(p => p.quantity > 0));

console.log("\nBy customer");
const byCust = productsByCustomer(DEALS, "all", id);
check("sorted by total value desc", byCust.every((c, i) => i === 0 || byCust[i-1].value >= c.value));
check("customer totals equal product totals",
  Math.abs(byCust.reduce((s,c)=>s+c.value,0) - prods.reduce((s,p)=>s+p.value,0)) < 1,
  `${byCust.reduce((s,c)=>s+c.value,0)} vs ${prods.reduce((s,p)=>s+p.value,0)}`);
check("every customer has at least one line", byCust.every(c => c.lines.length > 0));

console.log("\nExpected to close");
const exp = expectedToClose(DEALS, "all", id);
check("open deals only", exp.every(r => r.deal.stage !== "won" && r.deal.stage !== "lost"));
check("no on-hold deals", exp.every(r => !r.deal.onHold));
check("weighted <= value", exp.every(r => r.weighted <= r.value + 0.01));
check("sorted by close date asc", exp.every((r, i) => i === 0 || new Date(exp[i-1].deal.expectedCloseDate) <= new Date(r.deal.expectedCloseDate)));

console.log("\nSamples awaiting");
const samples = samplesAwaiting(DEALS, "all");
// Sampling moved to the line item, so the check follows it there.
check("all lack feedback", samples.every(s => s.line.sample?.feedbackAt === null));
check("days waiting positive", samples.every(s => s.daysWaiting >= 0));
check("oldest first", samples.every((s, i) => i === 0 || samples[i-1].daysWaiting >= s.daysWaiting));

console.log("\nCash to collect");
const cash = cashToCollect(COMPANIES, DEALS, "all", id);
/* Cash to collect now derives from the DEALS, not the stored company flags
   that nothing ever wrote to. Assert against the real source of truth. */
check("every row has a delivered, unpaid deal", cash.every((c) =>
  DEALS.some((d) =>
    d.companyId === c.company.id &&
    d.stage === "won" &&
    d.fulfilment.deliveredAt !== null &&
    d.fulfilment.paidAt === null)));
check("every row shows a positive balance", cash.every((c) => c.value > 0));
check("days outstanding positive", cash.every(c => c.daysOutstanding >= 0));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
