"use client";

import * as React from "react";
import {
  Beaker,
  CalendarClock,
  Check,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import type { Deal } from "@/lib/deals";
import {
  LOST_REASONS,
  dealValue,
  lineTotal,
  rejectedValue,
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

/**
 * Persistent Sample Custody & Verdict panel inside DealDrawer (BUILD 18.14).
 *
 * Key upgrades over legacy SampleTracker:
 *  • Never disappears when a deal moves to Quotation, Negotiation, Won, or Lost
 *    if any line item has a sample record!
 *  • Separates Commercial Verdict (Approve / Reject) from Physical Custody
 *    (Out with customer -> Taken back, or Consumable).
 *  • Records exact Given Date, Sample Qty, Handed To, Taken Back Date, Total
 *    Days Held, and links directly to Follow-Up Tasks.
 */
export function SampleTracker({ deal }: { deal: Deal }) {
  const { companies, contacts, activities, updateDeal } = useData();
  const { toDisplay, format } = useCurrency();
  const [dismissed, setDismissed] = React.useState(false);
  const [showUnsampledLines, setShowUnsampledLines] = React.useState(false);
  const [rejecting, setRejecting] = React.useState<LineItem | null>(null);
  const [giveTarget, setGiveTarget] =
    React.useState<GiveSampleDialogTarget | null>(null);
  const [takeBackEntry, setTakeBackEntry] =
    React.useState<SampleLedgerEntry | null>(null);
  const [followUpEntry, setFollowUpEntry] =
    React.useState<SampleLedgerEntry | null>(null);

  const hasAnySample = deal.lines.some((l) => Boolean(l.sample?.sentAt));
  if (deal.stage !== "sampling" && !hasAnySample && !showUnsampledLines) {
    return null;
  }

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
  const overdueCount = dealLedger.filter(
    (e) => e.returnStatus === "out" && e.tone === "out-overdue",
  ).length;

  const money = (v: number) => format(v, { compact: true });
  const lineMoney = (l: LineItem) =>
    money(toDisplay(lineTotal(l), deal.currency));

  const patchLine = (id: string, patch: Partial<LineItem>) =>
    updateDeal(deal.id, {
      lines: deal.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  const undoSent = (l: LineItem) =>
    patchLine(l.id, {
      sample: null,
      status: "quoted",
      rejectReason: undefined,
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

  const approve = (l: LineItem) =>
    patchLine(l.id, {
      status: "approved",
      rejectReason: undefined,
      sample: l.sample
        ? {
            ...l.sample,
            feedbackAt: l.sample.feedbackAt ?? new Date().toISOString(),
          }
        : null,
    });

  const reject = (l: LineItem, reason: LostReason) =>
    patchLine(l.id, {
      status: "rejected",
      rejectReason: reason,
      sample: l.sample
        ? {
            ...l.sample,
            feedbackAt: l.sample.feedbackAt ?? new Date().toISOString(),
          }
        : null,
    });

  const clearVerdict = (l: LineItem) =>
    patchLine(l.id, {
      status: "quoted",
      rejectReason: undefined,
      sample: l.sample ? { ...l.sample, feedbackAt: null } : null,
    });

  const sentCount = deal.lines.filter((l) => Boolean(l.sample?.sentAt)).length;
  const unsampledCount = deal.lines.length - sentCount;
  const decided = deal.lines.filter((l) => l.status !== "quoted");
  const allDecided =
    deal.stage === "sampling" &&
    deal.lines.length > 0 &&
    decided.length === deal.lines.length;
  const anyApproved = deal.lines.some((l) => l.status === "approved");

  const taken = toDisplay(dealValue(deal.lines), deal.currency);
  const notTaken = toDisplay(rejectedValue(deal.lines), deal.currency);

  const closeDeal = (stage: "won" | "lost") =>
    updateDeal(deal.id, {
      stage,
      closedFromStage: "sampling",
      lastActivityAt: new Date().toISOString(),
    });

  const linesToDisplay =
    deal.stage === "sampling" || showUnsampledLines
      ? deal.lines
      : deal.lines.filter((l) => Boolean(l.sample?.sentAt));

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        overdueCount > 0
          ? "border-destructive/45 bg-destructive/[0.04]"
          : outCount > 0
            ? "border-accent/35 bg-secondary/40"
            : "border-border bg-secondary/40",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sample Custody &amp; Verdict
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium tabular-nums">
          {outCount > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5",
                overdueCount > 0
                  ? "bg-destructive/15 text-destructive"
                  : "bg-accent/15 text-accent",
              )}
            >
              {outCount} out with client
            </span>
          )}
          {returnedCount > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
              {returnedCount} returned
            </span>
          )}
          {deal.stage !== "sampling" &&
            deal.stage !== "won" &&
            deal.stage !== "lost" &&
            unsampledCount > 0 && (
              <button
                type="button"
                onClick={() => setShowUnsampledLines((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:border-accent/40 hover:text-foreground"
              >
                <Plus className="size-3" />
                {showUnsampledLines ? "Hide unsampled" : "Give sample"}
              </button>
            )}
        </div>
      </div>

      {/* Closed-deal reminder if physical samples are still sitting at the hotel */}
      {outCount > 0 && (deal.stage === "won" || deal.stage === "lost") && (
        <div className="mt-2.5 rounded-lg border border-warning/45 bg-warning/10 px-3 py-2 text-xs text-warning">
          Deal is marked <strong className="uppercase">{deal.stage}</strong>,
          but <strong>{outCount}</strong> physical{" "}
          {outCount === 1 ? "sample is" : "samples are"} still out with{" "}
          <strong>{deal.company}</strong>. Click{" "}
          <strong>Mark Taken Back</strong> once collected.
        </div>
      )}

      {sentCount === 0 && deal.stage === "sampling" && !dismissed && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/[0.07] px-3 py-2">
          <Beaker className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Give a sample for testing?</p>
            <p className="text-[11px] text-muted-foreground">
              Click <strong>Give sample</strong> on any item below to record
              handover date, qty, receiver, and pickup follow-up.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <ul className="mt-2.5 space-y-2">
        {linesToDisplay.map((line) => {
          const entry = entryByLineId.get(line.id) ?? null;

          if (!entry) {
            return (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.product}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {line.brand ? `${line.brand} · ` : ""}Quote: {line.quantity}{" "}
                    {line.unit} · {lineMoney(line)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {line.status === "approved" ? (
                    <Verdict tone="won" onClear={() => clearVerdict(line)}>
                      Approved
                    </Verdict>
                  ) : line.status === "rejected" ? (
                    <Verdict tone="lost" onClear={() => clearVerdict(line)}>
                      Lost · {line.rejectReason}
                    </Verdict>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          setGiveTarget({ mode: "deal-line", deal, line })
                        }
                      >
                        <Beaker className="size-3" />
                        Give sample
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 px-2"
                        title="Approve without sample"
                        onClick={() => approve(line)}
                      >
                        <Check className="size-3.5" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 px-2"
                        title="Reject without sample"
                        onClick={() => setRejecting(line)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          }

          const qtyGiven = defaultSampleQtyForLine(line);
          const openFollowUp =
            entry.followUpTask && !entry.followUpTask.taskDone
              ? entry.followUpTask
              : null;

          return (
            <li
              key={line.id}
              className={cn(
                "space-y-2 rounded-xl border bg-card p-3",
                entry.returnStatus === "returned"
                  ? "border-success/35"
                  : entry.tone === "out-overdue"
                    ? "border-destructive/45"
                    : entry.tone === "out-followup"
                      ? "border-warning/45"
                      : "border-border",
              )}
            >
              {/* Top line: Product + Sample Qty + Custody Days Badge */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold">
                    {line.product}{" "}
                    <span className="font-normal text-muted-foreground">
                      (Sample: {qtyGiven} {line.unit})
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {entry.returnStatus === "returned" && entry.returnedAt ? (
                      <>
                        Given:{" "}
                        <strong className="text-foreground">
                          {formatSampleDate(entry.sentAt)}
                        </strong>{" "}
                        → Taken back:{" "}
                        <strong className="text-success">
                          {formatSampleDate(entry.returnedAt)}
                        </strong>
                      </>
                    ) : (
                      <>
                        Given:{" "}
                        <strong className="text-foreground">
                          {formatSampleDate(entry.sentAt)}
                        </strong>{" "}
                        · To: {entry.recipientLabel}
                      </>
                    )}
                  </p>
                  {entry.handoverNote && (
                    <p className="mt-0.5 break-words text-[11px] text-muted-foreground/90">
                      Note: &ldquo;{entry.handoverNote}&rdquo;
                    </p>
                  )}
                  {entry.returnNote && (
                    <p className="mt-0.5 break-words text-[11px] text-success">
                      Return note: &ldquo;{entry.returnNote}&rdquo;
                    </p>
                  )}
                </div>

                <SampleDaysBadge entry={entry} />
              </div>

              {/* Action bar: Commercial verdict + Physical custody */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                {/* 1) Commercial verdict */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Verdict:
                  </span>
                  {line.status === "approved" ? (
                    <Verdict tone="won" onClear={() => clearVerdict(line)}>
                      Approved
                    </Verdict>
                  ) : line.status === "rejected" ? (
                    <Verdict tone="lost" onClear={() => clearVerdict(line)}>
                      Lost · {line.rejectReason}
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
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setRejecting(line)}
                      >
                        <X className="size-3" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>

                {/* 2) Physical custody controls */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.returnStatus === "out" && (
                    <>
                      <Button
                        size="xs"
                        className="h-7 bg-success text-xs text-success-foreground hover:bg-success/90"
                        onClick={() => setTakeBackEntry(entry)}
                      >
                        <PackageCheck className="size-3" />
                        Mark Taken Back
                      </Button>
                      {openFollowUp ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-accent/35 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">
                          <CalendarClock className="size-3" />
                          Follow-up {formatSampleDate(openFollowUp.taskDueAt)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFollowUpEntry(entry)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-secondary/40 px-2 text-[11px] font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          title="Schedule pickup follow-up task"
                        >
                          <CalendarClock className="size-3" />
                          Follow-up
                        </button>
                      )}
                    </>
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
            </li>
          );
        })}
      </ul>

      {/* Nothing is decided for the user — the deal is only ever offered. */}
      {allDecided && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/[0.06] px-3 py-2.5">
          <p className="text-xs font-medium">All items decided</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {money(taken)} taken · {money(notTaken)} not taken
          </p>
          <div className="mt-2 flex gap-2">
            {anyApproved && (
              <Button size="sm" onClick={() => closeDeal("won")}>
                Mark won
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => closeDeal("lost")}
            >
              Mark lost
            </Button>
          </div>
        </div>
      )}

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
