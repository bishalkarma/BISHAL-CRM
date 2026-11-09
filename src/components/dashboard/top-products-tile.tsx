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

export const INITIAL_VISIBLE_ROWS = 5;
export const VISIBLE_STEP_ROWS = 5;

function StepExpandFooter({
  visibleCount,
  total,
  noun,
  onShowMore,
  onShowLess,
}: {
  visibleCount: number;
  total: number;
  noun: string;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  if (total <= INITIAL_VISIBLE_ROWS) return null;

  const shown = Math.min(visibleCount, total);
  const remaining = Math.max(0, total - shown);
  const nextStep = Math.min(VISIBLE_STEP_ROWS, remaining);

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
      {remaining > 0 && (
        <button
          type="button"
          onClick={onShowMore}
          className="flex-1 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 py-1.5 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent/[0.14]"
        >
          Show {nextStep} more ({shown} of {total} {noun}) ↓
        </button>
      )}
      {visibleCount > INITIAL_VISIBLE_ROWS && (
        <button
          type="button"
          onClick={onShowLess}
          className={cn(
            "rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-secondary",
            remaining === 0 && "w-full",
          )}
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}

/**
 * Top products across OPEN deals.
 *
 * Three views of the same line items: by value, by quantity, and clubbed by
 * customer. Starts with 5 entries and expands by 5 per tap in place.
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
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_ROWS);

  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ROWS);
  }, [view, periodLabel]);

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
    const visibleCustomers = byCustomer.slice(0, visibleCount);
    return (
      <div>
        <ul className="space-y-2.5">
          {visibleCustomers.map((row) => (
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
        <StepExpandFooter
          visibleCount={visibleCount}
          total={byCustomer.length}
          noun="customers"
          onShowMore={() =>
            setVisibleCount((prev) =>
              Math.min(byCustomer.length, prev + VISIBLE_STEP_ROWS),
            )
          }
          onShowLess={() => setVisibleCount(INITIAL_VISIBLE_ROWS)}
        />
      </div>
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
  const visibleRows = rows.slice(0, visibleCount);

  return (
    <>
      <ul className="space-y-1">
        {visibleRows.map((row, index) => {
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
      <StepExpandFooter
        visibleCount={visibleCount}
        total={rows.length}
        noun="products"
        onShowMore={() =>
          setVisibleCount((prev) =>
            Math.min(rows.length, prev + VISIBLE_STEP_ROWS),
          )
        }
        onShowLess={() => setVisibleCount(INITIAL_VISIBLE_ROWS)}
      />

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
