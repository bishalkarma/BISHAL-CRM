"use client";

import * as React from "react";
import { Beaker, Check, RotateCcw, X } from "lucide-react";
import type { Deal } from "@/lib/deals";
import {
  LOST_REASONS,
  lineTotal,
  rejectedValue,
  dealValue,
  ageingTone,
  type LineItem,
  type LostReason,
} from "@/lib/deal-model";
import { useData } from "@/components/providers/data-provider";
import { useCurrency } from "@/components/providers/currency-provider";
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
 * Samples, recorded per line item.
 *
 * Only rendered while a deal sits in Sampling — in any other stage the
 * question does not arise. Recording is optional: a deal where nothing is
 * ticked behaves exactly as it always has, and the whole value counts.
 *
 * Approving a line keeps its money in the deal; rejecting it moves that money
 * to "Why we lose" under a reason. Once no line is undecided the panel offers
 * to close the deal — it never closes one on its own.
 */
export function SampleTracker({ deal }: { deal: Deal }) {
  const { updateDeal } = useData();
  const { toDisplay, format } = useCurrency();
  const [dismissed, setDismissed] = React.useState(false);
  const [rejecting, setRejecting] = React.useState<LineItem | null>(null);

  if (deal.stage !== "sampling") return null;

  const money = (v: number) => format(v, { compact: true });
  const lineMoney = (l: LineItem) =>
    money(toDisplay(lineTotal(l), deal.currency));

  const patchLine = (id: string, patch: Partial<LineItem>) =>
    updateDeal(deal.id, {
      lines: deal.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });

  const markSent = (l: LineItem) =>
    patchLine(l.id, {
      sample: {
        sentAt: new Date().toISOString(),
        feedbackAt: null,
        feedback: null,
      },
    });

  const undoSent = (l: LineItem) =>
    patchLine(l.id, { sample: null, status: "quoted", rejectReason: undefined });

  const approve = (l: LineItem) =>
    patchLine(l.id, {
      status: "approved",
      rejectReason: undefined,
      sample: l.sample
        ? { ...l.sample, feedbackAt: new Date().toISOString() }
        : null,
    });

  const reject = (l: LineItem, reason: LostReason) =>
    patchLine(l.id, {
      status: "rejected",
      rejectReason: reason,
      sample: l.sample
        ? { ...l.sample, feedbackAt: new Date().toISOString() }
        : null,
    });

  const clearVerdict = (l: LineItem) =>
    patchLine(l.id, {
      status: "quoted",
      rejectReason: undefined,
      sample: l.sample ? { ...l.sample, feedbackAt: null } : null,
    });

  const sentCount = deal.lines.filter((l) => l.sample).length;
  const decided = deal.lines.filter((l) => l.status !== "quoted");
  const allDecided = deal.lines.length > 0 && decided.length === deal.lines.length;
  const anyApproved = deal.lines.some((l) => l.status === "approved");

  const taken = toDisplay(dealValue(deal.lines), deal.currency);
  const notTaken = toDisplay(rejectedValue(deal.lines), deal.currency);

  const closeDeal = (stage: "won" | "lost") =>
    updateDeal(deal.id, {
      stage,
      closedFromStage: "sampling",
      lastActivityAt: new Date().toISOString(),
    });

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Samples
        </span>
        {sentCount > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {sentCount} of {deal.lines.length} sent
          </span>
        )}
      </div>

      {/* Asked once, never nagged. Dismissing it leaves the buttons in place. */}
      {sentCount === 0 && !dismissed && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/[0.07] px-3 py-2">
          <Beaker className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Send a sample?</p>
            <p className="text-[11px] text-muted-foreground">
              Optional — record only the items you actually sent.
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

      <ul className="mt-2 space-y-1.5">
        {deal.lines.map((line) => {
          const s = line.sample;
          const days = s
            ? Math.floor(
                (Date.now() - new Date(s.sentAt).getTime()) / 86_400_000,
              )
            : null;
          /* Shorter thresholds than the payment clock: a sample sitting for a
             month has effectively been forgotten. */
          const tone =
            days === null ? "fresh" : ageingTone(days < 14 ? 0 : days < 31 ? 45 : 90);

          return (
            <li
              key={line.id}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-card px-2.5 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.product}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {line.brand} · {lineMoney(line)}
                </p>
              </div>

              {line.status === "approved" ? (
                <Verdict tone="won" onClear={() => clearVerdict(line)}>
                  Won
                </Verdict>
              ) : line.status === "rejected" ? (
                <Verdict tone="lost" onClear={() => clearVerdict(line)}>
                  Lost · {line.rejectReason}
                </Verdict>
              ) : s ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                      tone === "risk"
                        ? "bg-destructive/12 text-destructive"
                        : tone === "chase"
                          ? "bg-warning/15 text-warning"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {days}d
                  </span>
                  <Button size="sm" variant="outline" onClick={() => approve(line)}>
                    <Check />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejecting(line)}>
                    <X />
                    Reject
                  </Button>
                  <button
                    type="button"
                    onClick={() => undoSent(line)}
                    title="Undo — this line was not sampled"
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => markSent(line)}>
                    <Beaker />
                    Sample sent
                  </Button>
                  {/* A line can be decided without ever being sampled. */}
                  <Button size="sm" variant="ghost" onClick={() => approve(line)}>
                    <Check />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejecting(line)}>
                    <X />
                  </Button>
                </div>
              )}
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
