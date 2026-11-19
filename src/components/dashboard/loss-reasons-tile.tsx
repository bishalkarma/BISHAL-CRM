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
 * Why we lose — whole-deal losses and individual product rejections.
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
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const active = openIndex === null ? null : rows[openIndex];

  const maxValue = Math.max(...rows.map((r) => r.value), 0);
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const totalCount = rows.reduce((sum, r) => sum + r.count, 0);

  /* Club lost entries by customer + date: same customer on the same date
     becomes 1 row with its line items; different dates stay separate rows. */
  const groupedEntries = React.useMemo(() => {
    if (!active) return [];
    const groups = new Map<
      string,
      {
        id: string;
        company: string;
        companyId: string;
        dealTitles: Set<string>;
        items: string[];
        value: number;
        dateIso: string | null;
        entries: LossReasonRow["lines"];
      }
    >();

    for (const entry of active.lines) {
      const { deal, line, value } = entry;
      const dateIso =
        (deal.stage === "lost" ? closedAt(deal) : null) ?? deal.createdAt ?? null;
      const dateKey = dateIso ? dateIso.slice(0, 10) : "unknown";
      const customerKey = deal.companyId || deal.company;
      const key = `${customerKey}::${dateKey}`;

      let group = groups.get(key);
      if (!group) {
        group = {
          id: key,
          company: deal.company,
          companyId: deal.companyId,
          dealTitles: new Set(),
          items: [],
          value: 0,
          dateIso,
          entries: [],
        };
        groups.set(key, group);
      }
      group.dealTitles.add(deal.title);
      group.items.push(line?.product ?? deal.title);
      group.value += value;
      group.entries.push(entry);
    }

    return Array.from(groups.values()).sort((a, b) => b.value - a.value);
  }, [active]);

  const selectedGroup = React.useMemo(
    () => groupedEntries.find((g) => g.id === selectedGroupId) ?? null,
    [groupedEntries, selectedGroupId],
  );

  const detailRows: DetailRow[] = React.useMemo(() => {
    if (selectedGroup) {
      return selectedGroup.entries
        .slice()
        .sort((a, b) => b.value - a.value)
        .map(({ deal, line, value }) => ({
          id: `${deal.id}-${line?.id ?? "deal"}`,
          title: line
            ? `${line.product}${line.brand ? ` (${line.brand})` : ""}`
            : deal.title,
          meta: line
            ? `${deal.title} · ${line.quantity} ${line.unit} × ${formatMoney(line.unitPrice)}${
                line.lostReasonNote ? ` — ${line.lostReasonNote}` : ""
              }`
            : deal.title,
          value: formatMoney(value),
          hint: line?.rejectReason ?? deal.lostReason ?? active?.reason,
        }));
    }

    return groupedEntries.map((group) => ({
      id: group.id,
      title: group.company,
      meta: `${Array.from(group.dealTitles).join(", ")} · ${group.items.join(", ")}`,
      value: formatMoney(group.value),
      hint: group.dateIso
        ? new Date(group.dateIso).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        : undefined,
    }));
  }, [groupedEntries, selectedGroup, active?.reason, formatMoney]);

  if (totalCount === 0) {
    return (
      <EmptyTile
        message="No losses recorded in this period."
        hint="Lost deals and rejected items appear here."
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
                animate={{
                  width: `${
                    maxValue > 0
                      ? (row.value / maxValue) * 100
                      : (row.count / maxCount) * 100
                  }%`,
                }}
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
        onOpenChange={(next) => {
          if (!next) {
            setOpenIndex(null);
            setSelectedGroupId(null);
          }
        }}
        title={selectedGroup ? selectedGroup.company : (active?.reason ?? "")}
        linkHref={
          selectedGroup?.companyId
            ? `/pipeline?outcome=lost&companyId=${selectedGroup.companyId}`
            : "/pipeline?outcome=lost"
        }
        linkLabel={selectedGroup ? "Open in Deal lost" : "Deal lost"}
        backLabel={selectedGroup && active ? `Back to ${active.reason}` : undefined}
        onBack={selectedGroup ? () => setSelectedGroupId(null) : undefined}
        onRowClick={selectedGroup ? undefined : (row) => setSelectedGroupId(row.id)}
        summary={
          selectedGroup
            ? `${
                selectedGroup.dateIso
                  ? `${new Date(selectedGroup.dateIso).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })} · `
                  : ""
              }${formatMoney(selectedGroup.value)} · ${selectedGroup.entries.length} ${
                selectedGroup.entries.length === 1 ? "lost item" : "lost items"
              }`
            : active
              ? `${active.count} ${
                  active.count === 1 ? "loss entry" : "loss entries"
                } · ${formatMoney(active.value)} · ${periodLabel}`
              : ""
        }
        rows={detailRows}
      />
    </>
  );
}

/** Entries are lost/rejected lines, or a legacy deal without lines. */
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
      <AnimatedNumber value={count} /> loss {count === 1 ? "entry" : "entries"} · {formatMoney(value)}
    </span>
  );
}
