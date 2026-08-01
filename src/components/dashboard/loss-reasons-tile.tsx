"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LossReasonRow } from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import {
  DetailDialog,
  type DetailRow,
} from "@/components/dashboard/detail-dialog";
import { EmptyTile } from "@/components/dashboard/empty-tile";
import { closedAt } from "@/lib/dashboard-metrics";

/** Fixed colours per reason so the ranking never changes hue between periods. */
const TONES = [
  "bg-destructive",
  "bg-warning",
  "bg-chart-1",
  "bg-muted-foreground/40",
];

/**
 * Why we lose — the only tile that reads `lostReason`, a field captured on
 * every lost deal and until now never shown back to anyone.
 */
export function LossReasonsTile({
  rows,
  formatMoney,
  periodLabel,
}: {
  rows: LossReasonRow[];
  formatMoney: (value: number) => string;
  periodLabel: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const active = openIndex === null ? null : rows[openIndex];

  const max = Math.max(...rows.map((r) => r.value), 1);
  const totalCount = rows.reduce((sum, r) => sum + r.count, 0);

  /* One row per rejected LINE. A package can lose one item and keep the
     rest, so listing whole deals here would overstate what walked away. */
  const detailRows: DetailRow[] = React.useMemo(() => {
    if (!active) return [];
    return active.lines
      .slice()
      .sort((a, b) => b.value - a.value)
      .map(({ deal, line, value }) => ({
        id: `${deal.id}-${line.id}`,
        title: line.product,
        meta: `${deal.company} · ${deal.title}`,
        value: formatMoney(value),
        hint: (() => {
          const at = deal.stage === "lost" ? closedAt(deal) : null;
          return at
            ? `lost ${new Date(at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}`
            : deal.stage === "won"
              ? "not taken"
              : undefined;
        })(),
      }));
  }, [active, formatMoney]);

  if (totalCount === 0) {
    return (
      <EmptyTile
        message="Nothing turned down in this period."
        hint="Good news — no lost business to explain."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <button
            key={row.reason}
            type="button"
            onClick={() => row.count > 0 && setOpenIndex(index)}
            disabled={row.count === 0}
            className="block w-full rounded-lg px-1.5 py-1 text-left transition-colors enabled:hover:bg-secondary/60 disabled:cursor-default disabled:opacity-55"
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">
                {row.reason}
              </span>
              <span className="shrink-0 tabular-nums">
                <strong className="font-semibold">{row.count}</strong>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatMoney(row.value)}
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`h-full rounded-full ${TONES[index % TONES.length]}`}
              />
            </div>
          </button>
        ))}
      </div>

      <DetailDialog
        open={active !== null}
        onOpenChange={(next) => !next && setOpenIndex(null)}
        title={active?.reason ?? ""}
        summary={
          active
            ? `${active.count} ${
                active.count === 1 ? "item" : "items"
              } not taken · ${formatMoney(active.value)} · ${periodLabel}`
            : ""
        }
        rows={detailRows}
      />
    </>
  );
}

/** Shared header figure: "6 lost · AED 840K". */
export function LossReasonsSummary({
  rows,
  formatMoney,
}: {
  rows: LossReasonRow[];
  formatMoney: (value: number) => string;
}) {
  const count = rows.reduce((sum, r) => sum + r.count, 0);
  const value = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
      <AnimatedNumber value={count} /> not taken · {formatMoney(value)}
    </span>
  );
}
