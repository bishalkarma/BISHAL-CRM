"use client";

import * as React from "react";
import Link from "next/link";
import type {
  CashRow,
  ExpectedCloseRow,
  WaitingSampleRow,
} from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { EmptyTile } from "@/components/dashboard/empty-tile";
import {
  INITIAL_VISIBLE_ROWS,
  VISIBLE_STEP_ROWS,
} from "@/components/dashboard/top-products-tile";
import { cn } from "@/lib/utils";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

function WorkTileStepFooter({
  visibleCount,
  total,
  noun,
  onShowMore,
  onShowLess,
}: {
  visibleCount: number;
  total: number;
  noun: string;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  if (total <= INITIAL_VISIBLE_ROWS) return null;

  const shown = Math.min(visibleCount, total);
  const remaining = Math.max(0, total - shown);
  const nextStep = Math.min(VISIBLE_STEP_ROWS, remaining);

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
      {remaining > 0 && (
        <button
          type="button"
          onClick={onShowMore}
          className="flex-1 rounded-lg border border-accent/30 bg-accent/[0.08] px-3 py-1.5 text-center text-xs font-semibold text-accent transition-colors hover:bg-accent/[0.14]"
        >
          Show {nextStep} more ({shown} of {total} {noun}) ↓
        </button>
      )}
      {visibleCount > INITIAL_VISIBLE_ROWS && (
        <button
          type="button"
          onClick={onShowLess}
          className={cn(
            "rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-secondary",
            remaining === 0 && "w-full",
          )}
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}

/**
 * Expected to close — open deals with a close date in the window.
 *
 * Shows the raw total and the weighted total together: a forecast that
 * ignores probability flatters itself every single month.
 */
export function ExpectedCloseTile({
  rows,
  formatMoney,
  periodLabel,
}: {
  rows: ExpectedCloseRow[];
  formatMoney: (value: number) => string;
  periodLabel?: string;
}) {
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_ROWS);

  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ROWS);
  }, [periodLabel]);

  if (rows.length === 0) {
    return <EmptyTile message="No deals expected to close in this period." />;
  }

  const visibleRows = rows.slice(0, visibleCount);

  return (
    <div>
      <ul className="space-y-1.5">
        {visibleRows.map(({ deal, value }) => {
          const overdue = new Date(deal.expectedCloseDate).getTime() < Date.now();
          return (
            <li
              key={deal.id}
              className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{deal.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {deal.company}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(value)}
                </p>
                <p
                  className={
                    overdue
                      ? "text-[11px] font-medium text-destructive tabular-nums"
                      : "text-[11px] text-muted-foreground tabular-nums"
                  }
                >
                  {overdue ? "overdue " : ""}
                  {shortDate(deal.expectedCloseDate)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <WorkTileStepFooter
        visibleCount={visibleCount}
        total={rows.length}
        noun="deals"
        onShowMore={() =>
          setVisibleCount((prev) =>
            Math.min(rows.length, prev + VISIBLE_STEP_ROWS),
          )
        }
        onShowLess={() => setVisibleCount(INITIAL_VISIBLE_ROWS)}
      />
    </div>
  );
}

export function ExpectedCloseSummary({
  rows,
  formatMoney,
}: {
  rows: ExpectedCloseRow[];
  formatMoney: (value: number) => string;
}) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const weighted = rows.reduce((sum, r) => sum + r.weighted, 0);
  return (
    <span className="shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
      <span className="block">
        <AnimatedNumber value={rows.length} />{" "}
        {rows.length === 1 ? "deal" : "deals"} · {formatMoney(total)}
      </span>
      <span className="block">weighted {formatMoney(weighted)}</span>
    </span>
  );
}

/** Samples sent with no reply — a quiet deal-killer in HORECA. */
export function SamplesAwaitingTile({
  rows,
  formatMoney,
  periodLabel,
}: {
  rows: WaitingSampleRow[];
  formatMoney: (value: number) => string;
  periodLabel?: string;
}) {
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_ROWS);

  React.useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ROWS);
  }, [periodLabel]);

  if (rows.length === 0) {
    return (
      <EmptyTile
        message="No samples waiting on feedback."
        hint="Every sample sent has a reply."
      />
    );
  }

  const visibleRows = rows.slice(0, visibleCount);

  return (
    <div>
      <ul className="space-y-1.5">
        {visibleRows.map(({ deal, line, value, sentAt, daysWaiting }) => (
          <li
            key={`${deal.id}-${line.id}`}
            className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              {/* The line item is the subject here, not the deal — a package
                  can have one item out for sampling and seven that are not. */}
              <p className="truncate text-sm font-medium">{line.product}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {deal.company} · sent {shortDate(sentAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">
                {formatMoney(value)}
              </p>
              <p
                className={
                  daysWaiting >= 31
                    ? "text-[11px] font-medium text-destructive tabular-nums"
                    : daysWaiting >= 14
                      ? "text-[11px] font-medium text-warning tabular-nums"
                      : "text-[11px] text-muted-foreground tabular-nums"
                }
              >
                {daysWaiting}d
              </p>
            </div>
          </li>
        ))}
      </ul>
      <WorkTileStepFooter
        visibleCount={visibleCount}
        total={rows.length}
        noun="samples"
        onShowMore={() =>
          setVisibleCount((prev) =>
            Math.min(rows.length, prev + VISIBLE_STEP_ROWS),
          )
        }
        onShowLess={() => setVisibleCount(INITIAL_VISIBLE_ROWS)}
      />
      <div className="mt-2 border-t border-border/50 pt-2 text-right">
        <Link
          href="/samples"
          className="text-xs font-semibold text-accent hover:underline"
        >
          Open Samples Register →
        </Link>
      </div>
    </div>
  );
}

/** Won, delivered, invoiced — and still not paid. */
export function CashToCollectTile({
  rows,
  formatMoney,
}: {
  rows: CashRow[];
  formatMoney: (value: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyTile
        message="All clear — nothing outstanding."
        hint="No delivered order is waiting on payment."
      />
    );
  }

  return (
    <ul className="space-y-1.5">
      {rows.map(({ company, value, daysOutstanding, tone, orderCount }) => (
        <li
          key={company.id}
          className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{company.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {company.emirate}
              {orderCount > 1 && ` · ${orderCount} orders`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(value)}
            </p>
            {/* Agreed thresholds: under 30 normal, 30-60 chase, 60+ at risk. */}
            <span
              className={
                tone === "risk"
                  ? "inline-block rounded-full bg-destructive/12 px-1.5 py-0.5 text-[11px] font-medium text-destructive tabular-nums"
                  : tone === "chase"
                    ? "inline-block rounded-full bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning tabular-nums"
                    : "inline-block rounded-full bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums"
              }
            >
              {daysOutstanding} days
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CashSummary({
  rows,
  formatMoney,
}: {
  rows: CashRow[];
  formatMoney: (value: number) => string;
}) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <span className="shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
      <span className="block text-sm font-semibold text-foreground">
        {formatMoney(total)}
      </span>
      <span className="block">
        {rows.length} {rows.length === 1 ? "customer" : "customers"}
      </span>
    </span>
  );
}
