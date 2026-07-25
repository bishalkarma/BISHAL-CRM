"use client";

import * as React from "react";
import { XCircle } from "lucide-react";
import { LOST_REASONS, type LostReason } from "@/lib/deal-model";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A deal cannot enter Lost without a reason — "Mark as lost" stays disabled
 * until one is chosen. Also used to edit the reason afterwards.
 */
export function LostReasonDialog({
  open,
  onOpenChange,
  dealTitle,
  initialReason,
  initialNote,
  isEdit,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealTitle: string;
  initialReason?: LostReason;
  initialNote?: string;
  isEdit?: boolean;
  onConfirm: (reason: LostReason, note: string) => void;
  onCancel?: () => void;
}) {
  const [reason, setReason] = React.useState<LostReason | null>(
    initialReason ?? null,
  );
  const [note, setNote] = React.useState(initialNote ?? "");

  React.useEffect(() => {
    if (open) {
      setReason(initialReason ?? null);
      setNote(initialNote ?? "");
    }
  }, [open, initialReason, initialNote]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel?.();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="size-4 text-destructive" />
            {isEdit ? "Edit lost reason" : "Why was this deal lost?"}
          </DialogTitle>
          <DialogDescription className="truncate">{dealTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {LOST_REASONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setReason(option)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                reason === option
                  ? "border-destructive bg-destructive/[0.07] font-medium text-destructive"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  reason === option
                    ? "border-destructive"
                    : "border-muted-foreground/40",
                )}
              >
                {reason === option && (
                  <span className="size-1.5 rounded-full bg-destructive" />
                )}
              </span>
              {option}
            </button>
          ))}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason}
            onClick={() => reason && onConfirm(reason, note)}
          >
            {isEdit ? "Save reason" : "Mark as lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
