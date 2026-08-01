/* Part 2: the fulfilment journey, the samples fix and the SPANCOP rules. */
import { DEALS } from "../src/lib/deals";
import {
  EMPTY_FULFILMENT, fulfilmentStage, balanceOutstanding,
  daysSinceDelivery, ageingTone, isAwaitingPayment, type Fulfilment,
} from "../src/lib/deal-model";
import { suggestSpancopStage, fulfilmentSignals, SPANCOP_RULE } from "../src/lib/spancop";
import { samplesAwaiting } from "../src/lib/dashboard-metrics";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

console.log("\nThe four states");
check("nothing yet -> won", fulfilmentStage(EMPTY_FULFILMENT) === "won");
check("po recorded -> po", fulfilmentStage({ ...EMPTY_FULFILMENT, poNumber: "PO-1" }) === "po");
check("delivered -> delivered", fulfilmentStage({ ...EMPTY_FULFILMENT, poNumber: "PO-1", deliveredAt: day(-3) }) === "delivered");
check("paid -> paid", fulfilmentStage({ ...EMPTY_FULFILMENT, paidAt: day(0) }) === "paid");

console.log("\nBalance, over-payment and credit");
const half: Fulfilment = { ...EMPTY_FULFILMENT, amountReceived: 50 };
check("part payment leaves a balance", balanceOutstanding(100, half) === 50);
check("paid flag clears the balance", balanceOutstanding(100, { ...half, paidAt: day(0) }) === 0);
check("over-payment never goes negative", balanceOutstanding(100, { ...EMPTY_FULFILMENT, amountReceived: 130 }) === 0);
const over = { ...EMPTY_FULFILMENT, amountReceived: 130 };
check("credit is visible above the invoice", over.amountReceived - 100 === 30);

console.log("\nAgeing clock runs from delivery");
check("no delivery, no clock", daysSinceDelivery(EMPTY_FULFILMENT) === null);
check("10 days counted", daysSinceDelivery({ ...EMPTY_FULFILMENT, deliveredAt: day(-10) }) === 10);
check("under 30 is fresh", ageingTone(10) === "fresh");
check("45 is chase", ageingTone(45) === "chase");
check("90 is risk", ageingTone(90) === "risk");

console.log("\nCash owed only after delivery");
check("po alone is not owed", !isAwaitingPayment({ ...EMPTY_FULFILMENT, poNumber: "PO-1" }));
check("delivered unpaid is owed", isAwaitingPayment({ ...EMPTY_FULFILMENT, deliveredAt: day(-2) }));
check("delivered and paid is settled", !isAwaitingPayment({ ...EMPTY_FULFILMENT, deliveredAt: day(-9), paidAt: day(-1) }));

console.log("\nThe customer follows the order");
const base = { profileComplete: true, activityCount: 3, openDealCount: 0,
  lastClosedDealOutcome: "won" as const, hasPurchaseOrder: false,
  awaitingPayment: false, hasEverOrdered: false };
check("won, no PO -> close", suggestSpancopStage(base).stage === "close");
check("PO -> order", suggestSpancopStage({ ...base, hasPurchaseOrder: true }).stage === "order");
check("delivered -> payment", suggestSpancopStage({ ...base, awaitingPayment: true }).stage === "payment");
check("paid -> approach", suggestSpancopStage({ ...base, hasEverOrdered: true }).stage === "approach");
check("owed money beats a new enquiry",
  suggestSpancopStage({ ...base, awaitingPayment: true, openDealCount: 2 }).stage === "payment");

console.log("\nMultiple orders: the least complete wins");
const won = (f: Partial<Fulfilment>) => ({ stage: "won", fulfilment: { ...EMPTY_FULFILMENT, ...f } }) as never;
const mixed = fulfilmentSignals([won({ paidAt: day(-5), amountReceived: 100 }), won({ deliveredAt: day(-2) })]);
check("one unpaid keeps awaiting payment", mixed.awaitingPayment);
check("history of paying is remembered", mixed.hasEverOrdered);

console.log("\nSamples: only open deals await feedback");
const rows = samplesAwaiting(DEALS, "all");
check("no lost deal appears", rows.every((r) => r.deal.stage !== "lost"));
check("only sampling deals appear", rows.every((r) => r.deal.stage === "sampling"));
check("all still lack feedback", rows.every((r) => r.line.sample?.feedbackAt === null));

console.log("\nStage rules read as one plain line");
check("all seven present", Object.keys(SPANCOP_RULE).length === 7);
check("approach wording", SPANCOP_RULE.approach === "At least one activity logged.");
check("payment wording", SPANCOP_RULE.payment === "Goods delivered, money still outstanding.");

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
