"use client";

import {
  ArrowRight,
  Banknote,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
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
import { ClampedText } from "./clamped-text";
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
}: {
  activity: Activity;
  compact?: boolean;
  showCompany?: boolean;
  showDate?: boolean;
}) {
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

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50",
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
              ? new Date(activity.occurredAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : relativeTime(activity.occurredAt)}
          </span>
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
      </div>

      {!compact && (
        <Avatar className="mt-0.5 size-6 shrink-0">
          <AvatarFallback className="bg-secondary text-[9px]">
            {initials(activity.owner)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
