"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, Check } from "lucide-react";
import type { TodaySummary } from "@/lib/dashboard-metrics";
import { taskUrgency, type Activity } from "@/lib/activities";
import { cn } from "@/lib/utils";

/**
 * What to do today.
 *
 * Replaces a feed of six invented tasks that existed in a demo file and
 * nowhere else. A dashboard should answer "what do I do now", so only
 * overdue and due-today work appears — anything later belongs on the
 * Activities page.
 */
/** The two buckets this tile can narrow to. Booked is a count, not a task. */
type TodayBucket = "overdue" | "today";

export function TodayPanel({
  summary,
  companyName,
  onOpenCompany,
}: {
  summary: TodaySummary;
  companyName: (id: string) => string;
  onOpenCompany: (companyId: string) => void;
}) {
  const { overdue, dueToday, scheduled, tasks } = summary;

  /*
    This tile filters itself rather than following the page period, which
    could otherwise set it to Year — and "today" cannot mean this year.
  */
  const [bucket, setBucket] = React.useState<TodayBucket | null>(null);
  const toggle = (next: TodayBucket) =>
    setBucket((current) => (current === next ? null : next));

  const shown = React.useMemo(() => {
    if (!bucket) return tasks;
    return tasks.filter((t) =>
      bucket === "overdue"
        ? taskUrgency(t) === "overdue"
        : taskUrgency(t) === "today",
    );
  }, [tasks, bucket]);

  const hidden = tasks.length - shown.length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Count
          label="Overdue"
          value={overdue}
          tone="danger"
          active={bucket === "overdue"}
          onClick={() => toggle("overdue")}
        />
        <Count
          label="Due today"
          value={dueToday}
          tone="warning"
          active={bucket === "today"}
          onClick={() => toggle("today")}
        />
        {/* Booked counts entries scheduled ahead — there is no list to filter. */}
        <Count label="Booked" value={scheduled} tone="neutral" hint="7 days" />
      </div>

      {bucket && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
            bucket === "overdue" ? "bg-destructive/10" : "bg-warning/12",
          )}
        >
          <span className="font-medium">
            Showing {shown.length} {bucket === "overdue" ? "overdue" : "due today"}
          </span>
          {hidden > 0 && (
            <span className="text-muted-foreground">· {hidden} hidden</span>
          )}
          <button
            type="button"
            onClick={() => setBucket(null)}
            className="ml-auto font-medium text-accent hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center">
          <Check className="mx-auto mb-1.5 size-5 text-success" />
          <p className="text-sm font-medium">Nothing due today</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nothing overdue either — you are clear.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {shown.slice(0, 5).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              company={companyName(task.companyId)}
              onClick={() => onOpenCompany(task.companyId)}
            />
          ))}
        </ul>
      )}

      {shown.length > 5 && (
        <Link
          href="/activities?view=open-tasks"
          className="flex items-center justify-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          {shown.length - 5} more
          <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

function Count({
  label,
  value,
  tone,
  hint,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "neutral";
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {tone === "danger" && value > 0 && (
          <AlertTriangle className="size-3 text-destructive" />
        )}
        {label}
      </div>
      {/* Colour only when there is something to act on. */}
      <div
        className={cn(
          "text-lg font-semibold tabular-nums",
          value === 0 && "text-muted-foreground",
          tone === "danger" && value > 0 && "text-destructive",
          tone === "warning" && value > 0 && "text-warning",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </>
  );

  if (!onClick) {
    return <div className="rounded-xl bg-secondary/50 px-2.5 py-2">{body}</div>;
  }

  // A real button, so it is keyboard reachable and announces its state.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl bg-secondary/50 px-2.5 py-2 text-left transition-colors hover:bg-secondary",
        active &&
          (tone === "danger"
            ? "bg-destructive/10 ring-1 ring-destructive/40"
            : "bg-warning/12 ring-1 ring-warning/40"),
      )}
    >
      {body}
    </button>
  );
}

function TaskRow({
  task,
  company,
  onClick,
}: {
  task: Activity;
  company: string;
  onClick: () => void;
}) {
  const urgency = taskUrgency(task);
  const late =
    task.taskDueAt && urgency === "overdue"
      ? Math.round(
          (Date.now() - new Date(task.taskDueAt).getTime()) / 86_400_000,
        )
      : 0;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/60"
      >
        <span
          aria-hidden
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            urgency === "overdue" ? "bg-destructive" : "bg-warning",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm leading-snug">
            {task.task}
          </span>
          <span className="block break-words text-xs text-muted-foreground">
            {company}
          </span>
        </span>
        {late > 0 && (
          <span className="mt-0.5 shrink-0 rounded-full bg-destructive/12 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
            {late}d
          </span>
        )}
        {urgency === "today" && (
          <CalendarClock className="mt-1 size-3 shrink-0 text-warning" />
        )}
      </button>
    </li>
  );
}
