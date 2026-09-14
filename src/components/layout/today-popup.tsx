"use client";

import * as React from "react";
import Link from "next/link";
import { CheckSquare, Calendar, Clock } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import { useData } from "@/components/providers/data-provider";
import { PopupPanel } from "./popup-panel";

export function TodayPopup({ onClose }: { onClose: () => void }) {
  const { activities, companies } = useData();

  const stats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const followUps = companies
      .filter((c) => {
        if (!c.nextFollowUp) return false;
        const d = new Date(c.nextFollowUp);
        return d >= today && d <= todayEnd;
      })
      .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());

    const tasks = activities
      .filter((a) => {
        if (!a.task || a.taskDone || !a.taskDueAt) return false;
        const d = new Date(a.taskDueAt);
        return d >= today && d <= todayEnd;
      })
      .sort((a, b) => new Date(a.taskDueAt!).getTime() - new Date(b.taskDueAt!).getTime());

    const meetings = activities
      .filter((a) => {
        if (!a.occurredAt) return false;
        const d = new Date(a.occurredAt);
        return d >= today && d <= todayEnd && a.type === "meeting";
      })
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

    return { followUps, tasks, meetings };
  }, [activities, companies]);

  const total = stats.followUps.length + stats.tasks.length + stats.meetings.length;

  return (
    <PopupPanel title="Today's Agenda" accent="blue" onClose={onClose}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on your plate today — you&apos;re all caught up.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Follow-ups */}
          {stats.followUps.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Follow-ups ({stats.followUps.length})</span>
              </div>
              <ul className="space-y-1.5">
                {stats.followUps.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/companies?id=${c.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                      <span className="flex-1 truncate font-medium">{c.name}</span>
                      {c.nextFollowUp && (
                        <span className="shrink-0 text-[11px] text-muted-foreground group-hover:text-foreground">
                          {new Date(c.nextFollowUp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks */}
          {stats.tasks.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckSquare className="size-3 text-orange-500" />
                <span>Tasks due ({stats.tasks.length})</span>
              </div>
              <ul className="space-y-1.5">
                {stats.tasks.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/companies?id=${a.companyId}`}
                      onClick={onClose}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span className="flex-1 truncate font-medium">{a.task}</span>
                      {a.taskDueAt && (
                        <span className="shrink-0 text-[11px] text-muted-foreground group-hover:text-foreground">
                          {new Date(a.taskDueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meetings */}
          {stats.meetings.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="size-3 text-accent" />
                <span>Meetings ({stats.meetings.length})</span>
              </div>
              <ul className="space-y-1.5">
                {stats.meetings.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/companies?id=${a.companyId}`}
                      onClick={onClose}
                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                    >
                      <Calendar className="size-3.5 shrink-0 text-accent" />
                      <span className="flex-1 truncate font-medium">{a.report || a.task}</span>
                      {a.occurredAt && (
                        <span className="shrink-0 text-[11px] text-muted-foreground group-hover:text-foreground">
                          {new Date(a.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PopupPanel>
  );
}
