import type { CurrencyCode } from "@/lib/currency";
import { wonValue } from "@/lib/deal-model";
import type { Deal } from "@/lib/deals";
import { supabase } from "@/lib/supabase";

export const CREDIT_DAYS = 45;

export type LedgerDelivery = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  poNumber: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  source: "deal" | "manual";
  dealId?: string;
  paidAmount?: number;
};

export type LedgerPayment = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  method: "Bank Transfer" | "Cheque" | "Cash" | "Card";
  reference: string;
  amount: number;
  currency: CurrencyCode;
  deliveryId?: string;
  note?: string;
};

export type StatementEntry = {
  id: string;
  kind: "delivery" | "payment";
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  currency: CurrencyCode;
  aging?: {
    label: string;
    tone: "paid" | "ok" | "due" | "overdue";
    daysElapsed: number;
    daysRemaining: number;
  };
};

export type StatementSummary = {
  totalDelivered: number;
  totalCollected: number;
  balanceDue: number;
  overdueAmount: number;
  entries: StatementEntry[];
  deliveries: LedgerDelivery[];
};

const STORAGE_PREFIX = "bishal_crm_soa_v1_";

export function loadCustomerLedgerExtras(companyId: string): {
  deliveries: LedgerDelivery[];
  payments: LedgerPayment[];
} {
  if (typeof window === "undefined") return { deliveries: [], payments: [] };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${companyId}`);
    if (!raw) return { deliveries: [], payments: [] };
    const parsed = JSON.parse(raw);
    return {
      deliveries: Array.isArray(parsed.deliveries) ? parsed.deliveries : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    };
  } catch {
    return { deliveries: [], payments: [] };
  }
}

export function saveCustomerLedgerExtras(
  companyId: string,
  data: { deliveries: LedgerDelivery[]; payments: LedgerPayment[] },
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(data));
}

export async function syncCustomerLedgerFromSupabase(companyId?: string): Promise<void> {
  if (!supabase) return;
  const query = supabase.from("customer_ledger_entries").select("*");
  const { data, error } = companyId ? await query.eq("company_id", companyId) : await query;
  if (error || !data) return;

  const byCompany = new Map<string, { deliveries: LedgerDelivery[]; payments: LedgerPayment[] }>();
  for (const row of data) {
    const cid = String(row.company_id);
    let bucket = byCompany.get(cid);
    if (!bucket) {
      bucket = { deliveries: [], payments: [] };
      byCompany.set(cid, bucket);
    }
    if (row.kind === "delivery") {
      bucket.deliveries.push({
        id: String(row.id),
        date: String(row.entry_date),
        poNumber: row.po_number ? String(row.po_number) : "PO",
        invoiceNumber: row.invoice_number ? String(row.invoice_number) : "INV",
        description: row.description ? String(row.description) : "Delivery",
        amount: Number(row.amount) || 0,
        currency: (row.currency as CurrencyCode) || "AED",
        source: "manual",
        dealId: row.deal_id ? String(row.deal_id) : undefined,
      });
    } else if (row.kind === "payment") {
      bucket.payments.push({
        id: String(row.id),
        date: String(row.entry_date),
        method: (row.method as LedgerPayment["method"]) || "Bank Transfer",
        reference: row.reference ? String(row.reference) : "",
        amount: Number(row.amount) || 0,
        currency: (row.currency as CurrencyCode) || "AED",
        deliveryId: row.delivery_id ? String(row.delivery_id) : undefined,
        note: row.description ? String(row.description) : undefined,
      });
    }
  }

  for (const [cid, bucket] of byCompany.entries()) {
    saveCustomerLedgerExtras(cid, bucket);
  }
}

export async function persistLedgerDelivery(companyId: string, delivery: LedgerDelivery): Promise<void> {
  const extras = loadCustomerLedgerExtras(companyId);
  saveCustomerLedgerExtras(companyId, {
    ...extras,
    deliveries: [...extras.deliveries, delivery],
  });
  if (!supabase) return;
  await supabase.from("customer_ledger_entries").upsert({
    id: delivery.id,
    company_id: companyId,
    kind: "delivery",
    entry_date: delivery.date,
    po_number: delivery.poNumber,
    invoice_number: delivery.invoiceNumber,
    description: delivery.description,
    amount: delivery.amount,
    currency: delivery.currency,
    deal_id: delivery.dealId ?? null,
  });
}

export async function persistLedgerPayment(companyId: string, payment: LedgerPayment): Promise<void> {
  const extras = loadCustomerLedgerExtras(companyId);
  saveCustomerLedgerExtras(companyId, {
    ...extras,
    payments: [...extras.payments, payment],
  });
  if (!supabase) return;
  await supabase.from("customer_ledger_entries").upsert({
    id: payment.id,
    company_id: companyId,
    kind: "payment",
    entry_date: payment.date,
    method: payment.method,
    reference: payment.reference,
    description: payment.note ?? null,
    amount: payment.amount,
    currency: payment.currency,
    delivery_id: payment.deliveryId ?? null,
  });
}

function computeAging(
  deliveryDateIso: string,
  isPaid: boolean,
  nowMs: number,
): StatementEntry["aging"] {
  if (isPaid) {
    return { label: "Paid", tone: "paid", daysElapsed: 0, daysRemaining: 0 };
  }
  const ms = new Date(deliveryDateIso).getTime();
  const daysElapsed = Number.isFinite(ms)
    ? Math.max(0, Math.floor((nowMs - ms) / 86_400_000))
    : 0;
  const daysRemaining = CREDIT_DAYS - daysElapsed;

  if (daysRemaining < 0) {
    return {
      label: `Overdue ${Math.abs(daysRemaining)}d`,
      tone: "overdue",
      daysElapsed,
      daysRemaining,
    };
  }
  if (daysRemaining === 0) {
    return {
      label: "Due today",
      tone: "due",
      daysElapsed,
      daysRemaining: 0,
    };
  }
  return {
    label: `${daysRemaining}d left`,
    tone: daysRemaining <= 7 ? "due" : "ok",
    daysElapsed,
    daysRemaining,
  };
}

export function buildCustomerStatement(
  companyId: string,
  deals: Deal[],
  convert: (amount: number, from: CurrencyCode) => number,
  displayCurrency: CurrencyCode,
  nowMs = Date.now(),
): StatementSummary {
  const extras = loadCustomerLedgerExtras(companyId);

  const dealDeliveries: LedgerDelivery[] = [];
  const dealPayments: LedgerPayment[] = [];

  for (const deal of deals) {
    if (deal.companyId !== companyId) continue;
    const f = deal.fulfilment;
    if (!f?.deliveredAt) continue;

    const amount = convert(wonValue(deal.lines) || deal.value, deal.currency);
    if (amount <= 0) continue;

    const deliveryId = `deal-del-${deal.id}`;
    dealDeliveries.push({
      id: deliveryId,
      date: f.deliveredAt.slice(0, 10),
      poNumber: f.poNumber || "PO",
      invoiceNumber: deal.id.slice(0, 8).toUpperCase(),
      description: `${deal.title}${f.deliveryNote ? ` — ${f.deliveryNote}` : ""}`,
      amount,
      currency: displayCurrency,
      source: "deal",
      dealId: deal.id,
    });

    if (f.paidAt) {
      dealPayments.push({
        id: `deal-pmt-${deal.id}`,
        date: f.paidAt.slice(0, 10),
        method: "Bank Transfer",
        reference: f.poNumber ? `PMT (${f.poNumber})` : "Payment",
        amount,
        currency: displayCurrency,
        deliveryId,
        note: `Paid for ${deal.title}`,
      });
    }
  }

  const allDeliveries = [
    ...dealDeliveries,
    ...extras.deliveries.map((d) => ({
      ...d,
      amount: convert(d.amount, d.currency),
      currency: displayCurrency,
    })),
  ];

  const allPayments = [
    ...dealPayments,
    ...extras.payments.map((p) => ({
      ...p,
      amount: convert(p.amount, p.currency),
      currency: displayCurrency,
    })),
  ];

  const paidByDelivery = new Map<string, number>();
  let unallocatedCredit = 0;

  for (const p of allPayments) {
    if (p.deliveryId) {
      paidByDelivery.set(
        p.deliveryId,
        (paidByDelivery.get(p.deliveryId) ?? 0) + p.amount,
      );
    } else {
      unallocatedCredit += p.amount;
    }
  }

  const sortedDeliveries = allDeliveries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const d of sortedDeliveries) {
    if (unallocatedCredit <= 0) break;
    const already = paidByDelivery.get(d.id) ?? 0;
    const remaining = Math.max(0, d.amount - already);
    if (remaining > 0) {
      const apply = Math.min(remaining, unallocatedCredit);
      paidByDelivery.set(d.id, already + apply);
      unallocatedCredit -= apply;
    }
  }

  type RawRow = {
    id: string;
    kind: "delivery" | "payment";
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    aging?: StatementEntry["aging"];
  };

  const rawRows: RawRow[] = [
    ...sortedDeliveries.map((d) => {
      const paid = paidByDelivery.get(d.id) ?? 0;
      const isPaid = paid >= d.amount - 0.01;
      return {
        id: d.id,
        kind: "delivery" as const,
        date: d.date,
        reference: [d.poNumber, d.invoiceNumber].filter(Boolean).join(" · "),
        description: d.description,
        debit: d.amount,
        credit: 0,
        aging: computeAging(d.date, isPaid, nowMs),
      };
    }),
    ...allPayments.map((p) => ({
      id: p.id,
      kind: "payment" as const,
      date: p.date,
      reference: p.reference || p.method,
      description: p.note ? `${p.method} — ${p.note}` : p.method,
      debit: 0,
      credit: p.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  const entries: StatementEntry[] = rawRows.map((row) => {
    runningBalance += row.debit - row.credit;
    return {
      ...row,
      runningBalance,
      currency: displayCurrency,
    };
  });

  const totalDelivered = sortedDeliveries.reduce((s, d) => s + d.amount, 0);
  const totalCollected = allPayments.reduce((s, p) => s + p.amount, 0);
  const balanceDue = Math.max(0, totalDelivered - totalCollected);
  const overdueAmount = sortedDeliveries.reduce((sum, d) => {
    const paid = paidByDelivery.get(d.id) ?? 0;
    const unpaid = Math.max(0, d.amount - paid);
    if (unpaid <= 0.01) return sum;
    const aging = computeAging(d.date, false, nowMs);
    return aging?.tone === "overdue" ? sum + unpaid : sum;
  }, 0);

  return {
    totalDelivered,
    totalCollected,
    balanceDue,
    overdueAmount,
    entries,
    deliveries: sortedDeliveries,
  };
}
