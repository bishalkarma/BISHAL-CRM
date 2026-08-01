/*
  Per-line sampling, and the money that follows from it.

  The rules under test are the ten signed off in mockup 241.
*/
import { DEALS } from "../src/lib/deals";
import { dealTotals, lossReasons, samplesAwaiting } from "../src/lib/dashboard-metrics";
import { dealValue, rejectedValue, lineTotal } from "../src/lib/deal-model";
import type { Deal } from "../src/lib/deals";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};
const id = (n: number) => n;

console.log("\nDeal Loss counts the rejected lines, not a value that excludes them");
const lost = DEALS.filter((d) => d.stage === "lost");
const t = dealTotals(DEALS, id);
check("a lost deal exists in the seed", lost.length > 0);
check("its dealValue is zero", dealValue(lost[0].lines) === 0);
check("but rejected lines carry value", rejectedValue(lost[0].lines) > 0);
check("Deal Loss no longer reports zero", t.lostValue > 0, String(t.lostValue));
check("Deal Loss equals the rejected lines", t.lostValue === rejectedValue(lost[0].lines));

console.log("\nWhy we lose counts lines, from any deal");
const rows = lossReasons(DEALS, "all", id);
const hits = rows.flatMap((r) => r.lines);
const rejectedEverywhere = DEALS.flatMap((d) =>
  d.lines.filter((l) => l.status === "rejected" && l.rejectReason),
);
check("every rejected line is counted", hits.length === rejectedEverywhere.length,
  `${hits.length} vs ${rejectedEverywhere.length}`);
check("includes a line inside a WON deal",
  hits.some((h) => h.deal.stage === "won"));
check("total equals the sum of those lines",
  Math.round(rows.reduce((s, r) => s + r.value, 0)) ===
  Math.round(rejectedEverywhere.reduce((s, l) => s + lineTotal(l), 0)));
check("still four reasons listed", rows.length === 4);
check("sorted by value", rows.every((r, i) => i === 0 || rows[i - 1].value >= r.value));

console.log("\nNo double counting");
const wonDeals = DEALS.filter((d) => d.stage === "won");
const wonValue = wonDeals.reduce((s, d) => s + dealValue(d.lines), 0);
const rejectedInsideWon = wonDeals.reduce((s, d) => s + rejectedValue(d.lines), 0);
check("won value excludes its rejected lines", t.wonValue === wonValue);
check("that money is in Why we lose instead", rejectedInsideWon > 0 &&
  Math.round(rows.reduce((s, r) => s + r.value, 0)) >= Math.round(rejectedInsideWon));

console.log("\nSamples: only sampling deals, only sampled lines");
const s = samplesAwaiting(DEALS, "all", id);
check("something is waiting", s.length > 0);
check("every row is a sampling deal", s.every((r) => r.deal.stage === "sampling"));
check("every row was actually sent", s.every((r) => r.line.sample?.sentAt));
check("none has feedback yet", s.every((r) => r.line.sample?.feedbackAt === null));
check("unsampled lines are absent",
  !s.some((r) => r.line.product === "House blend 1kg"));
check("carries the line value", s.every((r) => r.value === lineTotal(r.line)));
check("oldest first", s.every((r, i) => i === 0 || s[i - 1].daysWaiting >= r.daysWaiting));

console.log("\nA won or lost deal never asks for feedback");
const fake = (stage: Deal["stage"]): Deal => ({
  ...DEALS.find((d) => d.stage === "sampling")!,
  id: "X",
  stage,
});
check("won deal excluded", samplesAwaiting([fake("won")], "all", id).length === 0);
check("lost deal excluded", samplesAwaiting([fake("lost")], "all", id).length === 0);
check("sampling deal included", samplesAwaiting([fake("sampling")], "all", id).length > 0);

console.log("\nWin rate still counts whole deals");
check("won count is deals, not lines", t.wonCount === wonDeals.length);
check("rate uses closed deals",
  t.winRate === Math.round((t.wonCount / (t.wonCount + t.lostCount)) * 100));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
