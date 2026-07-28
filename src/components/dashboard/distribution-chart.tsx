"use client";

import * as React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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

/**
 * Radius offset for the selected wedge. Recharts has no built-in explode, so
 * the active slice is drawn from a slightly larger outer radius via
 * activeShape, which reads as the slice lifting out of the pie.
 */
const POP = 8;

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
  // Tapping the same slice again puts it back — nothing gets stuck out.
  const [active, setActive] = React.useState<number | null>(null);
  const toggle = (index: number) =>
    setActive((current) => (current === index ? null : index));

  if (slices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const show = (v: number) => (format ? format(v) : String(v));

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
      {/* Bigger and centred: a small pie stranded in a wide tile read as a
          rendering fault rather than a chart. */}
      <div className="h-[190px] w-[190px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/*
              Two pies drawn on top of each other. Recharts 3 removed
              activeIndex and Cell will not take a radius, so the selected
              wedge is rendered as its own single-slice pie at a larger
              radius. The result is the same lift, with no untyped casts.
            */}
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={donut ? 54 : 0}
              outerRadius={90 - POP}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
              onClick={(_, index) => toggle(index)}
              className="cursor-pointer"
            >
              {slices.map((slice, i) => (
                <Cell
                  key={slice.key}
                  fill={COLOURS[i % COLOURS.length]}
                  // Hide the flat version of whichever slice is lifted.
                  opacity={active === null ? 1 : active === i ? 0 : 0.35}
                />
              ))}
            </Pie>

            {active !== null && (
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={donut ? 54 : 0}
                outerRadius={90}
                paddingAngle={slices.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
                onClick={() => toggle(active)}
                className="cursor-pointer"
              >
                {slices.map((slice, i) => (
                  <Cell
                    key={slice.key}
                    fill={COLOURS[i % COLOURS.length]}
                    opacity={active === i ? 1 : 0}
                  />
                ))}
              </Pie>
            )}

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

      <ul className="min-w-0 flex-1 space-y-2 self-center">
        {slices.map((slice, i) => (
          <li key={slice.key}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={active === i}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-secondary/60",
                active === i && "bg-secondary",
              )}
            >
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
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
