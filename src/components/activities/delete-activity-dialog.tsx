"use client";

import * as React from "react";
import { AlertTriangle, ArrowRight, ListTodo } from "lucide-react";
import { ACTIVITY_MAP, type Activity } from "@/lib/activities";
import { SPANCOP_MAP, stageAfterDelete } from "@/lib/spancop";
import { useData } from "@/components/providers/data-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirmation for removing a journal entry.
 *
 * Deliberately not a bare "are you sure". Two consequences are invisible from
 * the row itself and are spelled out here:
 *
 *  1. The entry and its follow-up task are one thread, so deleting the log
 *     removes the task with it.
 *  2. Activities feed SPANCOP. Deleting a company's only recorded contact
 *     drops it down a stage, which would otherwise happen silently.
 */
export function DeleteActivityDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { companies, deleteActivity } = useData();

  const company = activity
    ? companies.find((c) => c.id === activity.companyId)
    : undefined;

  const move = React.useMemo(() => {
    if (!activity || !company) return null;
    return stageAfterDelete(
      {
        profileComplete: Boolean(company.email && company.remarks),
        activityCount: company.activityCount,
        openDealCount: company.openDealIds.length,
        lastClosedDealOutcome: company.lastClosedDealOutcome,
        hasPurchaseOrder: company.hasPurchaseOrder,
        awaitingPayment: company.awaitingPayment,
        hasEverOrdered: company.hasEverOrdered,
      },
      company.spancop,
    );
  }, [activity, company]);

  if (!activity) return null;

  const def = ACTIVITY_MAP[activity.type];
  const when = new Date(activity.occurredAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const confirm = () => {
    deleteActivity(activity.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this activity?</DialogTitle>
          <DialogDescription>
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* The entry itself, so nobody deletes the wrong row. */}
        <div className="min-w-0 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">
            {def.label} · {when}
          </p>
          <p className="mt-0.5 break-words text-sm">{activity.report}</p>
          {company && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {company.name}
            </p>
          )}
        </div>

        {activity.task && (
          <p className="flex items-start gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
            <ListTodo className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0 break-words">
              The follow-up task on this entry will be removed too —{" "}
              <strong className="font-medium text-foreground">
                {activity.task}
              </strong>
            </span>
          </p>
        )}

        {move && company && (
          <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/[0.07] px-3 py-2 text-xs">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span className="min-w-0 break-words">
              This will move{" "}
              <strong className="font-medium">{company.name}</strong> from{" "}
              <strong className="font-medium">
                {SPANCOP_MAP[move.from].label}
              </strong>{" "}
              <ArrowRight className="inline size-3" />{" "}
              <strong className="font-medium">
                {SPANCOP_MAP[move.to].label}
              </strong>
              .
            </span>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
