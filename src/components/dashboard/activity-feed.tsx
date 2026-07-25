"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Truck,
  Users,
} from "lucide-react";
import { ACTIVITIES, type Activity } from "@/lib/demo-data";
import { cn, relativeTime } from "@/lib/utils";

const ICONS: Record<Activity["type"], React.ComponentType<{ className?: string }>> =
  {
    call: Phone,
    meeting: Users,
    email: Mail,
    sample: Package,
    delivery: Truck,
    note: MessageSquare,
  };

const PRIORITY_STYLES: Record<Activity["priority"], string> = {
  high: "bg-destructive/12 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-secondary text-muted-foreground",
};

export function ActivityFeed() {
  const [completed, setCompleted] = React.useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(ACTIVITIES.map((activity) => [activity.id, activity.done])),
  );

  return (
    <ul className="space-y-1">
      {ACTIVITIES.map((activity, index) => {
        const Icon = ICONS[activity.type];
        const done = completed[activity.id];
        const overdue = !done && new Date(activity.due).getTime() < Date.now();

        return (
          <motion.li
            key={activity.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.32,
              delay: index * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-secondary/60"
          >
            <button
              onClick={() =>
                setCompleted((prev) => ({
                  ...prev,
                  [activity.id]: !prev[activity.id],
                }))
              }
              aria-label={done ? "Mark as pending" : "Mark as done"}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
                done
                  ? "border-success bg-success text-success-foreground"
                  : "border-border hover:border-accent hover:bg-accent/10",
              )}
            >
              {done && <Check className="size-3.5" />}
            </button>

            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Icon className="size-3.5" />
            </span>

            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate text-sm font-medium transition-colors",
                  done && "text-muted-foreground line-through",
                )}
              >
                {activity.title}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="truncate">{activity.company}</span>
                <span aria-hidden>·</span>
                <span className={cn(overdue && "font-medium text-destructive")}>
                  {relativeTime(activity.due)}
                </span>
              </div>
            </div>

            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                PRIORITY_STYLES[activity.priority],
              )}
            >
              {activity.priority}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
