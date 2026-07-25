"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { SPANCOP_MAP, type SpancopStage } from "@/lib/spancop";
import {
  buildPeriod,
  buildStageFlow,
  conversionRate,
  type PeriodType,
} from "@/lib/spancop-periods";
import { useData } from "@/components/providers/data-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PERIODS: { id: PeriodType; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

export function SpancopFunnelWidget() {
  const { companies, transitions } = useData();
  const [periodType, setPeriodType] = React.useState<PeriodType>("month");

  const period = React.useMemo(() => buildPeriod(periodType), [periodType]);

  const currentStages = React.useMemo(
    () =>
      Object.fromEntries(companies.map((c) => [c.id, c.spancop])) as Record<
        string,
        SpancopStage
      >,
    [companies],
  );

  const flows = React.useMemo(
    () => buildStageFlow(transitions, currentStages, period),
    [transitions, currentStages, period],
  );

  // Current period: "furthest reached so far" and "where they are" coincide,
  // so show live counts. Past periods show real progress instead.
  const useFurthest = !period.isCurrent;
  const countFor = (f: (typeof flows)[number]) =>
    useFurthest ? f.furthest : f.current;

  const max = Math.max(...flows.map(countFor), 1);
  const totalMovements = flows.reduce((sum, f) => sum + f.in, 0);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>SPANCOP</CardTitle>
          <CardDescription>
            {useFurthest
              ? `Furthest stage reached · ${period.label}`
              : `Where customers stand today · ${period.label}`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodType(p.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  periodType === p.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link
            href={`/spancop-report?period=${periodType}`}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            <ArrowUpRight className="size-3.5" />
            Details
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5">
        {flows.map((flow, index) => {
          const def = SPANCOP_MAP[flow.stage];
          const count = countFor(flow);
          // Taper the bars so the row reads as a funnel.
          const widthPct = Math.max(
            (count / max) * 100 * (1 - index * 0.055),
            count > 0 ? 14 : 6,
          );

          return (
            <div key={flow.stage} className="flex items-center gap-2.5">
              <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-secondary/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn("absolute inset-y-0 left-0", def.color)}
                />
                <div className="relative flex h-full items-center justify-between px-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white mix-blend-luminosity">
                    <span className="font-bold">{def.letter}</span>
                    <span className="hidden sm:inline">{def.label}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              </div>

              {/* Movement is period-scoped, so the filter always does something */}
              <div className="w-[86px] shrink-0 text-right text-[11px] tabular-nums">
                {flow.in > 0 ? (
                  <span className="font-medium text-success">+{flow.in} in</span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
                {flow.out > 0 && (
                  <span className="text-muted-foreground"> · {flow.out} out</span>
                )}
              </div>
            </div>
          );
        })}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs">
          <span className="text-muted-foreground">
            Approach → Negotiate{" "}
            <strong className="font-semibold text-foreground">
              {conversionRate(flows, "approach", "negotiate")}%
            </strong>
          </span>
          <span className="text-muted-foreground">
            Negotiate → Close{" "}
            <strong className="font-semibold text-foreground">
              {conversionRate(flows, "negotiate", "close")}%
            </strong>
          </span>
          <span className="ml-auto text-muted-foreground">
            {totalMovements} movements
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
