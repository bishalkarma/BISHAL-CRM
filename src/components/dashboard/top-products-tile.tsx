"use client";

import * as React from "react";
import type {
  CustomerProductRow,
  ProductRow,
} from "@/lib/dashboard-metrics";
import {
  DetailDialog,
  type DetailRow,
} from "@/components/dashboard/detail-dialog";
import { EmptyTile } from "@/components/dashboard/empty-tile";
import { cn } from "@/lib/utils";

export type ProductView = "value" | "qty" | "customer";

export const PRODUCT_VIEWS: { id: ProductView; label: string }[] = [
  { id: "value", label: "Value" },
  { id: "qty", label: "Qty" },
  { id: "customer", label: "Customer" },
];

/**
 * Top products across OPEN deals.
 *
 * Three views of the same line items: by value, by quantity, and clubbed by
 * customer. The tile keeps a fixed height in the grid and this list scrolls
 * inside it — switching view must never resize the tile or shove its
 * neighbours around.
 */
export function TopProductsTile({
  view,
  products,
  byCustomer,
  formatMoney,
  periodLabel,
}: {
  view: ProductView;
  products: ProductRow[];
  byCustomer: CustomerProductRow[];
  formatMoney: (value: number) => string;
  periodLabel: string;
}) {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const active = products.find((p) => p.key === openKey) ?? null;

  const detailRows: DetailRow[] = React.useMemo(() => {
    if (!active) return [];
    return [...active.deals]
      .sort((a, b) => b.value - a.value)
      .map(({ deal, quantity, value }) => ({
        id: deal.id,
        title: deal.title,
        meta: `${deal.company} · ${deal.owner}`,
        value: formatMoney(value),
        hint: `×${quantity}`,
      }));
  }, [active, formatMoney]);

  if (view === "customer") {
    if (byCustomer.length === 0) {
      return <EmptyTile message="No open deals in this period." />;
    }
    return (
      <ul className="space-y-2.5">
        {byCustomer.map((row) => (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-semibold">
                {row.company}
              </span>
              <span className="shrink-0 tabular-nums">
                <strong className="font-semibold">
                  {formatMoney(row.value)}
                </strong>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  · {row.dealCount}{" "}
                  {row.dealCount === 1 ? "deal" : "deals"}
                </span>
              </span>
            </div>
            {/* Every line item from every open deal for this customer,
                clubbed together — the point of this view. */}
            <ul className="mt-1 space-y-0.5 border-l border-border pl-2.5">
              {row.lines.map((line) => (
                <li
                  key={line.label}
                  className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground"
                >
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="shrink-0 tabular-nums">
                    ×{line.quantity} · {formatMoney(line.value)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  const rows =
    view === "qty"
      ? [...products].sort((a, b) => b.quantity - a.quantity)
      : products;

  if (rows.length === 0) {
    return <EmptyTile message="No products on open deals in this period." />;
  }

  const max = Math.max(
    ...rows.map((r) => (view === "qty" ? r.quantity : r.value)),
    1,
  );

  return (
    <>
      <ul className="space-y-1">
        {rows.map((row, index) => {
          const metric = view === "qty" ? row.quantity : row.value;
          return (
            <li key={row.key}>
              <button
                type="button"
                onClick={() => setOpenKey(row.key)}
                className="relative flex w-full items-center gap-2 overflow-hidden rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-secondary/60"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-md bg-accent opacity-[0.08]"
                  style={{ width: `${(metric / max) * 100}%` }}
                />
                <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold tabular-nums">
                  {index + 1}
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {row.product}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {row.brand}
                  </span>
                </span>
                <span className="relative shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {view === "qty"
                      ? `${row.quantity} pcs`
                      : formatMoney(row.value)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {view === "qty"
                      ? formatMoney(row.value)
                      : `${row.quantity} pcs`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <DetailDialog
        open={active !== null}
        onOpenChange={(next) => !next && setOpenKey(null)}
        title={active?.product ?? ""}
        summary={
          active
            ? `${active.brand} · ${active.quantity} pcs · ${formatMoney(
                active.value,
              )} · ${active.deals.length} open ${
                active.deals.length === 1 ? "deal" : "deals"
              } · ${periodLabel}`
            : ""
        }
        rows={detailRows}
      />
    </>
  );
}

/** The Value / Qty / Customer switch, rendered in the card header. */
export function ProductViewToggle({
  view,
  onChange,
}: {
  view: ProductView;
  onChange: (view: ProductView) => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-lg border border-border p-0.5">
      {PRODUCT_VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            view === v.id
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
