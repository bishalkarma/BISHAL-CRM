"use client";

import * as React from "react";
import {
  CalendarClock,
  Check,
  Package,
  PackageCheck,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { isClosedDeal, type Deal } from "@/lib/deals";
import {
  COMMERCIAL_STATUS_META,
  LOST_REASONS,
  dealValue,
  lineCommercialStatus,
  lineTotal,
  lostLineValue,
  potentialValue,
  wonValue,
  closePeriods,
  reopenPeriods,
  type CommercialLineStatus,
  type LineItem,
  type LostReason,
} from "@/lib/deal-model";
import {
  buildSampleLedger,
  defaultSampleQtyForLine,
  formatSampleDate,
  type SampleLedgerEntry,
} from "@/lib/samples";
import { useData } from "@/components/providers/data-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  GiveSampleDialog,
  SampleDaysBadge,
  ScheduleSampleFollowUpDialog,
  TakeBackSampleDialog,
  type GiveSampleDialogTarget,
} from "@/components/samples/sample-dialogs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const qtyPriceFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
const lineTotalFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/**
 * Unified "Line Items & Samples" list inside DealDrawer (BUILD 18.15).
 *
 * Merges commercial quote line items (Brand, Quote Qty × Unit Price, Total,
 * QUOTED / APPROVED / REJECTED status) and physical Sample Custody + Verdict
 * into ONE card per product — eliminating duplicate product lists and keeping
 * Deal Value at #1 on top of DealDrawer.
 *
 * Four adaptive card states:
 *  1. Sample Out With Customer -> Commercial row + live custody clock
 *     (7d Amber / 14d+ Red), Mark Taken Back, Approve/Reject, + Follow-up.
 *  2. Sample Returned / Consumable, Verdict Open -> Commercial row +
 *     Given -> Taken back (Held X days) + Approve/Reject + Undo return.
 *  3. Completed (Verdict Decided + Sample Returned/Consumable) -> Collapses
 *     into a 1-line compact sample audit strip with "Change" toggle & Edit.
 *  4. Regular Quoted Product (No Sample) -> Slim commercial card with a
 *     compact "+ Give sample" trigger on open deals.
 */
export function SampleTracker({ deal }: { deal: Deal }) {
  const { companies, contacts, activities, updateDeal } = useData();
  const { toDisplay, format } = useCurrency();
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [rejecting, setRejecting] = React.useState<LineItem | null>(null);
  const [giveTarget, setGiveTarget] =
    React.useState<GiveSampleDialogTarget | null>(null);
  const [takeBackEntry, setTakeBackEntry] =
    React.useState<SampleLedgerEntry | null>(null);
  const [followUpEntry, setFollowUpEntry] =
    React.useState<SampleLedgerEntry | null>(null);

  const toggleExpanded = (lineId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const hasAnySample = deal.lines.some((l) => Boolean(l.sample?.sentAt));

  const dealLedger = buildSampleLedger({
    deals: [deal],
    customerSamples: [],
    companies,
    contacts,
    activities,
  });
  const entryByLineId = new Map(
    dealLedger.map((entry) => [entry.lineId ?? "", entry]),
  );

  const outCount = dealLedger.filter((e) => e.returnStatus === "out").length;
  const returnedCount = dealLedger.filter(
    (e) => e.returnStatus === "returned",
  ).length;
  const consumableCount = dealLedger.filter(
    (e) => e.returnStatus === "consumable",
  ).length;
  const overdueCount = dealLedger.filter(
    (e) => e.returnStatus === "out" && e.tone === "out-overdue",
  ).length;

  const money = (v: number) => format(v, { compact: true });

  const patchLine = (id: string, patch: Partial<LineItem>) =>
    updateDeal(deal.id, {
      lines: deal.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  const setCommercialStatus = (line: LineItem, status: CommercialLineStatus) => {
    const now = new Date().toISOString();
    const lines = deal.lines.map((item) =>
      item.id === line.id ? { ...item, commercialStatus: status } : item,
    );
    const willClose = lines.length > 0 && lines.every((item) => lineCommercialStatus(item) !== "potential");
    const wasClosed = isClosedDeal(deal);
    const patch: Partial<Deal> = {
      lines,
      value: dealValue(lines),
      lifecycleStatus: willClose ? "closed" : "open",
      closedAt: willClose ? deal.closedAt ?? now : null,
      closedFromStage: willClose ? deal.closedFromStage ?? deal.stage : undefined,
      lastActivityAt: now,
    };
    if (willClose && !wasClosed) patch.periods = closePeriods(deal.periods, now);
    if (!willClose && wasClosed) {
      patch.stage = deal.closedFromStage ?? "negotiation";
      patch.closedFromStage = undefined;
      patch.periods = reopenPeriods(deal.periods, now);
    }
    updateDeal(deal.id, patch);
  };

  const undoSent = (l: LineItem) =>
    patchLine(l.id, {
      sample: null,
      sampleVerdict: null,
    });

  const undoReturned = (l: LineItem) => {
    if (!l.sample) return;
    patchLine(l.id, {
      sample: {
        ...l.sample,
        returnedAt: null,
        returnStatus: "out",
      },
    });
  };

  const approve = (l: LineItem) => {
    patchLine(l.id, {
      sampleVerdict: "approved",
      sample: l.sample
        ? {
            ...l.sample,
            feedbackAt: l.sample.feedbackAt ?? new Date().toISOString(),
          }
        : null,
    });
    setExpandedIds((prev) => {
      if (!prev.has(l.id)) return prev;
      const next = new Set(prev);
      next.delete(l.id);
      return next;
    });
  };

  const reject = (l: LineItem, reason: LostReason) => {
    patchLine(l.id, {
      sampleVerdict: "rejected",
      sample: l.sample
        ? {
            ...l.sample,
            feedback: reason,
            feedbackAt: l.sample.feedbackAt ?? new Date().toISOString(),
          }
        : null,
    });
    setExpandedIds((prev) => {
      if (!prev.has(l.id)) return prev;
      const next = new Set(prev);
      next.delete(l.id);
      return next;
    });
  };

  const clearVerdict = (l: LineItem) =>
    patchLine(l.id, {
      sampleVerdict: null,
      sample: l.sample ? { ...l.sample, feedbackAt: null, feedback: null } : null,
    });

  const isClosed = isClosedDeal(deal);
  const wonTotal = toDisplay(wonValue(deal.lines), deal.currency);
  const lostTotal = toDisplay(lostLineValue(deal.lines), deal.currency);
  const potentialTotal = toDisplay(potentialValue(deal.lines), deal.currency);

  return (
    <div>
      {/* Unified Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {hasAnySample ? "Line items & samples" : "Line items"}
        </span>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums">
          <span className="text-muted-foreground">
            {deal.lines.length}{" "}
            {deal.lines.length === 1 ? "product" : "products"}
          </span>
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-warning">
            Potential {money(potentialTotal)}
          </span>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">
            Won {money(wonTotal)}
          </span>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
            Lost {money(lostTotal)}
          </span>

          {outCount > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold",
                overdueCount > 0
                  ? "bg-destructive/15 text-destructive"
                  : "bg-accent/15 text-accent",
              )}
            >
              {overdueCount > 0
                ? `${outCount} out · ${overdueCount} overdue`
                : `${outCount} out`}
            </span>
          )}

          {returnedCount > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success">
              {returnedCount} returned
            </span>
          )}

          {outCount === 0 && returnedCount === 0 && consumableCount > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-muted-foreground">
              {consumableCount} consumable
            </span>
          )}
        </div>
      </div>

      {/* Closed-deal warning if physical samples are still out at customer */}
      {outCount > 0 && isClosed && (
        <div className="mb-2.5 rounded-lg border border-warning/45 bg-warning/10 px-3 py-2 text-xs text-warning">
          This opportunity is closed, but <strong>{outCount}</strong> physical{" "}
          {outCount === 1 ? "sample is" : "samples are"} still out with{" "}
          <strong>{deal.company}</strong>. Click <strong>Mark Taken Back</strong> once collected.
        </div>
      )}

      {/* Unified Product Cards */}
      <ul className="space-y-2">
        {deal.lines.map((line) => {
          const commercialStatus = lineCommercialStatus(line);
          const meta = COMMERCIAL_STATUS_META[commercialStatus];
          const entry = entryByLineId.get(line.id) ?? null;
          const isVerdictDecided =
            line.sampleVerdict === "approved" || line.sampleVerdict === "rejected";
          const isCustodySettled = Boolean(
            entry &&
              (entry.returnStatus === "returned" ||
                entry.returnStatus === "consumable"),
          );
          const isExpanded = expandedIds.has(line.id);

          // STATE 3: Both verdict decided AND physical custody settled -> 1-line compact strip!
          const isCompactCompleted =
            Boolean(entry) && isVerdictDecided && isCustodySettled && !isExpanded;

          const cardBorderClass = !entry
            ? "border-border"
            : isCompactCompleted
              ? "border-border"
              : entry.returnStatus === "returned"
                ? "border-success/35"
                : entry.tone === "out-overdue"
                  ? "border-destructive/45"
                  : entry.tone === "out-followup"
                    ? "border-warning/45"
                    : "border-border";

          const qtyGiven = defaultSampleQtyForLine(line);
          const openFollowUp =
            entry?.followUpTask && !entry.followUpTask.taskDone
              ? entry.followUpTask
              : null;

          return (
            <li
              key={line.id}
              className={cn(
                "rounded-xl border bg-card/60 p-3 transition-colors",
                cardBorderClass,
                commercialStatus === "lost" && "opacity-75",
              )}
            >
              {/* TOP HALF: Commercial Product + Quote Qty × Unit Price + Total + Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "break-words text-sm font-semibold",
                      commercialStatus === "lost" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {line.product}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {line.brand ? `${line.brand} · ` : ""}
                    {line.quantity} {line.unit} ×{" "}
                    {qtyPriceFormatter.format(line.unitPrice)}
                  </div>
                  {line.sampleVerdict && (
                    <div className={cn("mt-0.5 text-[11px]", line.sampleVerdict === "approved" ? "text-success" : "text-warning")}>
                      Sample {line.sampleVerdict}
                      {line.sample?.feedback ? ` · ${line.sample.feedback}` : ""}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {lineTotalFormatter.format(lineTotal(line))}
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      meta.tint,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sales outcome
                </span>
                {(["potential", "won", "lost"] as const).map((status) => (
                  <Button
                    key={status}
                    size="xs"
                    variant={commercialStatus === status ? "default" : "outline"}
                    className={cn(
                      "h-6 px-2 text-[10px]",
                      status === "won" && commercialStatus === status && "bg-success text-success-foreground hover:bg-success/90",
                      status === "lost" && commercialStatus === status && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    )}
                    onClick={() => setCommercialStatus(line, status)}
                  >
                    {status === "potential" ? "Potential" : status === "won" ? "Won" : "Lost"}
                  </Button>
                ))}
                {!entry && (
                  <button
                    type="button"
                    onClick={() => setGiveTarget({ mode: "deal-line", deal, line })}
                    className="ml-auto inline-flex h-6 items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <Package className="size-3" />
                    + Give sample
                  </button>
                )}
              </div>

              {/* STATE 3: Auto-Compact Completed Strip — Same 2-Row Sample Layout (BUILD 18.17) */}
              {entry && isCompactCompleted && (
                <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2">
                  {/* Row 1: Sample Qty (left) + Held X days badge & Change/Edit (right) */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Sample: {qtyGiven} {line.unit}
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <SampleDaysBadge entry={entry} compact />
                      <button
                        type="button"
                        onClick={() => toggleExpanded(line.id)}
                        className="inline-flex h-6 items-center rounded-md border border-border bg-secondary/30 px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setGiveTarget({ mode: "edit", entry })}
                        title="Edit sample details"
                        className="inline-flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Full-width Given -> Taken back dates */}
                  <p className="text-xs text-muted-foreground">
                    {entry.returnStatus === "returned" && entry.returnedAt ? (
                      <>
                        Given:{" "}
                        <strong className="whitespace-nowrap font-medium text-foreground">
                          {formatSampleDate(entry.sentAt)}
                        </strong>{" "}
                        <span aria-hidden>→</span> Taken back:{" "}
                        <strong className="whitespace-nowrap font-semibold text-success">
                          {formatSampleDate(entry.returnedAt)}
                        </strong>
                      </>
                    ) : (
                      <>
                        Given:{" "}
                        <strong className="whitespace-nowrap font-medium text-foreground">
                          {formatSampleDate(entry.sentAt)}
                        </strong>{" "}
                        · Consumable (kept by client)
                      </>
                    )}
                    {entry.returnNote ? ` · ${entry.returnNote}` : ""}
                  </p>
                </div>
              )}

              {/* STATES 1 & 2 (or Expanded State 3): Active Sample Custody & Verdict Strip */}
              {entry && !isCompactCompleted && (
                <div className="mt-2.5 space-y-2 border-t border-dashed border-border/70 pt-2.5">
                  {/* Row 1: Sample Qty (left) + Custody Days Badge (right) */}
                  {/* Row 2: Full-width Given -> Taken back / Recipient dates (BUILD 18.16) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Sample: {qtyGiven} {line.unit}
                      </span>
                      <SampleDaysBadge entry={entry} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {entry.returnStatus === "returned" && entry.returnedAt ? (
                        <>
                          Given:{" "}
                          <strong className="whitespace-nowrap font-medium text-foreground">
                            {formatSampleDate(entry.sentAt)}
                          </strong>{" "}
                          <span aria-hidden>→</span> Taken back:{" "}
                          <strong className="whitespace-nowrap font-semibold text-success">
                            {formatSampleDate(entry.returnedAt)}
                          </strong>
                        </>
                      ) : entry.returnStatus === "consumable" ? (
                        <>
                          Given:{" "}
                          <strong className="whitespace-nowrap font-medium text-foreground">
                            {formatSampleDate(entry.sentAt)}
                          </strong>{" "}
                          · Consumable (kept by client)
                        </>
                      ) : (
                        <>
                          Given:{" "}
                          <strong className="whitespace-nowrap font-medium text-foreground">
                            {formatSampleDate(entry.sentAt)}
                          </strong>{" "}
                          · To: {entry.recipientLabel}
                        </>
                      )}
                    </p>

                    {entry.handoverNote && (
                      <p className="break-words text-[11px] text-muted-foreground/90">
                        Note: &ldquo;{entry.handoverNote}&rdquo;
                      </p>
                    )}
                    {entry.returnNote && (
                      <p className="break-words text-[11px] text-success">
                        Return note: &ldquo;{entry.returnNote}&rdquo;
                      </p>
                    )}
                    {entry.returnStatus === "out" && openFollowUp && (
                      <p className="text-[11px] text-accent">
                        Follow-up scheduled:{" "}
                        <span className="whitespace-nowrap">
                          {formatSampleDate(openFollowUp.taskDueAt)}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Action Controls: Physical Return + Commercial Verdict + Utilities */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.returnStatus === "out" && (
                        <Button
                          size="xs"
                          className="h-7 bg-success text-xs text-success-foreground hover:bg-success/90"
                          onClick={() => setTakeBackEntry(entry)}
                        >
                          <PackageCheck className="size-3" />
                          Mark Taken Back
                        </Button>
                      )}

                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sample feedback:
                      </span>

                      {line.sampleVerdict === "approved" ? (
                        <Verdict tone="won" onClear={() => clearVerdict(line)}>
                          Approved
                        </Verdict>
                      ) : line.sampleVerdict === "rejected" ? (
                        <Verdict tone="lost" onClear={() => clearVerdict(line)}>
                          Rejected
                        </Verdict>
                      ) : (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => approve(line)}
                          >
                            <Check className="size-3" />
                            Approved
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setRejecting(line)}
                          >
                            <X className="size-3" />
                            Rejected
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.returnStatus === "out" && !openFollowUp && (
                        <button
                          type="button"
                          onClick={() => setFollowUpEntry(entry)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-secondary/40 px-2 text-[11px] font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          title="Schedule pickup follow-up task"
                        >
                          <CalendarClock className="size-3" />
                          + Follow-up
                        </button>
                      )}

                      {entry.returnStatus === "returned" && (
                        <button
                          type="button"
                          onClick={() => undoReturned(line)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Reopen as still out with customer"
                        >
                          <RotateCcw className="size-3" />
                          Undo return
                        </button>
                      )}

                      {isVerdictDecided && isCustodySettled && isExpanded && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(line.id)}
                          className="inline-flex h-7 items-center rounded-lg border border-border bg-secondary/40 px-2 text-[11px] font-medium text-foreground hover:bg-secondary"
                        >
                          Done
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setGiveTarget({ mode: "edit", entry })}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="Edit sample handover details"
                      >
                        <Pencil className="size-3" />
                      </button>

                      {entry.returnStatus !== "returned" && (
                        <button
                          type="button"
                          onClick={() => undoSent(line)}
                          title="Remove sample from this line"
                          className="inline-flex h-7 items-center rounded-lg border border-border px-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <RejectDialog
        line={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        onConfirm={(reason) => {
          if (rejecting) reject(rejecting, reason);
          setRejecting(null);
        }}
      />

      <GiveSampleDialog
        target={giveTarget}
        onOpenChange={(open) => !open && setGiveTarget(null)}
      />

      <TakeBackSampleDialog
        entry={takeBackEntry}
        onOpenChange={(open) => !open && setTakeBackEntry(null)}
      />

      <ScheduleSampleFollowUpDialog
        entry={followUpEntry}
        onOpenChange={(open) => !open && setFollowUpEntry(null)}
      />
    </div>
  );
}

function Verdict({
  tone,
  children,
  onClear,
}: {
  tone: "won" | "lost";
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-medium",
          tone === "won"
            ? "bg-success/15 text-success"
            : "bg-destructive/12 text-destructive",
        )}
      >
        {children}
      </span>
      <button
        type="button"
        onClick={onClear}
        title="Clear this verdict"
        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <RotateCcw className="size-3" />
      </button>
    </div>
  );
}

function RejectDialog({
  line,
  onOpenChange,
  onConfirm,
}: {
  line: LineItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: LostReason) => void;
}) {
  const [reason, setReason] = React.useState<LostReason>(LOST_REASONS[0]);

  React.useEffect(() => {
    if (line) setReason(LOST_REASONS[0]);
  }, [line]);

  return (
    <Dialog open={Boolean(line)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Why was it turned down?</DialogTitle>
          <DialogDescription className="break-words">
            {line?.product}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {LOST_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                reason === r
                  ? "border-accent bg-accent/[0.07]"
                  : "border-border hover:border-accent/40",
              )}
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-full border",
                  reason === r ? "border-4 border-accent" : "border-border",
                )}
              />
              {r}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          This value moves to Why we lose under the reason you pick.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Mark lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
