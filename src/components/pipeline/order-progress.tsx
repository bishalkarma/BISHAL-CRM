"use client";

import * as React from "react";
import {
  Banknote,
  Check,
  FileText,
  RotateCcw,
  Truck,
} from "lucide-react";
import type { Deal } from "@/lib/deals";
import {
  FULFILMENT_STEPS,
  amountOwed,
  creditBalance,
  daysSinceDelivery,
  ageingTone,
  nextFulfilmentAction,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The order chain on a won deal: PO, delivery, payment.
 *
 * Only one action is offered at a time, so a payment can never be recorded
 * against goods that have not shipped. Dates are stamped, never typed — a
 * typed date can be mistyped, a stamp cannot.
 */
export function OrderProgress({ deal }: { deal: Deal }) {
  const { recordPurchaseOrder, recordDelivery, recordPayment, undoFulfilmentStep } =
    useData();
  const { toDisplay, format } = useCurrency();

  const [open, setOpen] = React.useState<"po" | "delivery" | "payment" | null>(
    null,
  );

  const f = deal.fulfilment;
  const next = nextFulfilmentAction(f);
  const money = (v: number) => format(toDisplay(v, deal.currency));

  const owed = amountOwed(deal.value, f);
  const credit = creditBalance(deal.value, f);
  const days = daysSinceDelivery(f);
  const tone = ageingTone(days);

  // Which tracker circles are filled.
  const done = {
    won: true,
    po: Boolean(f.poNumber),
    delivered: Boolean(f.deliveredAt),
    paid: Boolean(f.paidAt),
  } as const;

  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Order progress
      </div>

      {/* Tracker */}
      <div className="mt-3 flex items-center">
        {FULFILMENT_STEPS.map((step, i) => {
          const filled = done[step.id];
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    filled ? "bg-success" : "bg-border",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                    filled
                      ? "border-success bg-success text-success-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {filled ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* What has been recorded, each with its own undo */}
      <div className="mt-3 space-y-1">
        {f.poNumber && (
          <RecordedRow
            text={`${f.poNumber}${f.poDate ? ` · ${shortDate(f.poDate)}` : ""}`}
            onUndo={() => undoFulfilmentStep(deal.id, "po")}
          />
        )}
        {f.deliveredAt && (
          <RecordedRow
            text={`Delivered ${shortDate(f.deliveredAt)} · ${
              f.partialDelivery ? "partial" : "full"
            }${f.deliveryNote ? ` — ${f.deliveryNote}` : ""}`}
            onUndo={() => undoFulfilmentStep(deal.id, "delivery")}
          />
        )}
        {f.amountReceived > 0 && (
          <RecordedRow
            text={`Received ${money(f.amountReceived)} of ${money(deal.value)}`}
            onUndo={() => undoFulfilmentStep(deal.id, "payment")}
          />
        )}
      </div>

      {/* Balance */}
      {f.deliveredAt && owed > 0 && (
        <div
          className={cn(
            "mt-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
            tone === "risk"
              ? "bg-destructive/12 text-destructive"
              : tone === "chase"
                ? "bg-warning/15 text-warning"
                : "bg-secondary text-muted-foreground",
          )}
        >
          Balance {money(owed)}
          {days !== null && ` · ${days} days`}
        </div>
      )}

      {credit > 0 && (
        <div className="mt-2.5 rounded-lg bg-success/12 px-2.5 py-1.5 text-xs font-medium text-success">
          Credit {money(credit)} — carried to the next order
        </div>
      )}

      {/* One button at a time */}
      {next === "po" && (
        <Button className="mt-3 w-full" size="sm" onClick={() => setOpen("po")}>
          <FileText />
          Record PO
        </Button>
      )}
      {next === "delivery" && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={() => setOpen("delivery")}
        >
          <Truck />
          Record delivery
        </Button>
      )}
      {next === "payment" && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={() => setOpen("payment")}
        >
          <Banknote />
          Record payment
        </Button>
      )}
      {next === null && (
        <p className="mt-3 text-center text-xs text-success">
          Settled in full — customer returned to Approach.
        </p>
      )}

      <PoDialog
        open={open === "po"}
        onOpenChange={(v) => !v && setOpen(null)}
        deal={deal}
        onSave={(po) => recordPurchaseOrder(deal.id, po)}
      />
      <DeliveryDialog
        open={open === "delivery"}
        onOpenChange={(v) => !v && setOpen(null)}
        deal={deal}
        onSave={(partial, note) => recordDelivery(deal.id, partial, note)}
      />
      <PaymentDialog
        open={open === "payment"}
        onOpenChange={(v) => !v && setOpen(null)}
        deal={deal}
        owed={owed}
        money={money}
        onSave={(amount) => recordPayment(deal.id, amount)}
      />
    </div>
  );
}

function RecordedRow({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2 text-[11px] text-muted-foreground">
      <span className="min-w-0 break-words">{text}</span>
      <button
        type="button"
        onClick={onUndo}
        title="Undo this step"
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <RotateCcw className="size-3" />
      </button>
    </div>
  );
}

const STAMP = "Date stamped automatically";

function PoDialog({
  open,
  onOpenChange,
  deal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal: Deal;
  onSave: (poNumber: string) => void;
}) {
  const [po, setPo] = React.useState("");
  React.useEffect(() => {
    if (open) setPo("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record purchase order</DialogTitle>
          <DialogDescription className="break-words">
            {deal.title}
          </DialogDescription>
        </DialogHeader>
        <label className="block text-xs font-medium">
          PO number
          <Input
            autoFocus
            value={po}
            onChange={(e) => setPo(e.target.value)}
            placeholder="PO-2026-0184"
            className="mt-1"
          />
        </label>
        <p className="text-[11px] text-muted-foreground">{STAMP}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!po.trim()}
            onClick={() => {
              onSave(po.trim());
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryDialog({
  open,
  onOpenChange,
  deal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal: Deal;
  onSave: (partial: boolean, note: string | null) => void;
}) {
  const [partial, setPartial] = React.useState(false);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setPartial(false);
      setNote("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record delivery</DialogTitle>
          <DialogDescription className="break-words">
            {deal.title}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <ChoiceTile
            selected={!partial}
            onClick={() => setPartial(false)}
            icon={<Truck className="size-4" />}
            title="Full delivery"
            hint="everything shipped"
          />
          <ChoiceTile
            selected={partial}
            onClick={() => setPartial(true)}
            icon={<Truck className="size-4" />}
            title="Partial delivery"
            hint="some items still to come"
          />
        </div>

        {/* Only asked for when it is actually needed. */}
        {partial && (
          <label className="block text-xs font-medium">
            What is still pending
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="2 of 3 chillers"
              className="mt-1"
            />
          </label>
        )}

        <p className="text-[11px] text-muted-foreground">{STAMP}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(partial, note.trim() || null);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  deal,
  owed,
  money,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deal: Deal;
  owed: number;
  money: (v: number) => string;
  onSave: (amount: number) => void;
}) {
  const [part, setPart] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setPart(false);
      setAmount("");
    }
  }, [open]);

  const typed = Number(amount) || 0;
  const value = part ? typed : owed;
  const after = owed - value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription className="break-words">
            Invoice {money(deal.value)} · outstanding {money(owed)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <ChoiceTile
            selected={!part}
            onClick={() => setPart(false)}
            icon={<Banknote className="size-4" />}
            title="Full payment"
            hint="settles the balance"
          />
          <ChoiceTile
            selected={part}
            onClick={() => setPart(true)}
            icon={<Banknote className="size-4" />}
            title="Part payment"
            hint="advance or instalment"
          />
        </div>

        {part && (
          <label className="block text-xs font-medium">
            Amount received
            <Input
              autoFocus
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
            {/* Over-payment is allowed: the excess becomes a credit against
                the customer's next order rather than being rejected. */}
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {after > 0
                ? `Balance after this: ${money(after)}`
                : after === 0
                  ? "Settles the balance in full"
                  : `Credit of ${money(-after)} carried forward`}
            </span>
          </label>
        )}

        <p className="text-[11px] text-muted-foreground">{STAMP}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={part && typed <= 0}
            onClick={() => {
              onSave(value);
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceTile({
  selected,
  onClick,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-accent bg-accent/[0.06]"
          : "border-border hover:bg-secondary/60",
      )}
    >
      <span className={cn("block", selected ? "text-accent" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="mt-1 block text-sm font-medium">{title}</span>
      <span className="block text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}
