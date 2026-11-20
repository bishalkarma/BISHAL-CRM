"use client";

import * as React from "react";
import { Plus, Printer, Receipt, Truck } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Deal } from "@/lib/deals";
import {
  buildCustomerStatement,
  persistLedgerDelivery,
  persistLedgerPayment,
  syncCustomerLedgerFromSupabase,
  type LedgerDelivery,
  type LedgerPayment,
} from "@/lib/statement-of-account";

export function StatementOfAccountTab({
  companyId,
  companyName,
  deals,
}: {
  companyId: string;
  companyName?: string;
  deals: Deal[];
}) {
  const { display: currency, toDisplay: convert, format } = useCurrency();
  const [version, setVersion] = React.useState(0);
  const [mode, setMode] = React.useState<"none" | "delivery" | "payment">("none");

  const [delDate, setDelDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [delPo, setDelPo] = React.useState("");
  const [delInv, setDelInv] = React.useState("");
  const [delDesc, setDelDesc] = React.useState("");
  const [delAmount, setDelAmount] = React.useState("");

  const [pmtDate, setPmtDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [pmtMethod, setPmtMethod] = React.useState<LedgerPayment["method"]>("Bank Transfer");
  const [pmtRef, setPmtRef] = React.useState("");
  const [pmtAmount, setPmtAmount] = React.useState("");
  const [pmtDeliveryId, setPmtDeliveryId] = React.useState("");

  React.useEffect(() => {
    void syncCustomerLedgerFromSupabase(companyId).then(() =>
      setVersion((v) => v + 1),
    );
  }, [companyId]);

  const summary = React.useMemo(
    () => buildCustomerStatement(companyId, deals, convert, currency),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, deals, convert, currency, version],
  );

  const handleAddDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(delAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const next: LedgerDelivery = {
      id: `man-del-${Date.now()}`,
      date: delDate,
      poNumber: delPo.trim() || "PO",
      invoiceNumber: delInv.trim() || "INV",
      description: delDesc.trim() || "Partial Delivery",
      amount,
      currency,
      source: "manual",
    };
    void persistLedgerDelivery(companyId, next).then(() => setVersion((v) => v + 1));
    setDelPo("");
    setDelInv("");
    setDelDesc("");
    setDelAmount("");
    setMode("none");
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(pmtAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const next: LedgerPayment = {
      id: `man-pmt-${Date.now()}`,
      date: pmtDate,
      method: pmtMethod,
      reference: pmtRef.trim() || pmtMethod,
      amount,
      currency,
      deliveryId: pmtDeliveryId || undefined,
    };
    void persistLedgerPayment(companyId, next).then(() => setVersion((v) => v + 1));
    setPmtRef("");
    setPmtAmount("");
    setPmtDeliveryId("");
    setMode("none");
  };

  const handlePrint = () => {
    const rowsHtml = summary.entries
      .map(
        (e) => `
        <tr>
          <td>${new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
          <td>${e.reference}</td>
          <td>${e.description}</td>
          <td>${e.aging ? e.aging.label : "—"}</td>
          <td style="text-align:right">${e.debit > 0 ? format(e.debit) : "—"}</td>
          <td style="text-align:right">${e.credit > 0 ? format(e.credit) : "—"}</td>
          <td style="text-align:right;font-weight:600">${format(e.runningBalance)}</td>
        </tr>`,
      )
      .join("");

    const bodyHtml = `
  <style>
    #soa-print-root { font-family: system-ui, -apple-system, sans-serif; color: #111; }
    #soa-print-root .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    #soa-print-root .brand { font-size: 20px; font-weight: 700; color: #0f294a; }
    #soa-print-root .doc-title { font-size: 24px; font-weight: 700; color: #0f294a; text-align: right; }
    #soa-print-root .meta { font-size: 11px; color: #555; text-align: right; margin-top: 4px; }
    #soa-print-root .boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    #soa-print-root .box-head { background: #0f294a; color: #fff; font-size: 11px; font-weight: 600; padding: 5px 10px; }
    #soa-print-root .box-body { border: 1px solid #d1d5db; border-top: none; padding: 10px; font-size: 12px; line-height: 1.5; }
    #soa-print-root .sum-row { display: flex; justify-content: space-between; }
    #soa-print-root .sum-row.bold { font-weight: 700; border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 4px; }
    #soa-print-root table { width: 100%; border-collapse: collapse; font-size: 12px; }
    #soa-print-root th { background: #0f294a; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
    #soa-print-root td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    #soa-print-root tr:nth-child(even) td { background: #f9fafb; }
    #soa-print-root .total-bar { background: #0f294a; color: #fff; padding: 8px 12px; font-size: 13px; font-weight: 700; text-align: right; margin-top: 2px; }
    #soa-print-root .footer { text-align: center; font-size: 11px; color: #555; margin-top: 24px; }
  </style>
  <div class="top">
    <div class="brand">Bishal Sales CRM</div>
    <div>
      <div class="doc-title">Statement</div>
      <div class="meta">Date: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
    </div>
  </div>
  <div class="boxes">
    <div>
      <div class="box-head">Bill To:</div>
      <div class="box-body"><strong>${companyName || "Customer"}</strong></div>
    </div>
    <div>
      <div class="box-head">Account Summary</div>
      <div class="box-body">
        <div class="sum-row"><span>Total Delivered:</span><span>${format(summary.totalDelivered)}</span></div>
        <div class="sum-row"><span>Credits (Collected):</span><span>${format(summary.totalCollected)}</span></div>
        <div class="sum-row bold"><span>Total Balance Due:</span><span>${format(summary.balanceDue)}</span></div>
        <div class="sum-row"><span>Overdue (45d+):</span><span>${format(summary.overdueAmount)}</span></div>
      </div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>PO / Invoice #</th><th>Description</th><th>Aging (45d)</th>
        <th style="text-align:right">Charges</th><th style="text-align:right">Credits</th><th style="text-align:right">Balance</th>
      </tr>
    </thead>
    <tbody>${rowsHtml || '<tr><td colspan="7" style="text-align:center;color:#666;padding:24px">No deliveries or payments recorded.</td></tr>'}</tbody>
  </table>
  <div class="total-bar">Account Current Balance: ${format(summary.balanceDue)}</div>
  <div class="footer">Thank you for your business! · 45-day credit terms per delivery</div>`;

    let root = document.getElementById("soa-print-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "soa-print-root";
      root.className = "hidden print:block";
      document.body.appendChild(root);
    }
    root.innerHTML = bodyHtml;
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Total Delivered</div>
          <div className="mt-1 text-base font-bold tabular-nums">
            {format(summary.totalDelivered, { compact: true })}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Collected</div>
          <div className="mt-1 text-base font-bold tabular-nums text-emerald-400">
            {format(summary.totalCollected, { compact: true })}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Balance Due</div>
          <div className="mt-1 text-base font-bold tabular-nums">
            {format(summary.balanceDue, { compact: true })}
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Overdue (45d+)</div>
          <div
            className={`mt-1 text-base font-bold tabular-nums ${
              summary.overdueAmount > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {format(summary.overdueAmount, { compact: true })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          45-day credit terms per delivery
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode(mode === "delivery" ? "none" : "delivery")}
            className="h-8 gap-1.5 text-xs"
          >
            <Truck className="size-3.5" />
            Record Delivery
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setMode(mode === "payment" ? "none" : "payment")}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Record Payment
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handlePrint}
            className="h-8 gap-1.5 text-xs"
          >
            <Printer className="size-3.5" />
            Print / PDF
          </Button>
        </div>
      </div>

      {mode === "delivery" && (
        <form
          onSubmit={handleAddDelivery}
          className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3.5"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Truck className="size-3.5 text-accent" />
            Record Partial / New Delivery (starts 45-day credit)
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Delivery Date</label>
              <Input
                type="date"
                value={delDate}
                onChange={(e) => setDelDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                required
                className="h-8 cursor-pointer text-xs [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">PO #</label>
              <Input
                placeholder="e.g. PO-204"
                value={delPo}
                onChange={(e) => setDelPo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Tax Invoice #</label>
              <Input
                placeholder="e.g. INV-101"
                value={delInv}
                onChange={(e) => setDelInv(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Delivered Amount ({currency})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={delAmount}
                onChange={(e) => setDelAmount(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Description / Items Delivered</label>
            <Input
              placeholder="e.g. Partial Delivery #1 — Pressure Washer"
              value={delDesc}
              onChange={(e) => setDelDesc(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("none")} className="h-7 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              Save Delivery
            </Button>
          </div>
        </form>
      )}

      {mode === "payment" && (
        <form
          onSubmit={handleAddPayment}
          className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3.5"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Receipt className="size-3.5 text-emerald-400" />
            Record Customer Payment
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Payment Date</label>
              <Input
                type="date"
                value={pmtDate}
                onChange={(e) => setPmtDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                required
                className="h-8 cursor-pointer text-xs [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Method</label>
              <select
                value={pmtMethod}
                onChange={(e) => setPmtMethod(e.target.value as LedgerPayment["method"])}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Reference #</label>
              <Input
                placeholder="e.g. TT-4491"
                value={pmtRef}
                onChange={(e) => setPmtRef(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Amount ({currency})</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={pmtAmount}
                onChange={(e) => setPmtAmount(e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
          </div>
          {summary.deliveries.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Apply to Delivery / Invoice (optional)</label>
              <select
                value={pmtDeliveryId}
                onChange={(e) => setPmtDeliveryId(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">Auto-apply to oldest unpaid delivery</option>
                {summary.deliveries.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.date} · {[d.poNumber, d.invoiceNumber].filter(Boolean).join(" / ")} ({format(d.amount)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("none")} className="h-7 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              Save Payment
            </Button>
          </div>
        </form>
      )}

      {summary.entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
          No deliveries or payments recorded yet. Delivered Won deals with a PO appear here automatically, or click <strong>Record Delivery</strong> above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/70 bg-secondary/40 text-[11px] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">PO / Invoice</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Aging (45d)</th>
                <th className="px-3 py-2 text-right font-medium">Debit</th>
                <th className="px-3 py-2 text-right font-medium">Credit</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {summary.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-secondary/20">
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                    {entry.reference}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-muted-foreground">
                    {entry.description}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {entry.aging ? (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          entry.aging.tone === "overdue"
                            ? "bg-destructive/15 text-destructive"
                            : entry.aging.tone === "due"
                              ? "bg-amber-500/15 text-amber-400"
                              : entry.aging.tone === "paid"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {entry.aging.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {entry.debit > 0 ? format(entry.debit) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-emerald-400">
                    {entry.credit > 0 ? format(entry.credit) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                    {format(entry.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
