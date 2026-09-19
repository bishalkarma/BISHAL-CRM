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
 * BUILD 05 — Ultra-compact 6-card KPI (content-hugging, fixes "card big, content small")
 * 2 rows ×3 cols: Row 1 (Customers, Deals, Worth) and Row 2 (Won, Lost, Avg) clearly separated
 * Each card p-1.5, value 20-22px filling tile, Won/Lost have green/red progress bar + badge as in 2nd image
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
        showBar
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
        // BUILD 05: ultra-tight — content fills tile, fixes "big tile, small content"
        "flex flex-col p-1.5",
        tone === "success" && "border-success/30 bg-success/[0.06]",
        tone === "danger" && "border-destructive/30 bg-destructive/[0.06]",
      )}
    >
      <div className="flex items-center justify-center gap-1 text-center text-[10px] font-medium leading-none tracking-tight text-muted-foreground">
        <Icon className={cn("size-3 shrink-0", accent)} />
        <span className="line-clamp-1">{label}</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-1 text-center">
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[20px] font-bold leading-none tabular-nums lg:text-[22px]"
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>
        {support && (
          <div className="mt-0.5 text-center text-[10px] leading-none text-muted-foreground">{support}</div>
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
