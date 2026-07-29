"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Slice } from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { cn } from "@/lib/utils";

/**
 * One component for every share-of-total question on the dashboard:
 * activity mix and customers by type.
 *
 * Rewritten after the old version read as unfinished. Three real faults:
 *
 *  1. `sm:flex-row` watches the SCREEN, not the tile. On a wide window a
 *     four-column tile still forced chart and legend side by side, so the
 *     legend was squeezed to nothing. Now a ResizeObserver measures the tile
 *     itself and stacks below ~340px.
 *  2. The chart was a fixed 190px that never shrank, taking the space the
 *     legend needed.
 *  3. Nothing was written on the chart, so it carried no information on its
 *     own. Now the total sits in the middle and the big slices are labelled.
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

/** Radius the selected wedge lifts by. */
const POP = 7;
/** Below this share a slice is too thin to carry a readable label. */
const LABEL_MIN_SHARE = 8;
/** Beyond this many slices the tail becomes unreadable slivers. */
const MAX_SLICES = 6;
/** Tile width under which chart and legend stack instead of sitting side by side. */
const STACK_BELOW = 340;

/** Long tails become one "Other" row rather than a fan of 1% slivers. */
function groupTail(slices: Slice[]): Slice[] {
  if (slices.length <= MAX_SLICES) return slices;
  const head = slices.slice(0, MAX_SLICES - 1);
  const tail = slices.slice(MAX_SLICES - 1);
  return [
    ...head,
    {
      key: "__other",
      label: `Other (${tail.length})`,
      value: tail.reduce((sum, s) => sum + s.value, 0),
      share: tail.reduce((sum, s) => sum + s.share, 0),
    },
  ];
}

export function DistributionChart({
  slices: input,
  format,
  emptyLabel = "Nothing to show yet.",
  totalLabel = "Total",
}: {
  slices: Slice[];
  /** Money for values, plain counts for everything else. */
  format?: (value: number) => string;
  emptyLabel?: string;
  totalLabel?: string;
}) {
  const slices = React.useMemo(() => groupTail(input), [input]);

  // Tapping the same slice again puts it back — nothing gets stuck out.
  const [active, setActive] = React.useState<number | null>(null);
  const toggle = (index: number) =>
    setActive((current) => (current === index ? null : index));

  /* Measures the TILE, not the window. This is the actual fix for the
     clipped legend — a Tailwind sm: breakpoint could never know how wide
     this particular dashboard widget had been dragged. */
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = React.useState(false);
  React.useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setStacked(entry.contentRect.width < STACK_BELOW);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const show = React.useCallback(
    (v: number) => (format ? format(v) : String(Math.round(v))),
    [format],
  );

  if (slices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        "flex min-w-0 gap-4",
        stacked ? "flex-col items-center" : "flex-row items-center",
      )}
    >
      <div
        className={cn(
          "relative shrink-0",
          stacked ? "h-[150px] w-[150px]" : "h-[160px] w-[160px]",
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/*
              Two pies drawn on top of each other. Recharts 3 removed
              activeIndex and Cell will not take a radius, so the selected
              wedge is rendered as its own pie at a larger radius.
            */}
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={72 - POP}
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
                  opacity={active === null ? 1 : active === i ? 0 : 0.3}
                />
              ))}
            </Pie>

            {active !== null && (
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={72}
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

            {/* Percentages written on the slices wide enough to hold them,
                the way a spreadsheet chart does. */}
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={72}
              fill="transparent"
              stroke="none"
              isAnimationActive={false}
              labelLine={false}
              label={({ index, x, y, textAnchor }) => {
                const slice = slices[index as number];
                if (!slice || slice.share < LABEL_MIN_SHARE) return <g />;
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor as "start" | "middle" | "end"}
                    dominantBaseline="central"
                    className="pointer-events-none fill-white text-[10px] font-semibold"
                  >
                    {slice.share}%
                  </text>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* The number the old chart made you hunt for. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">
            {active === null ? totalLabel : slices[active].label}
          </span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber
              value={active === null ? total : slices[active].value}
              format={show}
            />
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {slices.map((slice, i) => (
          <li key={slice.key}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={active === i}
              className={cn(
                "relative flex w-full items-center gap-2 overflow-hidden rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-secondary/60",
                active === i && "bg-secondary",
              )}
            >
              {/* Share bar sits behind the row, so ranking is readable
                  without reading a single number. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-md opacity-[0.13]"
                style={{
                  width: `${slice.share}%`,
                  background: COLOURS[i % COLOURS.length],
                }}
              />
              <span
                aria-hidden
                className="relative size-2 shrink-0 rounded-full"
                style={{ background: COLOURS[i % COLOURS.length] }}
              />
              <span className="relative min-w-0 flex-1 truncate">
                {slice.label}
              </span>
              <span className="relative shrink-0 font-medium tabular-nums">
                {show(slice.value)}
              </span>
              <span className="relative w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                {slice.share}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
