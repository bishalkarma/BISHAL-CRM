"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  UNITS,
  lineTotal,
  type LineItem,
  type Unit,
} from "@/lib/deal-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Repeatable product lines used when creating or editing a deal. */
export function LineItemsEditor({
  lines,
  onChange,
  currencySymbol = "AED",
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  currencySymbol?: string;
}) {
  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const add = () =>
    onChange([
      ...lines,
      {
        id: `L-new-${Date.now()}`,
        product: "",
        brand: "",
        quantity: 1,
        unit: "Pcs",
        unitPrice: 0,
        status: "quoted",
      },
    ]);

  const remove = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);

  return (
    <div className="space-y-2">
      {/* Desktop column labels */}
      <div className="hidden gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_74px_86px_96px_32px]">
        <span>Product</span>
        <span>Brand</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      {lines.map((line, index) => (
        <div
          key={line.id}
          className="grid gap-2 rounded-xl border border-border p-2 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_74px_86px_96px_32px] sm:items-center sm:border-0 sm:p-0"
        >
          <Input
            value={line.product}
            onChange={(e) => update(line.id, { product: e.target.value })}
            placeholder={`Product ${index + 1}`}
            className="h-9"
            aria-label={`Product ${index + 1}`}
          />
          <Input
            value={line.brand}
            onChange={(e) => update(line.id, { brand: e.target.value })}
            placeholder="Brand"
            className="h-9"
            aria-label={`Brand for line ${index + 1}`}
          />
          <div className="flex gap-1">
            <Input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) =>
                update(line.id, { quantity: Math.max(0, +e.target.value) })
              }
              className="h-9 w-full px-2"
              aria-label={`Quantity for line ${index + 1}`}
            />
            <select
              value={line.unit}
              onChange={(e) => update(line.id, { unit: e.target.value as Unit })}
              aria-label={`Unit for line ${index + 1}`}
              className="h-9 rounded-lg border border-input bg-background px-1 text-xs outline-none focus-visible:border-accent"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={line.unitPrice}
            onChange={(e) =>
              update(line.id, { unitPrice: Math.max(0, +e.target.value) })
            }
            className="h-9 px-2"
            aria-label={`Unit price for line ${index + 1}`}
          />
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <span className="text-[10px] uppercase text-muted-foreground sm:hidden">
              Line total
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {lineTotal(line).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <button
            type="button"
            onClick={() => remove(line.id)}
            disabled={lines.length === 1}
            aria-label={`Remove line ${index + 1}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              lines.length === 1 && "cursor-not-allowed opacity-30",
            )}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus />
          Add line
        </Button>
        <div className="text-sm">
          <span className="text-muted-foreground">Deal value </span>
          <span className="font-semibold tabular-nums">
            {currencySymbol}{" "}
            {total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}
