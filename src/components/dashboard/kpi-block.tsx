"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Building2, Handshake, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { DealTotals } from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
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
  periodLabel = "in this period",
}: {
  totalCustomers: number;
  totals: DealTotals;
  formatMoney: (amount: number) => string;
  /** Reads "all time" on the All filter, so the tile never lies. */
  periodLabel?: string;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Tile
        icon={Building2}
        label="Total customer"
        value={totalCustomers}
        support={periodLabel}
        tone="accent"
        /* Spans the full height of the 2x2 beside it, so the number is
           centred in real space rather than stranded at the top. */
        tall
      />

      <div className="grid grid-cols-2 gap-3">
        <Tile icon={Handshake} label="Total Deal" value={totals.totalDeals} />
        <Tile
          icon={Wallet}
          label="Total Deal worth"
          value={totals.totalValue}
          formatValue={formatMoney}
        />
        <Tile
          icon={TrendingUp}
          label="Deal Won"
          value={totals.wonCount}
          support={formatMoney(totals.wonValue)}
          rateLabel="Win rate"
          rate={totals.winRate}
          tone="success"
        />
        <Tile
          icon={TrendingDown}
          label="Deal Loss"
          value={totals.lostCount}
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
  formatValue,
  support,
  rateLabel,
  rate,
  tone = "neutral",
  tall = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  /** Money tiles format on every animation frame; counts need no formatter. */
  formatValue?: (value: number) => string;
  /** The money behind the count — kept in the same tile as its count. */
  support?: string;
  rateLabel?: string;
  rate?: number;
  tone?: "neutral" | "accent" | "success" | "danger";
  tall?: boolean;
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
      {/* Centred, like every other tile in the block. Previously only the
          tall tile was centred and the four beside it were left aligned,
          which read as two competing rules in one card. */}
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className={cn("size-3.5 shrink-0", accent)} />
        <span className="min-w-0 break-words text-center">{label}</span>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center text-center",
          tall ? "py-4" : "mt-1.5",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "font-semibold tabular-nums",
            tall ? "text-5xl" : "text-3xl",
          )}
        >
          <AnimatedNumber value={value} format={formatValue} />
        </motion.div>

        {support && (
          <div
            className={cn(
              "text-xs text-muted-foreground tabular-nums",
              tall && "mt-1",
            )}
          >
            {support}
          </div>
        )}
      </div>

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
