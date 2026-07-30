/* Part 1 of C-O-P: fulfilment model, rule order, derived flags, cash tile. */
import {
  EMPTY_FULFILMENT,
  fulfilmentStage,
  balanceOutstanding,
  creditBalance,
  amountOwed,
  daysSinceDelivery,
  ageingTone,
  isAwaitingPayment,
  type Fulfilment,
} from "../src/lib/deal-model";
import { suggestSpancopStage, fulfilmentSignals } from "../src/lib/spancop";
import { cashToCollect } from "../src/lib/dashboard-metrics";
import { DEALS } from "../src/lib/deals";
import { COMPANIES } from "../src/lib/companies";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};
const day = 86_400_000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
const f = (o: Partial<Fulfilment>): Fulfilment => ({ ...EMPTY_FULFILMENT, ...o });

console.log("\nFulfilment stage");
check("fresh win is 'won'", fulfilmentStage(EMPTY_FULFILMENT) === "won");
check("PO recorded is 'po'", fulfilmentStage(f({ poNumber: "PO-1" })) === "po");
check("delivered is 'delivered'", fulfilmentStage(f({ poNumber: "PO-1", deliveredAt: ago(2) })) === "delivered");
check("paid is 'paid'", fulfilmentStage(f({ poNumber: "PO-1", deliveredAt: ago(2), paidAt: ago(1) })) === "paid");

console.log("\nBalance outstanding");
check("nothing paid = full value", balanceOutstanding(100000, EMPTY_FULFILMENT) === 100000);
check("part paid subtracts", balanceOutstanding(100000, f({ amountReceived: 40000 })) === 60000);
check("paid in full = zero", balanceOutstanding(100000, f({ paidAt: ago(1), amountReceived: 100000 })) === 0);
// Over-payment is allowed and carried as credit, per the agreed rule.
check("over-payment shows a negative balance", balanceOutstanding(100000, f({ amountReceived: 120000 })) === -20000);
check("credit balance is the excess", creditBalance(100000, f({ amountReceived: 120000 })) === 20000);
check("no credit when underpaid", creditBalance(100000, f({ amountReceived: 40000 })) === 0);
check("amountOwed never negative", amountOwed(100000, f({ amountReceived: 120000 })) === 0);
check("amountOwed is the shortfall", amountOwed(100000, f({ amountReceived: 40000 })) === 60000);
check("amountOwed zero once settled", amountOwed(100000, f({ paidAt: ago(1), amountReceived: 100000 })) === 0);

console.log("\nAgeing clock");
check("no delivery = null", daysSinceDelivery(EMPTY_FULFILMENT) === null);
check("counts from delivery", daysSinceDelivery(f({ deliveredAt: ago(26) })) === 26);
check("under 30 is fresh", ageingTone(26) === "fresh");
check("30-60 is chase", ageingTone(45) === "chase");
check("over 60 is risk", ageingTone(71) === "risk");
check("PO date does not start the clock", daysSinceDelivery(f({ poDate: ago(90) })) === null);

console.log("\nAwaiting payment");
check("delivered + unpaid = owed", isAwaitingPayment(f({ deliveredAt: ago(5) })));
check("not delivered = not owed", !isAwaitingPayment(f({ poNumber: "PO-1" })));
check("paid = not owed", !isAwaitingPayment(f({ deliveredAt: ago(5), paidAt: ago(1) })));

console.log("\nRule order — furthest point wins (the old trap)");
const base = {
  profileComplete: true, activityCount: 3, openDealCount: 0,
  lastClosedDealOutcome: undefined, hasPurchaseOrder: false,
  awaitingPayment: false, hasEverOrdered: false,
};
check("owed money beats a new enquiry",
  suggestSpancopStage({ ...base, openDealCount: 1, awaitingPayment: true }).stage === "payment");
check("PO beats a new enquiry",
  suggestSpancopStage({ ...base, openDealCount: 1, hasPurchaseOrder: true }).stage === "order");
check("payment beats PO",
  suggestSpancopStage({ ...base, hasPurchaseOrder: true, awaitingPayment: true }).stage === "payment");
check("plain open deal still negotiates",
  suggestSpancopStage({ ...base, openDealCount: 2 }).stage === "negotiate");
check("won with no PO is close",
  suggestSpancopStage({ ...base, lastClosedDealOutcome: "won" }).stage === "close");
check("paid-up customer rests at approach",
  suggestSpancopStage({ ...base, hasEverOrdered: true }).stage === "approach");

console.log("\nDerived company flags");
const d = (stage: string, ful: Partial<Fulfilment>) => ({ stage, fulfilment: { ...EMPTY_FULFILMENT, ...ful } });
check("PO only -> hasPurchaseOrder",
  fulfilmentSignals([d("won", { poNumber: "P1" })]).hasPurchaseOrder);
check("PO only -> not awaiting payment",
  !fulfilmentSignals([d("won", { poNumber: "P1" })]).awaitingPayment);
check("delivered -> awaiting payment",
  fulfilmentSignals([d("won", { poNumber: "P1", deliveredAt: ago(3) })]).awaitingPayment);
check("delivered -> no longer 'has PO' pending",
  !fulfilmentSignals([d("won", { poNumber: "P1", deliveredAt: ago(3) })]).hasPurchaseOrder);
check("paid -> hasEverOrdered",
  fulfilmentSignals([d("won", { poNumber: "P1", deliveredAt: ago(9), paidAt: ago(1) })]).hasEverOrdered);
check("open deals are ignored",
  !fulfilmentSignals([d("negotiation", { poNumber: "P1" })]).hasPurchaseOrder);

console.log("\nCash to collect, against the seed");
const id = (n: number) => n;
const cash = cashToCollect(COMPANIES, DEALS, "all", id);
check("only delivered-unpaid customers appear", cash.length === 1, `got ${cash.length}`);
const owed = DEALS.find((x) => x.stage === "won" && x.fulfilment.deliveredAt)!;
check("shows the BALANCE not the invoice",
  cash[0]?.value === owed.value - owed.fulfilment.amountReceived &&
    cash[0].value < owed.value,
  `tile ${cash[0]?.value} vs invoice ${owed.value}`);
check("part payment is subtracted", cash[0]?.value === (DEALS.find(x => x.stage === "won" && x.fulfilment.deliveredAt)?.value ?? 0) - 120000,
  `got ${cash[0]?.value}`);
check("ageing tone computed", ["fresh","chase","risk"].includes(cash[0]?.tone ?? ""));
check("34 days -> chase", cash[0]?.tone === "chase", `days=${cash[0]?.daysOutstanding}`);
check("PO-only deal is NOT cash owed", !cash.some(r => r.company.id === "C-009"));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
