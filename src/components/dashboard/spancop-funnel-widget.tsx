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
import { AnimatedNumber } from "@/components/dashboard/animated-number";
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
  /* Opens on Year, matching the "All" default the rest of the dashboard uses:
     a wider window is the honest starting view. */
  const [periodType, setPeriodType] = React.useState<PeriodType>("year");

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
    /*
      flex flex-col is load-bearing, and its absence was a real bug: every
      other dashboard tile has it, so its body fills the card. Without it this
      card sat at its natural height and left a band of dead space beneath the
      conversion line whenever the tile was taller than the content.
    */
    <Card className="flex flex-col">
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

      {/*
        Vertical columns rather than stacked rows: the widget now sits beside
        two charts at half width, and horizontal bars left a long empty strip
        underneath them. Columns also make the shape of the funnel readable at
        a glance instead of as a list.
      */}
      <CardContent className="flex flex-1 flex-col">
        {/*
          Two different questions sit in this one widget, and unlabelled they
          looked broken: the count is a snapshot of today and never moves with
          the filter, while the +N/-N figures below are movements inside the
          period. Naming both stops the top number looking stuck.
        */}
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{useFurthest ? "Furthest" : "Now"}</span>
          <span>{period.label}</span>
        </div>

        <div className="flex flex-1 items-end gap-1.5 pt-1">
          {flows.map((flow, index) => {
            const def = SPANCOP_MAP[flow.stage];
            const count = countFor(flow);
            // Empty stages keep a visible stub so the column is still a target.
            const heightPct = Math.max((count / max) * 100, count > 0 ? 12 : 5);

            return (
              <div
                key={flow.stage}
                className="flex h-full min-w-0 flex-1 flex-col items-center gap-1"
                title={`${def.label} · ${count}`}
              >
                <span className="text-sm font-semibold tabular-nums">
                  <AnimatedNumber value={count} />
                </span>

                {/* min-h keeps the shape readable in a short tile; flex-1
                    lets the bars grow into a tall one instead of stopping at
                    a fixed 120px and leaving the rest of the card empty. */}
                <div className="flex h-full min-h-[80px] w-full flex-1 items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn("w-full rounded-t-md", def.color)}
                  />
                </div>

                {/*
                  Letters only: seven columns across half the dashboard leave
                  roughly 90px each, which cannot hold "Negotiate". The full
                  name is on the tooltip and on the Details page.
                */}
                <span className="text-xs font-bold">{def.letter}</span>

                <span className="text-[10px] tabular-nums">
                  {flow.in > 0 ? (
                    <span className="font-medium text-success">+{flow.in}</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                  {flow.out > 0 && (
                    <span className="text-muted-foreground"> /{flow.out}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs">
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
