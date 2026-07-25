"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REVENUE_TREND } from "@/lib/demo-data";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

type TooltipPayload = { name: string; value: number; color: string }[];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-float)]">
      <div className="pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-2 text-sm leading-6"
        >
          <span
            className="size-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="capitalize text-muted-foreground">{entry.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={REVENUE_TREND}
          margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickFormatter={(v: number) => formatCompactCurrency(v, "")}
            width={56}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{
              stroke: "var(--color-accent)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            animationDuration={900}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)" }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="target"
            stroke="var(--color-muted-foreground)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
