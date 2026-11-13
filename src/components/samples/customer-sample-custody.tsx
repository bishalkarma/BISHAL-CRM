"use client";

import * as React from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  buildSampleLedger,
  formatSampleDate,
  type SampleLedgerEntry,
} from "@/lib/samples";
import { useData } from "@/components/providers/data-provider";
import {
  GiveSampleDialog,
  SampleDaysBadge,
  ScheduleSampleFollowUpDialog,
  TakeBackSampleDialog,
  type GiveSampleDialogTarget,
} from "./sample-dialogs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Customer-scoped Sample Custody summary & actions inside CompanyDrawer.
 *
 * Shows BOTH Deal line-item samples AND Standalone Customer samples given
 * without a deal, plus a 1-click "+ Give sample" trigger.
 *
 * Note: Intentionally uses zero internal scrollbars so CompanyDrawer's unified
 * mobile and desktop scroll containers remain clean.
 */
export function CustomerSampleCustody({
  companyId,
  compact = false,
}: {
  companyId: string;
  compact?: boolean;
}) {
  const {
    deals,
    customerSamples,
    companies,
    contacts,
    activities,
    updateDeal,
    updateCustomerSample,
  } = useData();

  const [showHistory, setShowHistory] = React.useState(false);
  const [giveTarget, setGiveTarget] =
    React.useState<GiveSampleDialogTarget | null>(null);
  const [takeBackEntry, setTakeBackEntry] =
    React.useState<SampleLedgerEntry | null>(null);
  const [followUpEntry, setFollowUpEntry] =
    React.useState<SampleLedgerEntry | null>(null);

  const ledger = React.useMemo(() => {
    const companyDeals = deals.filter((d) => d.companyId === companyId);
    const standalone = customerSamples.filter((s) => s.companyId === companyId);
    return buildSampleLedger({
      deals: companyDeals,
      customerSamples: standalone,
      companies,
      contacts,
      activities,
    });
  }, [deals, customerSamples, companies, contacts, activities, companyId]);

  const activeOut = ledger.filter((e) => e.returnStatus === "out");
  const historyRows = ledger.filter((e) => e.returnStatus !== "out");
  const overdueCount = activeOut.filter((e) => e.tone === "out-overdue").length;

  const handleUndoReturn = (entry: SampleLedgerEntry) => {
    if (entry.source === "deal" && entry.dealId && entry.lineId) {
      const deal = deals.find((d) => d.id === entry.dealId);
      if (!deal) return;
      updateDeal(deal.id, {
        lines: deal.lines.map((l) =>
          l.id === entry.lineId && l.sample
            ? {
                ...l,
                sample: {
                  ...l.sample,
                  returnedAt: null,
                  returnStatus: "out",
                },
              }
            : l,
        ),
      });
    } else if (entry.source === "standalone" && entry.standaloneId) {
      updateCustomerSample(entry.standaloneId, {
        returnedAt: null,
        returnStatus: "out",
      });
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border",
        compact ? "p-2.5" : "p-3.5",
        overdueCount > 0
          ? "border-destructive/45 bg-destructive/[0.04]"
          : activeOut.length > 0
            ? "border-accent/35 bg-accent/[0.04]"
            : "border-border bg-secondary/20",
      )}
    >
      {/* Header + "+ Give sample" */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Package
            className={cn(
              "size-3.5 shrink-0",
              overdueCount > 0 ? "text-destructive" : "text-accent",
            )}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Samples
          </span>
          {activeOut.length > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                overdueCount > 0
                  ? "bg-destructive/15 text-destructive"
                  : "bg-accent/15 text-accent",
              )}
            >
              {activeOut.length} out
              {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
            </span>
          )}
          {activeOut.length === 0 && historyRows.length > 0 && (
            <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
              {historyRows.length} returned
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-7 text-[11px]"
          onClick={() => setGiveTarget({ mode: "company", companyId })}
        >
          <Plus className="size-3" />
          Give sample
        </Button>
      </div>

      {/* Empty state */}
      {ledger.length === 0 && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          No samples recorded for this customer yet. Tap{" "}
          <strong>Give sample</strong> even if there is no deal.
        </p>
      )}

      {/* Active Out Samples */}
      {activeOut.length > 0 && (
        <ul className="mt-2 space-y-2">
          {activeOut.map((entry) => {
            const openFollowUp =
              entry.followUpTask && !entry.followUpTask.taskDone
                ? entry.followUpTask
                : null;
            return (
              <li
                key={entry.key}
                className={cn(
                  "rounded-lg border bg-card/85 p-2.5",
                  entry.tone === "out-overdue"
                    ? "border-destructive/40"
                    : entry.tone === "out-followup"
                      ? "border-warning/40"
                      : "border-border",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="break-words text-xs font-semibold text-foreground sm:text-[13px]">
                        {entry.product} ({entry.sampleQty} {entry.unit})
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {entry.dealId ?? "Standalone"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Given{" "}
                      <strong className="text-foreground">
                        {formatSampleDate(entry.sentAt)}
                      </strong>{" "}
                      · {entry.recipientLabel}
                    </p>
                    {entry.dealAlertNote && (
                      <p className="mt-0.5 text-[10px] font-semibold text-warning">
                        {entry.dealAlertNote}
                      </p>
                    )}
                  </div>
                  <SampleDaysBadge entry={entry} compact />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-border/60 pt-2">
                  <Button
                    type="button"
                    size="xs"
                    className="h-7 bg-success text-[11px] text-success-foreground hover:bg-success/90"
                    onClick={() => setTakeBackEntry(entry)}
                  >
                    <PackageCheck className="size-3" />
                    Taken back
                  </Button>

                  <div className="flex flex-wrap items-center gap-1">
                    {openFollowUp ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                        <CalendarClock className="size-3" />
                        {formatSampleDate(openFollowUp.taskDueAt)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFollowUpEntry(entry)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 text-[10px] font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      >
                        <CalendarClock className="size-3" />
                        Follow-up
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setGiveTarget({ mode: "edit", entry })}
                      className="inline-flex h-7 items-center rounded-md border border-border px-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Edit sample"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Returned / Consumable History Toggle */}
      {historyRows.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showHistory ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            {showHistory ? "Hide" : "Show"} {historyRows.length} returned /
            closed {historyRows.length === 1 ? "sample" : "samples"}
          </button>

          {showHistory && (
            <ul className="mt-1.5 space-y-1.5">
              {historyRows.map((entry) => (
                <li
                  key={entry.key}
                  className="space-y-1 rounded-lg border border-border/70 bg-card/60 px-2.5 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {entry.product} ({entry.sampleQty} {entry.unit})
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <SampleDaysBadge entry={entry} compact />
                      {entry.returnStatus === "returned" && (
                        <button
                          type="button"
                          onClick={() => handleUndoReturn(entry)}
                          title="Undo return"
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <RotateCcw className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Given:{" "}
                    <strong className="whitespace-nowrap font-medium text-foreground">
                      {formatSampleDate(entry.sentAt)}
                    </strong>
                    {entry.returnedAt ? (
                      <>
                        {" "}
                        <span aria-hidden>→</span> Taken back:{" "}
                        <strong className="whitespace-nowrap font-semibold text-success">
                          {formatSampleDate(entry.returnedAt)}
                        </strong>
                      </>
                    ) : (
                      " · Consumable"
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <GiveSampleDialog
        target={giveTarget}
        onOpenChange={(o) => !o && setGiveTarget(null)}
      />

      <TakeBackSampleDialog
        entry={takeBackEntry}
        onOpenChange={(o) => !o && setTakeBackEntry(null)}
      />

      <ScheduleSampleFollowUpDialog
        entry={followUpEntry}
        onOpenChange={(o) => !o && setFollowUpEntry(null)}
      />
    </div>
  );
}
