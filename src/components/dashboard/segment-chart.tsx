"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SEGMENT_SPLIT } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function SegmentChart() {
  const total = SEGMENT_SPLIT.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={SEGMENT_SPLIT}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={800}
            >
              {SEGMENT_SPLIT.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as (typeof SEGMENT_SPLIT)[0];
                return (
                  <div className="rounded-xl border border-border bg-popover p-2.5 text-sm shadow-[var(--shadow-float)]">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(item.amount)} · {item.value}%
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 2,
            }).format(total)}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {SEGMENT_SPLIT.map((segment, index) => (
          <li key={segment.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[index % COLORS.length] }}
            />
            <span className="flex-1 truncate text-muted-foreground">
              {segment.name}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {segment.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
