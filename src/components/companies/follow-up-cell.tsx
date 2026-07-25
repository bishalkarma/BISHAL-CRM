"use client";

import { CalendarClock, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders a next-follow-up date as an actionable, colour-coded chip.
 * This is the alternative to the manual Hot/Warm/Cold lead status.
 */
export function FollowUpCell({
  date,
  compact = false,
}: {
  date: string | null;
  compact?: boolean;
}) {
  if (!date) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-0.5 text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
        )}
      >
        <CalendarPlus className="size-3" />
        Not scheduled
      </span>
    );
  }

  const target = new Date(date);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);

  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  );

  let label: string;
  let tone: "overdue" | "today" | "soon" | "later";

  if (dayDiff < 0) {
    label = dayDiff === -1 ? "Overdue 1 day" : `Overdue ${Math.abs(dayDiff)} days`;
    tone = "overdue";
  } else if (dayDiff === 0) {
    label = "Today";
    tone = "today";
  } else if (dayDiff === 1) {
    label = "Tomorrow";
    tone = "soon";
  } else if (dayDiff <= 7) {
    label = `In ${dayDiff} days`;
    tone = "soon";
  } else {
    label = target.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    tone = "later";
  }

  const TONES: Record<typeof tone, string> = {
    overdue: "bg-destructive/12 text-destructive font-semibold",
    today: "bg-warning/15 text-warning font-semibold",
    soon: "bg-accent/12 text-accent",
    later: "bg-secondary text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        compact ? "text-[10px]" : "text-xs",
        TONES[tone],
      )}
    >
      <CalendarClock className="size-3 shrink-0" />
      {label}
    </span>
  );
}
