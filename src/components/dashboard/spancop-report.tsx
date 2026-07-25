"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, TrendingUp } from "lucide-react";
import { SPANCOP_MAP, type SpancopStage } from "@/lib/spancop";
import {
  buildPeriod,
  buildPeriodRecords,
  buildStageFlow,
  type PeriodType,
} from "@/lib/spancop-periods";
import { useData } from "@/components/providers/data-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, relativeTime } from "@/lib/utils";

const PERIODS: { id: PeriodType; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

export function SpancopReport({
  initialPeriod = "month",
}: {
  initialPeriod?: PeriodType;
}) {
  const { companies, transitions } = useData();
  const [periodType, setPeriodType] = React.useState<PeriodType>(initialPeriod);
  /** 0 = current period, -1 = previous, and so on. */
  const [offset, setOffset] = React.useState(0);

  const period = React.useMemo(
    () => buildPeriod(periodType, offset),
    [periodType, offset],
  );

  const currentStages = React.useMemo(
    () =>
      Object.fromEntries(companies.map((c) => [c.id, c.spancop])) as Record<
        string,
        SpancopStage
      >,
    [companies],
  );

  const records = React.useMemo(
    () => buildPeriodRecords(transitions, currentStages, period),
    [transitions, currentStages, period],
  );

  const flows = React.useMemo(
    () => buildStageFlow(transitions, currentStages, period),
    [transitions, currentStages, period],
  );

  const inPeriod = React.useMemo(() => {
    const s = period.start.getTime();
    const e = period.end.getTime();
    return transitions
      .filter((t) => {
        const at = new Date(t.at).getTime();
        return at >= s && at < e;
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [transitions, period]);

  const nameOf = (id: string) =>
    companies.find((c) => c.id === id)?.name ?? "—";

  const moved = records.filter((r) => r.movements > 0);
  const dormant = records.filter((r) => r.movements === 0);
  const reachedPayment = records.filter((r) => r.reachedPayment).length;
  const reachedOrder = records.filter(
    (r) => r.furthestReached === "order" || r.furthestReached === "payment",
  ).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="SPANCOP report"
        description={`${period.label} · ${inPeriod.length} movements across ${moved.length} customers`}
        actions={
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        }
      />

      {/* Period controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriodType(p.id);
                setOffset(0);
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                periodType === p.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous period"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="min-w-[120px] px-1 text-center text-sm font-medium">
            {period.label}
          </span>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            aria-label="Next period"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Customers moved" value={moved.length} hint={`of ${records.length}`} />
        <Tile label="Reached Order+" value={reachedOrder} hint="Order or Payment" tone="positive" />
        <Tile label="Collected payment" value={reachedPayment} hint="Full cycle" tone="positive" />
        <Tile label="No movement" value={dormant.length} hint="Dormant this period" tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Flow per stage */}
        <Card className="p-4">
          <h3 className="pb-3 text-sm font-semibold">Stage movements</h3>
          <ul className="space-y-2">
            {flows.map((flow) => {
              const def = SPANCOP_MAP[flow.stage];
              return (
                <li key={flow.stage} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
                      def.color,
                    )}
                  >
                    {def.letter}
                  </span>
                  <span className="flex-1 truncate">{def.label}</span>
                  <span className="w-16 text-right text-xs text-muted-foreground">
                    {flow.furthest} reached
                  </span>
                  <span className="w-14 text-right text-xs font-medium text-success">
                    {flow.in > 0 ? `+${flow.in}` : "—"}
                  </span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {flow.out > 0 ? `-${flow.out}` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Per-customer records */}
        <Card className="p-4">
          <h3 className="pb-3 text-sm font-semibold">
            Customer records · {period.label}
          </h3>
          <ul className="max-h-[340px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {[...records]
              .sort((a, b) => b.movements - a.movements)
              .map((record, index) => {
                const opening = SPANCOP_MAP[record.openingStage];
                const closing = SPANCOP_MAP[record.closingStage];
                const furthest = SPANCOP_MAP[record.furthestReached];
                const looped =
                  record.furthestReached !== record.closingStage &&
                  record.movements > 0;

                return (
                  <motion.li
                    key={record.companyId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: Math.min(index * 0.02, 0.2) }}
                    className="rounded-lg border border-border p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {nameOf(record.companyId)}
                      </span>
                      {record.movements === 0 ? (
                        <Badge variant="outline" className="gap-1 shrink-0">
                          <Minus />
                          No movement
                        </Badge>
                      ) : (
                        <Badge variant="accent" className="shrink-0">
                          {record.movements} moves
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={cn("rounded-full px-1.5 py-0.5", opening.tint)}>
                        {opening.label}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className={cn("rounded-full px-1.5 py-0.5", closing.tint)}>
                        {closing.label}
                      </span>
                      {/* The value that survives the loop */}
                      {looped && (
                        <span className="ml-1 flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="size-3" />
                          reached{" "}
                          <strong className="font-semibold text-foreground">
                            {furthest.label}
                          </strong>
                        </span>
                      )}
                    </div>
                  </motion.li>
                );
              })}
          </ul>
        </Card>
      </div>

      {/* Movement log */}
      <Card className="p-4">
        <h3 className="pb-3 text-sm font-semibold">Movement log</h3>
        {inPeriod.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No stage changes recorded in this period.
          </p>
        ) : (
          <ul className="max-h-[300px] space-y-1.5 overflow-y-auto scrollbar-thin">
            {inPeriod.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    SPANCOP_MAP[t.to].color,
                  )}
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {nameOf(t.companyId)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t.from ? `${SPANCOP_MAP[t.from].label} → ` : ""}
                  <strong className="font-medium text-foreground">
                    {SPANCOP_MAP[t.to].label}
                  </strong>
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {relativeTime(t.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <Card className="p-3.5">
      <div className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </div>
      <div className="truncate text-[11px] text-muted-foreground">{hint}</div>
    </Card>
  );
}
