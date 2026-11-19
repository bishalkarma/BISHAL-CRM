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
 * Six quick-read KPI cards: a compact single-row strip on desktop, with values aligned left for easy scanning.
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
    <div className="grid h-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px]">from {distinctDealCustomers} customers</span>
            <span className="text-[11px] opacity-60">{periodLabel}</span>
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

      <Tile
        icon={TrendingUp}
        label="Deals Won"
        value={totals.wonCount}
        support={
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold leading-none text-foreground">{formatMoney(totals.wonValue)}</span>
            <span className="text-[11px] leading-none opacity-70">worth</span>
          </span>
        }
        rateLabel="Win rate"
        rate={totals.winRate}
        tone="success"
        showBar
      />
      <Tile
        icon={TrendingDown}
        label="Deals Lost"
        value={totals.lostCount}
        support={
          <span className="flex flex-col items-start leading-none">
            <span className="text-[11px] font-semibold leading-none text-foreground">{formatMoney(totals.lostValue)}</span>
            <span className="text-[11px] leading-none opacity-70">worth</span>
          </span>
        }
        rateLabel="Loss rate"
        rate={totals.lossRate}
        tone="danger"
        showBar
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
  showBar = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  support?: React.ReactNode;
  rateLabel?: string;
  rate?: number;
  tone?: "neutral" | "accent" | "success" | "danger";
  showBar?: boolean;
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
        "flex h-full min-h-[108px] flex-col justify-between rounded-2xl p-3",
        tone === "success" && "border-success/30 bg-success/[0.06]",
        tone === "danger" && "border-destructive/30 bg-destructive/[0.06]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold leading-none tracking-tight text-muted-foreground">
        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg bg-secondary/80", accent)}>
          <Icon className="size-3.5" />
        </span>
        <span className="line-clamp-1">{label}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="truncate text-left text-[22px] font-bold leading-none tabular-nums lg:text-[25px]"
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>
        {support && (
          <div className="mt-1 min-w-0 text-left text-[10px] leading-tight text-muted-foreground">{support}</div>
        )}
      </div>

      {rateLabel && rate !== undefined && (
        <div className="mt-1 space-y-1">
          {showBar && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all", tone === "success" ? "bg-success" : "bg-destructive")}
                style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
              />
            </div>
          )}
          <div className="flex items-baseline justify-between gap-2 border-t border-border/60 pt-1">
            <span className="text-[10px] leading-none text-muted-foreground">{rateLabel}</span>
            <span className={cn("rounded px-1.5 py-0.5 text-xs font-bold tabular-nums", tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>{rate}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}
