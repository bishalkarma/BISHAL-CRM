"use client";

import * as React from "react";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import { StatementOfAccountTab } from "@/components/companies/statement-of-account-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildCustomerStatement,
  syncCustomerLedgerFromSupabase,
} from "@/lib/statement-of-account";

export default function LedgerPage() {
  const { companies, deals } = useData();
  const { display: currency, toDisplay: convert, format } = useCurrency();
  const [query, setQuery] = React.useState("");
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    void syncCustomerLedgerFromSupabase().then(() => setVersion((v) => v + 1));
  }, []);

  const rows = React.useMemo(() => {
    return companies
      .map((company) => {
        const summary = buildCustomerStatement(company.id, deals, convert, currency);
        return { company, summary };
      })
      .sort((a, b) => b.summary.balanceDue - a.summary.balanceDue || a.company.name.localeCompare(b.company.name));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, deals, convert, currency, version]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ company, summary }) => {
      if (overdueOnly && summary.overdueAmount <= 0) return false;
      if (q && !company.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, overdueOnly]);

  const totals = React.useMemo(() => {
    return rows.reduce(
      (acc, { summary }) => {
        acc.delivered += summary.totalDelivered;
        acc.collected += summary.totalCollected;
        acc.balance += summary.balanceDue;
        acc.overdue += summary.overdueAmount;
        return acc;
      },
      { delivered: 0, collected: 0, balance: 0, overdue: 0 },
    );
  }, [rows]);

  const selected = selectedId ? rows.find((r) => r.company.id === selectedId) : null;

  if (selected) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="h-8 gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            All Customers
          </Button>
          <div>
            <h1 className="text-lg font-bold">{selected.company.name}</h1>
            <p className="text-xs text-muted-foreground">
              Statement of Account · 45-day credit per delivery
            </p>
          </div>
        </div>
        <StatementOfAccountTab
          companyId={selected.company.id}
          companyName={selected.company.name}
          companyAddress={[selected.company.area, selected.company.emirate].filter(Boolean).join(", ")}
          deals={deals.filter((d) => d.companyId === selected.company.id)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="size-5 text-accent" />
            Statement of Ledger
          </h1>
          <p className="text-xs text-muted-foreground">
            All customers · 45-day credit terms per delivery
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search customer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground">Total Delivered</div>
          <div className="mt-1 text-lg font-bold tabular-nums">{format(totals.delivered, { compact: true })}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground">Total Collected</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-emerald-400">{format(totals.collected, { compact: true })}</div>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="text-[11px] font-medium text-muted-foreground">Total Receivable</div>
          <div className="mt-1 text-lg font-bold tabular-nums">{format(totals.balance, { compact: true })}</div>
        </div>
        <button
          type="button"
          onClick={() => setOverdueOnly((v) => !v)}
          className={`rounded-xl border p-3.5 text-left transition-colors ${
            overdueOnly
              ? "border-destructive bg-destructive/10"
              : "border-border/70 bg-card/60 hover:bg-secondary/40"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Overdue (45d+)</span>
            {overdueOnly && <span className="text-[10px] text-destructive">Filtered</span>}
          </div>
          <div className={`mt-1 text-lg font-bold tabular-nums ${totals.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {format(totals.overdue, { compact: true })}
          </div>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/70 bg-secondary/40 text-[11px] text-muted-foreground">
            <tr>
              <th className="px-3.5 py-2.5 font-medium">Customer</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Delivered</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Collected</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Balance Due</th>
              <th className="px-3.5 py-2.5 text-right font-medium">Overdue (45d+)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map(({ company, summary }) => (
              <tr
                key={company.id}
                onClick={() => setSelectedId(company.id)}
                className="cursor-pointer transition-colors hover:bg-secondary/40"
              >
                <td className="px-3.5 py-2.5 font-medium">{company.name}</td>
                <td className="px-3.5 py-2.5 text-right tabular-nums text-muted-foreground">
                  {format(summary.totalDelivered)}
                </td>
                <td className="px-3.5 py-2.5 text-right tabular-nums text-emerald-400">
                  {format(summary.totalCollected)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums">
                  {format(summary.balanceDue)}
                </td>
                <td className="px-3.5 py-2.5 text-right tabular-nums">
                  {summary.overdueAmount > 0 ? (
                    <span className="inline-flex rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {format(summary.overdueAmount)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
