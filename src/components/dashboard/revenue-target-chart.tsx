"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil } from "lucide-react";
import type { RevenuePoint } from "@/lib/dashboard-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Won revenue by month against a target you set.
 *
 * Both lines used to be invented numbers in a demo file. The revenue is now
 * summed from deals actually won in each month; the target is the one figure
 * that cannot be derived, so it is the only thing you type.
 */
export function RevenueTargetChart({
  data,
  target,
  onTargetChange,
  format,
}: {
  data: RevenuePoint[];
  target: number;
  onTargetChange: (value: number) => void;
  format: (value: number, opts?: { compact?: boolean }) => string;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(String(target));

  React.useEffect(() => {
    if (open) setDraft(String(target));
  }, [open, target]);

  const save = () => {
    const value = Number(draft.replace(/[^\d.]/g, ""));
    if (Number.isFinite(value) && value >= 0) onTargetChange(value);
    setOpen(false);
  };

  const hasRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-1" />
            Won revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-muted-foreground" />
            Target {format(target, { compact: true })}
          </span>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="xs" className="ml-auto">
              <Pencil />
              Set target
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-3">
            <label className="mb-1 block text-xs font-medium">
              Monthly target
            </label>
            <div className="flex gap-1.5">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                inputMode="numeric"
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={save}>
                Save
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Saved on this device. Becomes a per-person target once logins are
              added.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => format(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                fontSize: 12,
              }}
              formatter={(value) => [format(Number(value ?? 0)), "Won revenue"]}
            />
            <ReferenceLine
              y={target}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!hasRevenue && (
        <p className="text-center text-[11px] text-muted-foreground">
          No deals won in this window yet — the line fills in as deals close.
        </p>
      )}
    </div>
  );
}
