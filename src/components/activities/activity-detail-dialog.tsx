"use client";

import * as React from "react";
import {
  Banknote,
  Building2,
  Calendar,
  Check,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Target,
  User,
  Users,
} from "lucide-react";
import {
  ACTIVITY_MAP,
  URGENCY_STYLES,
  taskUrgency,
  taskUrgencyLabel,
  type Activity,
} from "@/lib/activities";
import { useData } from "@/components/providers/data-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials, relativeTime } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  MessageSquare,
  MessageCircle,
  Banknote,
};

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Read-only Activity Details popup card (BUILD 18.13).
 *
 * Lets users inspect historical or current customer activities — full report,
 * exact calendar date, customer/contact/deal context, and "What happens next"
 * task (whether still open or already completed) — with one click/tap, without
 * having to open the Edit Activity form or losing scroll position when closing.
 */
export function ActivityDetailDialog({
  activity,
  open,
  onOpenChange,
  onEdit,
  onCompleteTask,
}: {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onCompleteTask?: () => void;
}) {
  const { companies, contactById, deals } = useData();

  if (!activity) return null;

  const def = ACTIVITY_MAP[activity.type];
  const Icon = ICONS[def.icon] ?? Phone;
  const company = companies.find((c) => c.id === activity.companyId) ?? null;
  const contact = contactById(activity.contactId);
  const deal = activity.dealId
    ? deals.find((d) => d.id === activity.dealId) ?? null
    : null;

  const upcoming = new Date(activity.occurredAt).getTime() > Date.now();
  const urgency = taskUrgency(activity);
  const urgencyLabel = taskUrgencyLabel(activity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[86dvh] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
                def.tint,
              )}
            >
              <Icon className="size-3.5" />
              {def.label}
            </span>
            {upcoming && (
              <Badge
                variant="outline"
                className="border-chart-4/40 px-2 py-0.5 text-[10px] text-chart-4"
              >
                Upcoming
              </Badge>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {formatFullDate(activity.occurredAt)} ·{" "}
              {relativeTime(activity.occurredAt)}
            </span>
          </div>
          <DialogTitle className="mt-2 text-base font-semibold leading-snug">
            {company ? company.name : "Activity details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {company
              ? `${company.area}, ${company.emirate} · ${company.category}`
              : "Recorded interaction details"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
          {/* Context grid: Contact, Linked deal, Logged by */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                <User className="size-3" />
                Contact person
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-foreground">
                {contact ? contact.name : "Not specified"}
              </div>
              {contact?.role && (
                <div className="truncate text-[11px] text-muted-foreground">
                  {contact.role}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                <Target className="size-3" />
                Linked deal
              </div>
              {deal ? (
                <>
                  <div className="mt-1 truncate font-mono text-xs font-semibold text-accent">
                    {deal.id}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {deal.title}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">
                  General customer activity
                </div>
              )}
            </div>
          </div>

          {/* Full Report */}
          <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {def.reportLabel}
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {activity.report}
            </p>
          </div>

          {/* What happens next (shown for BOTH open and completed historical tasks) */}
          {activity.task && (
            <div
              className={cn(
                "rounded-xl border p-3.5",
                activity.taskDone
                  ? "border-success/30 bg-success/[0.05]"
                  : "border-accent/35 bg-accent/[0.05]",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  What happens next
                </span>
                {activity.taskDone ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                    <Check className="size-3" />
                    Completed
                  </span>
                ) : (
                  urgencyLabel && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        URGENCY_STYLES[urgency],
                      )}
                    >
                      {urgencyLabel}
                    </span>
                  )
                )}
              </div>

              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-snug text-foreground">
                {activity.task}
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Due date:{" "}
                  <strong className="font-medium text-foreground/90">
                    {activity.taskDueAt
                      ? formatFullDate(activity.taskDueAt)
                      : "No due date"}
                  </strong>
                </span>
                {!activity.taskDone && onCompleteTask && (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    className="h-7 border-success/40 bg-success/10 text-success hover:bg-success/20"
                    onClick={() => {
                      onOpenChange(false);
                      onCompleteTask();
                    }}
                  >
                    <Check className="size-3" />
                    Mark done
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Logged by footer strip */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/15 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Logged by
            </span>
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Avatar className="size-5">
                <AvatarFallback className="bg-secondary text-[9px]">
                  {initials(activity.owner)}
                </AvatarFallback>
              </Avatar>
              {activity.owner}
            </span>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-border px-5 py-3 sm:justify-between">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
            >
              <Pencil className="size-3.5" />
              Edit activity
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
