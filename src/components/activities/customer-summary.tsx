"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import {
  MOMENTUM_STYLES,
  SIGNAL_STYLES,
} from "@/lib/activity-summary";
import { narrateCustomer } from "@/lib/activity-narrative";
import { URGENCY_STYLES, taskUrgency, taskUrgencyLabel } from "@/lib/activities";
import type { Activity } from "@/lib/activities";
import { useData } from "@/components/providers/data-provider";
import { cn } from "@/lib/utils";

/**
 * The read-first block at the top of a customer's history.
 *
 * With hundreds of entries per customer, reading the log top to bottom stops
 * being possible. This answers the question the log was being scrolled for —
 * where are we, is it moving, what is outstanding — in one glance, and the
 * full journal stays one click away underneath.
 *
 * Every figure is derived from the logged activities, so it cannot contradict
 * them and cannot state anything that was not recorded.
 */
export function CustomerSummary({
  activities,
  defaultOpen = true,
}: {
  activities: Activity[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const { contactById } = useData();

  /* Names make the story readable — "emailed Ankit", not "emailed P-003". */
  const nameOf = React.useCallback(
    (id: string | null) => contactById(id)?.name ?? null,
    [contactById],
  );

  const narrative = React.useMemo(
    () => narrateCustomer(activities, nameOf),
    [activities, nameOf],
  );

  if (!narrative) return null;

  const summary = narrative.summary;
  const momentum = MOMENTUM_STYLES[summary.momentum];

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.05]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2.5 p-3 text-left"
      >
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Sparkles className="size-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                momentum.className,
              )}
            >
              {momentum.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-foreground/90">{summary.headline}</p>

          {/* Collapsed: lead with the one line that decides whether to act. */}
          {!open && (
            <p
              className={cn(
                "mt-1 truncate text-xs font-medium",
                summary.signals[0]
                  ? SIGNAL_STYLES[summary.signals[0].tone]
                  : "text-muted-foreground",
              )}
            >
              {narrative.standfirst}
            </p>
          )}
        </div>

        <ChevronRight
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-accent/20 px-3 pb-3 pt-2.5">
              {/*
                The story, in sentences. Written on the device from the logged
                records — so it reads like prose but cannot state anything that
                was never entered.
              */}
              <div className="rounded-lg bg-background/60 p-2.5">
                <p className="text-[13px] leading-relaxed text-foreground/85">
                  {narrative.sentences.map((sentence, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.05 + i * 0.06 }}
                    >
                      {sentence}{" "}
                    </motion.span>
                  ))}
                </p>

                {narrative.suggestion && (
                  <div className="mt-2 flex items-start gap-1.5 border-t border-border/60 pt-2">
                    <Lightbulb className="mt-0.5 size-3 shrink-0 text-accent" />
                    <span className="text-[12px] font-medium text-accent">
                      {narrative.suggestion}
                    </span>
                  </div>
                )}
              </div>

              {/* Hard numbers, so the story can be checked */}
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Interactions" value={String(summary.total)} />
                <Stat
                  label="Cadence"
                  value={
                    summary.cadenceDays ? `${summary.cadenceDays}d` : "—"
                  }
                  hint="avg gap"
                />
                <Stat
                  label="Last contact"
                  value={
                    summary.daysSinceLast === 0
                      ? "Today"
                      : `${summary.daysSinceLast}d`
                  }
                  hint="ago"
                />
              </div>

              <Line label="Mix" value={summary.mix} />
              <Line
                label="Deals"
                value={
                  summary.dealIds.length
                    ? summary.dealIds.join(", ")
                    : "None linked"
                }
              />
              <Line label="Rhythm" value={summary.momentumNote} />

              {/* What to act on */}
              <div className="space-y-1 border-t border-accent/20 pt-2">
                {summary.signals.map((signal, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-1.5 text-xs",
                      SIGNAL_STYLES[signal.tone],
                    )}
                  >
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                    <span className="min-w-0 flex-1">{signal.text}</span>
                  </div>
                ))}
              </div>

              {summary.openTasks.length > 0 && (
                <div className="space-y-1 border-t border-accent/20 pt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Open tasks
                  </div>
                  {summary.openTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {task.task}
                      </span>
                      {taskUrgencyLabel(task) && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px]",
                            URGENCY_STYLES[taskUrgency(task)],
                          )}
                        >
                          {taskUrgencyLabel(task)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-background/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">
        {value}
        {hint && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-14 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-foreground/80">{value}</span>
    </div>
  );
}
