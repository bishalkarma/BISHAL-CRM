"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CalendarClock, Check } from "lucide-react";
import {
  isOpenTask,
  taskCounts,
  taskUrgency,
  type Activity,
} from "@/lib/activities";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * The bell.
 *
 * A task is the notification — there is no separate notifications table,
 * because that would duplicate state the activity record already holds and
 * could drift out of sync with it. Completing the task is what clears the
 * badge; there is deliberately no "mark all as read", since these are jobs
 * to do rather than messages to acknowledge.
 *
 * Only overdue and due-today work counts. Upcoming is excluded on purpose: a
 * badge that is never zero stops being read.
 */
export function NotificationBell({
  onOpenCompany,
}: {
  /** Opens the customer pop-up over whatever page you are already on. */
  onOpenCompany: (companyId: string) => void;
}) {
  const { activities, companies } = useData();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const counts = React.useMemo(() => taskCounts(activities), [activities]);

  const { overdue, today } = React.useMemo(() => {
    const open = activities.filter(isOpenTask);
    const byDue = (a: Activity, b: Activity) =>
      new Date(a.taskDueAt ?? a.occurredAt).getTime() -
      new Date(b.taskDueAt ?? b.occurredAt).getTime();
    return {
      overdue: open.filter((a) => taskUrgency(a) === "overdue").sort(byDue),
      today: open.filter((a) => taskUrgency(a) === "today").sort(byDue),
    };
  }, [activities]);

  const total = counts.overdue + counts.today;
  const companyName = (id: string) =>
    companies.find((c) => c.id === id)?.name ?? "—";

  const handleRow = (activity: Activity) => {
    setOpen(false);
    onOpenCompany(activity.companyId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={
            total > 0
              ? `Notifications, ${total} needing attention`
              : "Notifications, nothing due"
          }
        >
          <Bell />
          {/*
            Red only when something is genuinely late. Amber for today's work,
            and nothing at all when you are clear — an always-red dot trains
            you to ignore it.
          */}
          {total > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums text-white",
                counts.overdue > 0 ? "bg-destructive" : "bg-warning",
              )}
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(calc(100vw-2rem),380px)] p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Needs attention</span>
          <span className="ml-auto text-xs text-muted-foreground">{total}</span>
        </div>

        {total === 0 ? (
          <div className="px-4 py-8 text-center">
            <Check className="mx-auto mb-2 size-5 text-success" />
            <p className="text-sm font-medium">All clear</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nothing overdue or due today.
            </p>
          </div>
        ) : (
          <div className="max-h-[min(60vh,420px)] overflow-y-auto scrollbar-thin">
            {overdue.length > 0 && (
              <Section
                label="Overdue"
                count={overdue.length}
                tone="danger"
                icon={AlertTriangle}
              >
                {overdue.map((a) => (
                  <Row
                    key={a.id}
                    activity={a}
                    company={companyName(a.companyId)}
                    tone="danger"
                    onClick={() => handleRow(a)}
                  />
                ))}
              </Section>
            )}
            {today.length > 0 && (
              <Section
                label="Due today"
                count={today.length}
                tone="warning"
                icon={CalendarClock}
              >
                {today.map((a) => (
                  <Row
                    key={a.id}
                    activity={a}
                    company={companyName(a.companyId)}
                    tone="warning"
                    onClick={() => handleRow(a)}
                  />
                ))}
              </Section>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/activities");
          }}
          className="w-full border-t border-border py-2.5 text-center text-xs font-medium text-accent transition-colors hover:bg-secondary/50"
        >
          View all open tasks
        </button>
      </PopoverContent>
    </Popover>
  );
}

function Section({
  label,
  count,
  tone,
  icon: Icon,
  children,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning";
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider",
          tone === "danger" ? "text-destructive" : "text-warning",
        )}
      >
        <Icon className="size-3" />
        {label} · {count}
      </div>
      {children}
    </div>
  );
}

function Row({
  activity,
  company,
  tone,
  onClick,
}: {
  activity: Activity;
  company: string;
  tone: "danger" | "warning";
  onClick: () => void;
}) {
  const days = activity.taskDueAt
    ? Math.round(
        (Date.now() - new Date(activity.taskDueAt).getTime()) / 86_400_000,
      )
    : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 px-4 py-2 text-left transition-colors hover:bg-secondary/60"
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          tone === "danger" ? "bg-destructive" : "bg-warning",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium leading-snug">
          {activity.task}
        </span>
        <span className="mt-0.5 block break-words text-xs text-muted-foreground">
          {company}
        </span>
      </span>
      {tone === "danger" && days > 0 && (
        <span className="mt-0.5 shrink-0 rounded-full bg-destructive/12 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
          {days}d late
        </span>
      )}
    </button>
  );
}
