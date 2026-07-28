"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Slice } from "@/lib/dashboard-metrics";
import { cn } from "@/lib/utils";

/**
 * One component for every share-of-total question on the dashboard:
 * activity mix, revenue by segment, customers by type.
 *
 * They differ only in how the value is formatted, so a shared component keeps
 * the colours and legend consistent rather than drifting apart over time.
 */

const COLOURS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

export function DistributionChart({
  slices,
  format,
  emptyLabel = "Nothing to show yet.",
  donut = false,
}: {
  slices: Slice[];
  /** Money for revenue, plain counts for everything else. */
  format?: (value: number) => string;
  emptyLabel?: string;
  donut?: boolean;
}) {
  if (slices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const show = (v: number) => (format ? format(v) : String(v));

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={donut ? 42 : 0}
              outerRadius={70}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
            >
              {slices.map((slice, i) => (
                <Cell key={slice.key} fill={COLOURS[i % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                fontSize: 12,
              }}
              formatter={(value, name) => [show(Number(value ?? 0)), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((slice, i) => (
          <li key={slice.key} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: COLOURS[i % COLOURS.length] }}
            />
            <span className="min-w-0 flex-1 break-words">{slice.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {show(slice.value)}
            </span>
            <span
              className={cn(
                "w-9 shrink-0 text-right font-medium tabular-nums",
                slice.share >= 40 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {slice.share}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
