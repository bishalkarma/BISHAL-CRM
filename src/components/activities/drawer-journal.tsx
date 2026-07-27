"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import {
  hasHappened,
  isUpcoming,
  countThreads,
} from "@/lib/activity-narrative";
import { sortByRecent, type Activity } from "@/lib/activities";
import { ActivityRow } from "./activity-row";
import { CustomerSummary } from "./customer-summary";
import { LogActivityDialog } from "./log-activity-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Newest three stay visible; older entries fold away. */
const VISIBLE = 3;

/**
 * The journal as it appears inside a drawer or pop-up.
 *
 * One component, two scopes:
 *   company — every activity for the customer, full summary with risk flag
 *   deal    — only activities linked to that deal, summary built from those
 *             same records so it never refers to anything unlinked
 *
 * Upcoming entries sit inline at the top with a badge rather than in their own
 * collapsible block. Inside a panel there is usually one, and a whole section
 * for a single row costs an extra tap for nothing.
 */
export function DrawerJournal({
  activities,
  scope,
  companyId,
  dealId,
  title,
}: {
  activities: Activity[];
  scope: "company" | "deal";
  /** Pre-fills the log form, so the customer is never retyped. */
  companyId: string;
  /** Deal scope also pre-fills the deal. */
  dealId?: string;
  title?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [logOpen, setLogOpen] = React.useState(false);
  const now = Date.now();

  const { upcoming, history } = React.useMemo(() => {
    const sorted = sortByRecent(activities);
    return {
      // Soonest first: the next thing to prepare for leads.
      upcoming: sorted.filter((a) => isUpcoming(a, now)).reverse(),
      history: sorted.filter((a) => hasHappened(a, now)),
    };
  }, [activities, now]);

  const counts = countThreads(activities, now);
  const hidden = Math.max(history.length - VISIBLE, 0);
  const visible = expanded ? history : history.slice(0, VISIBLE);

  const heading =
    title ?? (scope === "deal" ? "Activity on this deal" : "Activity");

  return (
    <div>
      <div className="flex items-center gap-2 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {heading}
          {counts.logged > 0 && ` · ${counts.logged}`}
        </span>
        <Button
          size="xs"
          variant="outline"
          className="ml-auto"
          onClick={() => setLogOpen(true)}
        >
          <Plus />
          Log activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          {scope === "deal"
            ? "Nothing logged against this deal yet."
            : "No activity logged yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {/*
            Summary is built from whatever list it is given, so the deal scope
            can never mention an activity that is not linked to the deal.
          */}
          <CustomerSummary
            activities={activities}
            defaultOpen={false}
            label={scope === "deal" ? "Deal summary" : "Summary"}
          />

          <div className="divide-y divide-border/60">
            {upcoming.map((a) => (
              <ActivityRow key={a.id} activity={a} compact showCompany={false} />
            ))}

            <AnimatePresence initial={false}>
              {visible.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.15) }}
                >
                  <ActivityRow activity={a} compact showCompany={false} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-accent transition-colors hover:bg-secondary/60"
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
        </div>
      )}

      <LogActivityDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        presetCompanyId={companyId}
        presetDealId={dealId}
      />
    </div>
  );
}
