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
 * BUILD 02 — Compact 6-card KPI block (removed Activity Mix + Open Opportunities duplicates)
 *
 * 3 cols × 2 rows inside an 8-col wide KPI widget (Pipeline sits on the right 4 cols).
 * Each card min-h-[96px] p-2.5 — tighter than BUILD 01's 118px, so the whole top block
 * stays above the fold and pipeline fits on the right.
 * - Row 1: Total Customers | Total Deals (from X customers) | Total Deal Worth
 * - Row 2: Deals Won (worth + Win Rate) | Deals Lost (worth + Loss Rate) | Avg Deal Size
 * Mobile: 2 cols (3 rows). Desktop: 3 cols (2 rows).
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
        support={<span className="text-[10px] opacity-70">{periodLabel}</span>}
        tone="accent"
      />
      <Tile
        icon={Handshake}
        label="Total Deals"
        value={totals.totalDeals}
        support={
          <span className="flex flex-col items-center leading-tight">
            <span className="text-[11px]">from {distinctDealCustomers} customers</span>
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

      {/* Row 2 */}
      <Tile
        icon={TrendingUp}
        label="Deals Won"
        value={totals.wonCount}
        support={
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-medium text-foreground">{formatMoney(totals.wonValue)}</span>
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
          <span className="flex flex-col items-center leading-none">
            <span className="text-[11px] font-medium text-foreground">{formatMoney(totals.lostValue)}</span>
            <span className="text-[10px]">worth</span>
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
          <span className="text-[10px] leading-tight opacity-70">
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
        "flex min-h-[96px] flex-col p-2.5",
        tone === "success" && "border-success/25 bg-success/[0.04]",
        tone === "danger" && "border-destructive/25 bg-destructive/[0.04]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-center text-[10px] font-medium leading-none tracking-tight text-muted-foreground">
        <Icon className={cn("size-3 shrink-0", accent)} />
        <span className="line-clamp-1">{label}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-1 text-center">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="text-lg font-semibold tabular-nums leading-none lg:text-xl"
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>
        {support && (
          <div className="mt-1 text-center text-[11px] leading-tight text-muted-foreground">
            {support}
          </div>
        )}
      </div>

      {rateLabel && rate !== undefined && (
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-border/60 pt-1">
          <span className="text-[10px] leading-none text-muted-foreground">{rateLabel}</span>
          <span className={cn("text-xs font-semibold tabular-nums", accent)}>{rate}%</span>
        </div>
      )}
    </Card>
  );
}
