"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  Calculator,
  Handshake,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { DealTotals, Slice } from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * BUILD 01 — Compact 8-card KPI block
 *
 * Two rows × 4 cards, compact so the revenue chart stays above the fold.
 * - Row 1: Total Customer, Total Deal (from X customers), Total Deal Worth, Activity Mix (mini donut)
 * - Row 2: Deal Won (+worth +Win Rate), Deal Loss (+worth +Loss Rate), Open Opportunities (from X customers), Avg Deal Size
 * Mobile: 2 cols → 4 rows. Desktop: 4 cols → 2 rows.
 * Every card is min-h-[118px] with p-3 so the block never stretches full height.
 */

const MINI_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))",
];

function MiniDonut({ slices }: { slices: Slice[] }) {
  if (!slices.length) {
    return (
      <div className="flex size-[44px] items-center justify-center rounded-full border border-dashed border-border text-[8px] text-muted-foreground">
        —
      </div>
    );
  }
  const top = slices.slice(0, 5);
  let cur = 0;
  const stops = top
    .map((s, i) => {
      const start = cur;
      cur += s.share;
      return `${MINI_COLORS[i % MINI_COLORS.length]} ${start}% ${cur}%`;
    })
    .join(", ");
  const total = slices.reduce((a, b) => a + b.value, 0);
  return (
    <div
      className="relative size-[44px] shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-card text-[9px] font-bold tabular-nums">
        {total}
      </div>
    </div>
  );
}

export function KpiBlock({
  totalCustomers,
  totals,
  openCount,
  openCustomers,
  openValue,
  distinctDealCustomers,
  avgDealSize,
  activityMixSlices,
  formatMoney,
  periodLabel = "in this period",
}: {
  totalCustomers: number;
  totals: DealTotals;
  openCount: number;
  openCustomers: number;
  openValue: number;
  distinctDealCustomers: number;
  avgDealSize: number;
  activityMixSlices: Slice[];
  formatMoney: (amount: number) => string;
  periodLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* Row 1 */}
      <Tile
        icon={Building2}
        label="Total Customers"
        value={totalCustomers}
        support={periodLabel}
        tone="accent"
      />
      <Tile
        icon={Handshake}
        label="Total Deals"
        value={totals.totalDeals}
        support={
          <span className="flex flex-col items-center">
            <span>from {distinctDealCustomers} customers</span>
            <span className="text-[10px] opacity-70">{periodLabel}</span>
          </span>
        }
      />
      <Tile
        icon={Wallet}
        label="Total Deal Worth"
        value={totals.totalValue}
        formatValue={formatMoney}
        support={<span className="text-[10px] opacity-70">{periodLabel}</span>}
      />
      {/* Activity Mix — compact mini donut */}
      <Card className="flex min-h-[118px] flex-col items-center p-3 text-center">
        <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Activity className="size-3.5 shrink-0 text-accent" />
          <span>Activity Mix</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-1">
          <MiniDonut slices={activityMixSlices} />
          <div className="flex flex-wrap items-center justify-center gap-1">
            {activityMixSlices.slice(0, 3).map((s, i) => (
              <span key={s.key} className="flex items-center gap-1 text-[10px]">
                <span
                  className="size-2 rounded-full"
                  style={{ background: MINI_COLORS[i % MINI_COLORS.length] }}
                />
                <span className="max-w-[52px] truncate text-muted-foreground">
                  {s.label}
                </span>
              </span>
            ))}
            {activityMixSlices.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{activityMixSlices.length - 3}
              </span>
            )}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">{periodLabel}</div>
      </Card>

      {/* Row 2 */}
      <Tile
        icon={TrendingUp}
        label="Deals Won"
        value={totals.wonCount}
        support={
          <span className="flex flex-col items-center leading-tight">
            <span className="font-medium text-foreground">{formatMoney(totals.wonValue)}</span>
            <span className="text-[10px]">worth</span>
          </span>
        }
        rateLabel="Win rate"
        rate={totals.winRate}
        tone="success"
      />
      <Tile
        icon={TrendingDown}
        label="Deals Lost"
        value={totals.lostCount}
        support={
          <span className="flex flex-col items-center leading-tight">
            <span className="font-medium text-foreground">{formatMoney(totals.lostValue)}</span>
            <span className="text-[10px]">worth</span>
          </span>
        }
        rateLabel="Loss rate"
        rate={totals.lossRate}
        tone="danger"
      />
      <Tile
        icon={Target}
        label="Open Opportunities"
        value={openCount}
        support={
          <span className="flex flex-col items-center leading-tight">
            <span>from {openCustomers} customers</span>
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
              {formatMoney(openValue)} open
            </span>
          </span>
        }
      />
      <Tile
        icon={Calculator}
        label="Avg Deal Size"
        value={avgDealSize}
        formatValue={formatMoney}
        support={
          <span className="text-[10px] opacity-70">
            across {totals.totalDeals || 0} deals · {periodLabel}
          </span>
        }
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  formatValue,
  support,
  rateLabel,
  rate,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  support?: React.ReactNode;
  rateLabel?: string;
  rate?: number;
  tone?: "neutral" | "accent" | "success" | "danger";
}) {
  const accent =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-destructive"
        : tone === "accent"
          ? "text-accent"
          : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "flex min-h-[118px] flex-col p-3",
        tone === "success" && "border-success/25 bg-success/[0.04]",
        tone === "danger" && "border-destructive/25 bg-destructive/[0.04]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-center text-[11px] font-medium leading-none text-muted-foreground">
        <Icon className={cn("size-3.5 shrink-0", accent)} />
        <span className="line-clamp-1">{label}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-1 text-center">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-xl font-semibold tabular-nums lg:text-[22px]"
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>
        {support && (
          <div className="mt-0.5 text-center text-[11px] leading-tight text-muted-foreground">
            {support}
          </div>
        )}
      </div>

      {rateLabel && rate !== undefined && (
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-border/60 pt-1.5">
          <span className="text-[10px] text-muted-foreground">{rateLabel}</span>
          <span className={cn("text-xs font-semibold tabular-nums", accent)}>{rate}%</span>
        </div>
      )}
    </Card>
  );
}
