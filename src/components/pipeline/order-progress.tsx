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
  balanceOutstanding,
  daysSinceDelivery,
  fulfilmentStage,
  ageingTone,

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
 * What has happened to a won deal since it was won.
 *
 * Shown only on won deals, at the top of the deal pop-up. Exactly one action
 * is offered at a time, so an order can never be marked paid before it has
 * shipped. Every date is stamped by the app — nothing is typed but the PO
 * number and, on a part payment, the amount.
 */
export function OrderProgress({ deal }: { deal: Deal }) {
  const { recordFulfilment } = useData();
  const { toDisplay, format } = useCurrency();
  const [open, setOpen] = React.useState<
    "po" | "delivery" | "payment" | null
  >(null);

  if (deal.stage !== "won") return null;

  const f = deal.fulfilment;
  const step = fulfilmentStage(f);
  const value = toDisplay(deal.value, deal.currency);
  const received = toDisplay(f.amountReceived, deal.currency);
  const balance = balanceOutstanding(value, f);
  const credit = received > value ? received - value : 0;
  const days = daysSinceDelivery(f);
  const tone = ageingTone(days);

  const reached: Record<string, boolean> = {
    won: true,
    po: Boolean(f.poNumber),
    delivered: Boolean(f.deliveredAt),
    paid: Boolean(f.paidAt),
  };

  const money = (v: number) => format(v, { compact: true });
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  /* Undo clears this step and everything after it — leaving a delivery on a
     deal whose PO was removed would be a state the rules cannot describe. */
  const undo = (from: "po" | "delivered" | "paid") => {
    if (from === "po") {
      recordFulfilment(deal.id, {
        poNumber: null,
        poDate: null,
        deliveredAt: null,
        partialDelivery: false,
        deliveryNote: null,
        paidAt: null,
        amountReceived: 0,
      });
    } else if (from === "delivered") {
      recordFulfilment(deal.id, {
        deliveredAt: null,
        partialDelivery: false,
        deliveryNote: null,
        paidAt: null,
        amountReceived: 0,
      });
    } else {
      recordFulfilment(deal.id, { paidAt: null, amountReceived: 0 });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Order progress
      </div>

      {/* Tracker */}
      <div className="mt-3 flex items-center">
        {FULFILMENT_STEPS.map((s, i) => {
          const done = reached[s.id];
          const partial = s.id === "paid" && !done && received > 0;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 text-[10px]",
                    done
                      ? "border-success bg-success text-success-foreground"
                      : partial
                        ? "border-accent bg-accent/25"
                        : "border-border bg-card",
                  )}
                >
                  {done && <Check className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    done ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* What has been recorded, each with its own undo */}
      <div className="mt-3 space-y-1">
        {f.poNumber && (
          <RecordedLine
            text={`${f.poNumber}${f.poDate ? ` · ${shortDate(f.poDate)}` : ""}`}
            onUndo={() => undo("po")}
          />
        )}
        {f.deliveredAt && (
          <RecordedLine
            text={`Delivered ${shortDate(f.deliveredAt)} · ${
              f.partialDelivery ? "partial" : "full"
            }${f.deliveryNote ? ` — ${f.deliveryNote}` : ""}`}
            onUndo={() => undo("delivered")}
          />
        )}
        {received > 0 && (
          <RecordedLine
            text={`Received ${money(received)} of ${money(value)}`}
            onUndo={() => undo("paid")}
          />
        )}
      </div>

      {received > 0 && !f.paidAt && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(100, (received / value) * 100)}%` }}
          />
        </div>
      )}

      {/* One action at a time */}
      <div className="mt-3">
        {step === "won" && (
          <Button size="sm" className="w-full" onClick={() => setOpen("po")}>
            <FileText />
            Record PO
          </Button>
        )}
        {step === "po" && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => setOpen("delivery")}
          >
            <Truck />
            Record delivery
          </Button>
        )}
        {step === "delivered" && (
          <div className="space-y-2">
            {f.partialDelivery && (
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setOpen("delivery")}
              >
                <Truck />
                Record delivery
              </Button>
            )}
            <Button
              size="sm"
              className="w-full"
              onClick={() => setOpen("payment")}
            >
              <Banknote />
              Record payment
            </Button>
          </div>
        )}
        {step === "paid" && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-center text-xs font-medium text-success">
            Settled in full
            {f.paidAt && ` · ${shortDate(f.paidAt)}`}
          </p>
        )}
      </div>

      {/* The number that matters */}
      {balance > 0 && (
        <p
          className={cn(
            "mt-2 rounded-lg px-3 py-1.5 text-center text-xs font-medium",
            tone === "risk"
              ? "bg-destructive/12 text-destructive"
              : tone === "chase"
                ? "bg-warning/15 text-warning"
                : "bg-secondary text-muted-foreground",
          )}
        >
          Balance {money(balance)}
          {days !== null && ` · ${days} days`}
        </p>
      )}
      {credit > 0 && (
        <p className="mt-2 rounded-lg bg-accent/10 px-3 py-1.5 text-center text-xs font-medium text-accent">
          Credit {money(credit)} — carried to the next order
        </p>
      )}

      <PoDialog
        open={open === "po"}
        onOpenChange={(v) => !v && setOpen(null)}
        deal={deal}
        onSave={(poNumber) => {
          recordFulfilment(deal.id, {
            poNumber,
            poDate: new Date().toISOString(),
          });
          setOpen(null);
        }}
      />
      <DeliveryDialog
        open={open === "delivery"}
        onOpenChange={(v) => !v && setOpen(null)}
        deal={deal}
        onSave={(partial, note) => {
          recordFulfilment(deal.id, {
            deliveredAt: new Date().toISOString(),
            partialDelivery: partial,
            deliveryNote: note || null,
          });
          setOpen(null);
        }}
      />
      <PaymentDialog
        open={open === "payment"}
        onOpenChange={(v) => !v && setOpen(null)}
        invoice={value}
        received={received}
        format={money}
        onSave={(amount) => {
          const total = f.amountReceived + amount;
          // Reaching or passing the invoice settles it, however it was
          // entered — a "part" payment for the exact balance is paid in full.
          const settled = toDisplay(total, deal.currency) >= value;
          recordFulfilment(deal.id, {
            amountReceived: total,
            paidAt: settled ? new Date().toISOString() : null,
          });
          setOpen(null);
        }}
      />
    </div>
  );
}

function RecordedLine({
  text,
  onUndo,
}: {
  text: string;
  onUndo: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="min-w-0 flex-1 break-words">{text}</span>
      <button
        type="button"
        onClick={onUndo}
        title="Undo this step and everything after it"
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <RotateCcw className="size-3" />
      </button>
    </div>
  );
}

function PoDialog({
  open,
  onOpenChange,
  deal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  onSave: (poNumber: string) => void;
}) {
  const [po, setPo] = React.useState("");
  React.useEffect(() => {
    if (open) setPo("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
        <p className="text-[11px] text-muted-foreground">
          Date stamped automatically.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!po.trim()} onClick={() => onSave(po.trim())}>
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
  onOpenChange: (open: boolean) => void;
  deal: Deal;
  onSave: (partial: boolean, note: string) => void;
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
            icon={Truck}
            label="Full delivery"
            hint="everything shipped"
            selected={!partial}
            onSelect={() => setPartial(false)}
          />
          <ChoiceTile
            icon={FileText}
            label="Partial delivery"
            hint="some items still to come"
            selected={partial}
            onSelect={() => setPartial(true)}
          />
        </div>

        {partial && (
          <label className="block text-xs font-medium">
            What is still pending
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="mt-1"
            />
          </label>
        )}

        <p className="text-[11px] text-muted-foreground">
          Date stamped automatically.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(partial, note.trim())}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  received,
  format,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: number;
  received: number;
  format: (v: number) => string;
  onSave: (amount: number) => void;
}) {
  const [part, setPart] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const outstanding = Math.max(0, invoice - received);

  React.useEffect(() => {
    if (open) {
      setPart(false);
      setAmount("");
    }
  }, [open]);

  const typed = Number(amount) || 0;
  // Over-payment is allowed on purpose: an advance that overshoots becomes
  // credit against the customer's next order rather than an error.
  const after = received + (part ? typed : outstanding);
  const credit = after > invoice ? after - invoice : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Invoice {format(invoice)} · received {format(received)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <ChoiceTile
            icon={Banknote}
            label="Full payment"
            hint="settles the balance"
            selected={!part}
            onSelect={() => setPart(false)}
          />
          <ChoiceTile
            icon={Banknote}
            label="Part payment"
            hint="advance or instalment"
            selected={part}
            onSelect={() => setPart(true)}
          />
        </div>

        {part && (
          <label className="block text-xs font-medium">
            Amount received
            <Input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(Math.round(outstanding))}
              className="mt-1"
            />
          </label>
        )}

        <p className="text-[11px] text-muted-foreground">
          {credit > 0
            ? `Credit after this: ${format(credit)} — carried to the next order.`
            : `Balance after this: ${format(Math.max(0, invoice - after))}`}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Date stamped automatically.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={part && typed <= 0}
            onClick={() => onSave(part ? typed : outstanding)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceTile({
  icon: Icon,
  label,
  hint,
  selected,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-accent bg-accent/[0.07]"
          : "border-border hover:border-accent/40",
      )}
    >
      <Icon className={cn("size-4", selected ? "text-accent" : "text-muted-foreground")} />
      <div className="mt-1 text-xs font-medium">{label}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </button>
  );
}
