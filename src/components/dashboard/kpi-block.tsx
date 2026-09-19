"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Calculator,
  Handshake,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { DealTotals } from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * BUILD 03 — Ultra-compact 6-card KPI (content-hugging, fixes "card big, content small")
 * Cards hug content: no forced 96px, py-2 px-2, gap-0.5, numbers larger vs. card
 * - Each card is h-auto (min ~62-68px), value text-[19px] fills card, support 10px tight
 * - Grid: 3 cols × 2 rows inside 8-col KPI widget, gap-2, Pipeline moved off top
 * - Matches latest user image: KPI left 8 cols + Customers by type donut right 4 cols at y0
 */

export function KpiBlock({
  totalCustomers,
  totals,
  distinctDealCustomers,
  avgDealSize,
  formatMoney,
  periodLabel = "in this period",
}: {
  totalCustomers: number;
  totals: DealTotals;
  distinctDealCustomers: number;
  avgDealSize: number;
  formatMoney: (amount: number) => string;
  periodLabel?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {/* Row 1 */}
      <Tile
        icon={Building2}
        label="Total Customers"
        value={totalCustomers}
        support={<span className="text-[10px] leading-none opacity-70">{periodLabel}</span>}
        tone="accent"
      />
      <Tile
        icon={Handshake}
        label="Total Deals"
        value={totals.totalDeals}
        support={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[10px]">from {distinctDealCustomers} customers</span>
            <span className="text-[10px] opacity-60">{periodLabel}</span>
          </span>
        }
      />
      <Tile
        icon={Wallet}
        label="Total Deal Worth"
        value={totals.totalValue}
        formatValue={formatMoney}
        support={<span className="text-[10px] leading-none opacity-60">{periodLabel}</span>}
      />

      {/* Row 2 */}
      <Tile
        icon={TrendingUp}
        label="Deals Won"
        value={totals.wonCount}
        support={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-semibold leading-none text-foreground">{formatMoney(totals.wonValue)}</span>
            <span className="text-[10px] leading-none opacity-70">worth</span>
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
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-semibold leading-none text-foreground">{formatMoney(totals.lostValue)}</span>
            <span className="text-[10px] leading-none opacity-70">worth</span>
          </span>
        }
        rateLabel="Loss rate"
        rate={totals.lossRate}
        tone="danger"
      />
      <Tile
        icon={Calculator}
        label="Avg Deal Size"
        value={avgDealSize}
        formatValue={formatMoney}
        support={
          <span className="text-[10px] leading-none opacity-60">
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
        // BUILD 03: content-hugging — no min-h 96, auto height, tight py-2, gap makes number fill card
        "flex flex-col gap-0.5 p-2",
        tone === "success" && "border-success/25 bg-success/[0.04]",
        tone === "danger" && "border-destructive/25 bg-destructive/[0.04]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-center text-[10px] font-medium leading-none tracking-tight text-muted-foreground">
        <Icon className={cn("size-3 shrink-0", accent)} />
        <span className="line-clamp-1">{label}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center">
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[19px] font-bold leading-none tabular-nums lg:text-[20px]"
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>
        {support && (
          <div className="text-center text-[10px] leading-none text-muted-foreground">{support}</div>
        )}
      </div>

      {rateLabel && rate !== undefined && (
        <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-border/50 pt-1">
          <span className="text-[10px] leading-none text-muted-foreground">{rateLabel}</span>
          <span className={cn("text-[11px] font-bold tabular-nums", accent)}>{rate}%</span>
        </div>
      )}
    </Card>
  );
}
