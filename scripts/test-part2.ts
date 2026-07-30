/* Part 2: the order chain, over-payment as credit, and undo. */
import {
  EMPTY_FULFILMENT,
  amountOwed,
  creditBalance,
  balanceOutstanding,
  nextFulfilmentAction,
  fulfilmentStage,
  type Fulfilment,
} from "../src/lib/deal-model";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, e = "") => {
  if (c) { pass++; console.log(`  ok   ${n}`); }
  else { fail++; console.log(`  FAIL ${n} ${e}`); }
};
const f = (p: Partial<Fulfilment> = {}): Fulfilment => ({ ...EMPTY_FULFILMENT, ...p });
const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

console.log("\nOne action at a time");
check("won deal asks for a PO", nextFulfilmentAction(f()) === "po");
check("PO in hand asks for delivery", nextFulfilmentAction(f({ poNumber: "PO-1" })) === "delivery");
check("delivered asks for payment",
  nextFulfilmentAction(f({ poNumber: "PO-1", deliveredAt: ago(2) })) === "payment");
check("settled asks for nothing",
  nextFulfilmentAction(f({ poNumber: "PO-1", deliveredAt: ago(2), paidAt: ago(1) })) === null);
check("payment can never precede delivery",
  nextFulfilmentAction(f({ poNumber: "PO-1" })) !== "payment");

console.log("\nTracker reflects the furthest step");
check("won", fulfilmentStage(f()) === "won");
check("po", fulfilmentStage(f({ poNumber: "PO-1" })) === "po");
check("delivered", fulfilmentStage(f({ poNumber: "PO-1", deliveredAt: ago(1) })) === "delivered");
check("paid", fulfilmentStage(f({ paidAt: ago(1) })) === "paid");

console.log("\nOver-payment is carried as credit, not rejected");
const over = f({ deliveredAt: ago(5), amountReceived: 120000 });
check("balance goes negative", balanceOutstanding(100000, over) === -20000);
check("credit is the excess", creditBalance(100000, over) === 20000);
check("nothing is owed", amountOwed(100000, over) === 0);
check("exact payment leaves no credit", creditBalance(100000, f({ amountReceived: 100000 })) === 0);

console.log("\nCash to collect can never be inflated by a credit");
check("underpaid counts the shortfall",
  amountOwed(100000, f({ deliveredAt: ago(3), amountReceived: 40000 })) === 60000);
check("overpaid counts zero, not a negative",
  amountOwed(100000, f({ deliveredAt: ago(3), amountReceived: 150000 })) === 0);
check("settled counts zero",
  amountOwed(100000, f({ paidAt: ago(1), amountReceived: 100000 })) === 0);

console.log("\nUndo clears the step and everything after it");
// Mirrors the provider: undoing a step resets it plus all later steps.
const undo = (step: "po" | "delivery" | "payment"): Partial<Fulfilment> =>
  step === "po"
    ? { ...EMPTY_FULFILMENT }
    : step === "delivery"
      ? { deliveredAt: null, partialDelivery: false, deliveryNote: null, paidAt: null, amountReceived: 0 }
      : { paidAt: null, amountReceived: 0 };

const full = f({ poNumber: "PO-1", poDate: ago(9), deliveredAt: ago(5), amountReceived: 50000 });
const afterPoUndo = { ...full, ...undo("po") };
check("undo PO clears delivery too", afterPoUndo.deliveredAt === null);
check("undo PO clears money too", afterPoUndo.amountReceived === 0);
check("undo PO returns to the start", nextFulfilmentAction(afterPoUndo) === "po");

const afterDeliveryUndo = { ...full, ...undo("delivery") };
check("undo delivery keeps the PO", afterDeliveryUndo.poNumber === "PO-1");
check("undo delivery clears money", afterDeliveryUndo.amountReceived === 0);
check("undo delivery asks for delivery again", nextFulfilmentAction(afterDeliveryUndo) === "delivery");

const afterPaymentUndo = { ...full, ...undo("payment") };
check("undo payment keeps the delivery", afterPaymentUndo.deliveredAt !== null);
check("undo payment asks for payment again", nextFulfilmentAction(afterPaymentUndo) === "payment");

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
