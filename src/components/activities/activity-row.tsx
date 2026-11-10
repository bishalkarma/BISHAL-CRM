"use client";

import * as React from "react";
import {
  ArrowRight,
  Banknote,
  Check,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Package,
  Phone,
  Trash2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityDetailDialog } from "./activity-detail-dialog";
import { ClampedText } from "./clamped-text";
import { DeleteActivityDialog } from "./delete-activity-dialog";
import { LogActivityDialog } from "./log-activity-dialog";
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

/**
 * One journal entry.
 *
 * `compact` is used inside drawers where the customer is already known —
 * repeating it there would be noise.
 */
export function ActivityRow({
  activity,
  compact = false,
  showCompany = true,
  /**
   * Used by the filtered Timeline, which drops the date headings — each row
   * then has to carry its own date.
   */
  showDate = false,
  /** Journals inside pop-ups are read-only, so the menu is suppressed. */
  deletable = true,
}: {
  activity: Activity;
  compact?: boolean;
  showCompany?: boolean;
  showDate?: boolean;
  deletable?: boolean;
}) {
  const [viewing, setViewing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [completingTask, setCompletingTask] = React.useState(false);
  const { companies, contactById, deals } = useData();
  const def = ACTIVITY_MAP[activity.type];
  const Icon = ICONS[def.icon] ?? Phone;

  const company = companies.find((c) => c.id === activity.companyId);
  const contact = contactById(activity.contactId);
  const deal = activity.dealId
    ? deals.find((d) => d.id === activity.dealId)
    : null;

  const urgency = taskUrgency(activity);
  const urgencyLabel = taskUrgencyLabel(activity);
  /*
    Booked for a future date: real, but not history. Marked so it can never be
    mistaken for something that already happened.
  */
  const upcoming = new Date(activity.occurredAt).getTime() > Date.now();
  const shortDate = new Date(activity.occurredAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // Ignore clicks originating inside dropdown triggers/menus or text selection
        const selection =
          typeof window !== "undefined" ? window.getSelection()?.toString() : "";
        if (selection && selection.length > 0) return;
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a, [role='menuitem']")) return;
        setViewing(true);
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setViewing(true);
        }
      }}
      className={cn(
        "group/activity flex cursor-pointer gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        compact && "px-2 py-2",
        upcoming && "opacity-70",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
          def.tint,
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{def.label}</span>
          {upcoming && (
            <Badge
              variant="outline"
              className="border-chart-4/40 px-1.5 py-0 text-[10px] text-chart-4"
            >
              Upcoming
            </Badge>
          )}
          {/* No chip at all when unlinked — an ordinary activity. */}
          {deal && (
            <Badge variant="accent" className="gap-1 px-1.5 py-0 font-mono text-[10px]">
              {deal.id}
            </Badge>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            {showDate
              ? shortDate
              : compact
                ? relativeTime(activity.occurredAt)
                : `${shortDate} · ${relativeTime(activity.occurredAt)}`}
          </span>

          {deletable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Activity options"
                  onClick={(e) => e.stopPropagation()}
                  /* Hidden until the row is hovered or the button is focused,
                     so a long journal is not a wall of icons. Always visible
                     on touch, where there is no hover. */
                  className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover/activity:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onSelect={() => setViewing(true)}>
                  <Eye className="size-3.5" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setConfirming(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/*
          In a drawer the row was hard-clamped to two lines with no way to
          read the rest. Same treatment as the summary now: clamped, but
          expandable, and the full text is always present.
        */}
        <div className="mt-0.5">
          {compact ? (
            <ClampedText className="text-sm text-muted-foreground">
              {activity.report}
            </ClampedText>
          ) : (
            <p className="break-words text-sm text-muted-foreground">
              {activity.report}
            </p>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {showCompany && company && (
            <span className="truncate font-medium text-foreground/70">
              {company.name}
            </span>
          )}
          {contact && (
            <>
              {showCompany && company && <span aria-hidden>·</span>}
              <span className="truncate">
                {contact.name} · {contact.role}
              </span>
            </>
          )}
        </div>

        {/*
          The follow-up is shown as read-only context. Tasks are actioned in
          the Open tasks view, where completing one opens a new log entry.
          BUILD 18.13 also surfaces completed historical tasks subtly so past
          follow-ups are visible without opening Edit Activity.
        */}
        {activity.task && !activity.taskDone && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ArrowRight className="size-3 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{activity.task}</span>
            {urgencyLabel && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px]",
                  URGENCY_STYLES[urgency],
                )}
              >
                {urgencyLabel}
              </span>
            )}
          </div>
        )}
        {activity.task && activity.taskDone && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/75">
            <Check className="size-3 shrink-0 text-success" />
            <span className="min-w-0 flex-1 truncate">{activity.task}</span>
            <span className="shrink-0 rounded-full bg-success/12 px-1.5 py-0.5 text-[10px] text-success">
              Done
              {activity.taskDueAt
                ? ` · ${new Date(activity.taskDueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : ""}
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <Avatar className="mt-0.5 size-6 shrink-0">
          <AvatarFallback className="bg-secondary text-[9px]">
            {initials(activity.owner)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>

    <ActivityDetailDialog
      activity={viewing ? activity : null}
      open={viewing}
      onOpenChange={setViewing}
      onEdit={deletable ? () => setEditing(true) : undefined}
      onCompleteTask={
        deletable && activity.task && !activity.taskDone
          ? () => setCompletingTask(true)
          : undefined
      }
    />

    {deletable && (
      <LogActivityDialog
        open={editing}
        onOpenChange={setEditing}
        editing={editing ? activity : null}
      />
    )}

    {deletable && (
      <LogActivityDialog
        open={completingTask}
        onOpenChange={setCompletingTask}
        completing={completingTask ? activity : null}
      />
    )}

    {deletable && (
      <DeleteActivityDialog
        activity={confirming ? activity : null}
        open={confirming}
        onOpenChange={setConfirming}
      />
    )}
    </>
  );
}
