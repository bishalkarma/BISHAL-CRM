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
}: {
  activity: Activity;
  compact?: boolean;
  showCompany?: boolean;
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

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/50",
        compact && "px-2 py-2",
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
          {/* No chip at all when unlinked — an ordinary activity. */}
          {deal && (
            <Badge variant="accent" className="gap-1 px-1.5 py-0 font-mono text-[10px]">
              {deal.id}
            </Badge>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
            {relativeTime(activity.occurredAt)}
          </span>
        </div>

        <p
          className={cn(
            "mt-0.5 text-sm text-muted-foreground",
            compact ? "line-clamp-2" : "",
          )}
        >
          {activity.report}
        </p>

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
