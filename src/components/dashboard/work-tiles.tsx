"use client";

import type {
  CashRow,
  ExpectedCloseRow,
  WaitingSampleRow,
} from "@/lib/dashboard-metrics";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { EmptyTile } from "@/components/dashboard/empty-tile";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

/**
 * Expected to close — open deals with a close date in the window.
 *
 * Shows the raw total and the weighted total together: a forecast that
 * ignores probability flatters itself every single month.
 */
export function ExpectedCloseTile({
  rows,
  formatMoney,
}: {
  rows: ExpectedCloseRow[];
  formatMoney: (value: number) => string;
}) {
  if (rows.length === 0) {
    return <EmptyTile message="No deals expected to close in this period." />;
  }

  return (
    <ul className="space-y-1.5">
      {rows.map(({ deal, value }) => {
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
export function SamplesAwaitingTile({ rows }: { rows: WaitingSampleRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyTile
        message="No samples waiting on feedback."
        hint="Every sample sent has a reply."
      />
    );
  }

  return (
    <ul className="space-y-1.5">
      {rows.map(({ deal, sentAt, daysWaiting }) => (
        <li
          key={deal.id}
          className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{deal.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {deal.company} · sent {shortDate(sentAt)}
            </p>
          </div>
          <span
            className={
              daysWaiting >= 14
                ? "shrink-0 rounded-full bg-destructive/12 px-2 py-0.5 text-[11px] font-medium text-destructive tabular-nums"
                : "shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning tabular-nums"
            }
          >
            {daysWaiting}d
          </span>
        </li>
      ))}
    </ul>
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
