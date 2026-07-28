"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Building2, Handshake, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { DealTotals } from "@/lib/dashboard-metrics";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The headline numbers.
 *
 * Total customer stands alone; the four deal figures form a 2x2 so the pairs
 * read against each other — count beside worth, won beside lost. Each rate
 * sits under the count it describes rather than in a tile of its own, which
 * separated a percentage from the number it was a percentage of.
 */
export function KpiBlock({
  totalCustomers,
  totals,
  formatMoney,
}: {
  totalCustomers: number;
  totals: DealTotals;
  formatMoney: (amount: number) => string;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Tile
        icon={Building2}
        label="Total customer"
        value={String(totalCustomers)}
        tone="accent"
      />

      <div className="grid grid-cols-2 gap-3">
        <Tile
          icon={Handshake}
          label="Total Deal"
          value={String(totals.totalDeals)}
        />
        <Tile
          icon={Wallet}
          label="Total Deal worth AED"
          value={formatMoney(totals.totalValue)}
        />
        <Tile
          icon={TrendingUp}
          label="Deal Won"
          value={String(totals.wonCount)}
          support={formatMoney(totals.wonValue)}
          rateLabel="Win rate"
          rate={totals.winRate}
          tone="success"
        />
        <Tile
          icon={TrendingDown}
          label="Deal Loss"
          value={String(totals.lostCount)}
          support={formatMoney(totals.lostValue)}
          rateLabel="Loss rate"
          rate={totals.lossRate}
          tone="danger"
        />
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  support,
  rateLabel,
  rate,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  /** The money behind the count — kept in the same tile as its count. */
  support?: string;
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
        "flex flex-col p-4",
        tone === "success" && "border-success/25 bg-success/[0.04]",
        tone === "danger" && "border-destructive/25 bg-destructive/[0.04]",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className={cn("size-3.5 shrink-0", accent)} />
        <span className="min-w-0 break-words">{label}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-1.5 text-2xl font-semibold tabular-nums"
      >
        {value}
      </motion.div>

      {support && (
        <div className="text-xs text-muted-foreground tabular-nums">
          {support}
        </div>
      )}

      {rateLabel && rate !== undefined && (
        <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-border/60 pt-2">
          <span className="text-[11px] text-muted-foreground">{rateLabel}</span>
          <span className={cn("text-sm font-semibold tabular-nums", accent)}>
            {rate}%
          </span>
        </div>
      )}
    </Card>
  );
}
