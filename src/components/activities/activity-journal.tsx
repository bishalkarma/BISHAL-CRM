"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Clock } from "lucide-react";
import {
  ACTIVITY_MAP,
  URGENCY_STYLES,
  sortByRecent,
  summarise,
  taskUrgency,
  taskUrgencyLabel,
  type Activity,
} from "@/lib/activities";
import { ActivityRow } from "./activity-row";
import { cn, relativeTime } from "@/lib/utils";

/** Newest three stay visible; anything older folds away. */
const VISIBLE = 3;

/**
 * The journal, used on both the company and deal drawers.
 * Shows the derived summary first — latest activity plus oldest open task —
 * so the current state is readable without expanding anything.
 */
export function ActivityJournal({
  activities,
  showCompany = false,
  emptyLabel = "No activity logged yet.",
}: {
  activities: Activity[];
  showCompany?: boolean;
  emptyLabel?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const sorted = React.useMemo(() => sortByRecent(activities), [activities]);
  const summary = React.useMemo(() => summarise(activities), [activities]);

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const hidden = Math.max(sorted.length - VISIBLE, 0);
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE);

  return (
    <div className="space-y-2">
      {/* Derived summary — never typed, so it cannot go stale */}
      {(summary.last || summary.next) && (
        <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-2.5 text-xs">
          {summary.last && (
            <div className="flex gap-2">
              <span className="w-9 shrink-0 font-semibold">Last:</span>
              <span className="min-w-0 flex-1 text-muted-foreground">
                {ACTIVITY_MAP[summary.last.type].label} ·{" "}
                {relativeTime(summary.last.occurredAt)} —{" "}
                <span className="text-foreground/80">
                  {summary.last.report}
                </span>
              </span>
            </div>
          )}
          {summary.next && (
            <div className="mt-1 flex items-center gap-2">
              <span className="w-9 shrink-0 font-semibold">Next:</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {summary.next.task}
              </span>
              {taskUrgencyLabel(summary.next) && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px]",
                    URGENCY_STYLES[taskUrgency(summary.next)],
                  )}
                >
                  {taskUrgencyLabel(summary.next)}
                </span>
              )}
            </div>
          )}
          {!summary.next && (
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <span className="w-9 shrink-0 font-semibold text-foreground">
                Next:
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Nothing scheduled
              </span>
            </div>
          )}
        </div>
      )}

      {/* Older entries collapse — newest three are always on screen */}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-secondary/60"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200",
              expanded && "rotate-90",
            )}
          />
          {expanded
            ? "Hide earlier entries"
            : `Show ${hidden} earlier ${hidden === 1 ? "entry" : "entries"}`}
        </button>
      )}

      <div className="divide-y divide-border/60">
        <AnimatePresence initial={false}>
          {visible.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                delay: Math.min(index * 0.03, 0.15),
              }}
            >
              <ActivityRow
                activity={activity}
                compact
                showCompany={showCompany}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
