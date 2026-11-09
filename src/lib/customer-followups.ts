/**
 * Customer Follow-up & Open Task linking helpers (BUILD 18.12).
 *
 * Bridges `activities` (where follow-up tasks and future bookings are stored)
 * with `companies.next_follow_up` (what CustomerDrawer, CompanyTable, and
 * MobileCompanyTable display in the Follow-up chip).
 */

import { taskUrgency, type Activity, type TaskUrgency } from "./activities";
import type { Company } from "./companies";

/**
 * Returns all open (incomplete) follow-up tasks for `companyId`, ordered by
 * urgency / earliest due date first so the most pressing task leads:
 *   1. Open tasks with a `taskDueAt` date, sorted earliest -> latest
 *      (Overdue -> Due today -> Upcoming like Monday)
 *   2. Open tasks without a `taskDueAt` date, sorted oldest `occurredAt` first
 */
export function openTasksForCompany(
  companyId: string,
  activities: readonly Activity[],
): Activity[] {
  return activities
    .filter(
      (a) =>
        a.companyId === companyId &&
        Boolean(a.task && a.task.trim().length > 0) &&
        !a.taskDone,
    )
    .sort((a, b) => {
      const aHasDue = Boolean(a.taskDueAt);
      const bHasDue = Boolean(b.taskDueAt);
      if (aHasDue && bHasDue) {
        return (
          new Date(a.taskDueAt!).getTime() - new Date(b.taskDueAt!).getTime()
        );
      }
      if (aHasDue !== bHasDue) return aHasDue ? -1 : 1;
      return (
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );
    });
}

/**
 * Computes a customer's next follow-up timestamp from their live activities:
 *   1. Earliest `taskDueAt` across any open (`!taskDone`) task on the customer
 *   2. Otherwise, earliest `occurredAt` across any future-booked activity (`> now`)
 *   3. Otherwise `null` ("Not scheduled")
 */
export function deriveNextFollowUp(
  companyId: string,
  activities: readonly Activity[],
  now = Date.now(),
): string | null {
  const datedOpenTasks = openTasksForCompany(companyId, activities).filter(
    (a) => Boolean(a.taskDueAt),
  );
  if (datedOpenTasks.length > 0) {
    return datedOpenTasks[0].taskDueAt!;
  }

  const upcomingBookings = activities
    .filter(
      (a) =>
        a.companyId === companyId && new Date(a.occurredAt).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

  if (upcomingBookings.length > 0) {
    return upcomingBookings[0].occurredAt;
  }

  return null;
}

/**
 * Returns companies with `nextFollowUp` live-linked to their open tasks and
 * upcoming booked activities so the Customer Card and Companies Table never
 * drift out of sync.
 */
export function resolveCompanyFollowUps(
  companies: readonly Company[],
  activities: readonly Activity[],
  now = Date.now(),
): Company[] {
  return companies.map((company) => {
    const derived = deriveNextFollowUp(company.id, activities, now);
    if ((company.nextFollowUp ?? null) === derived) return company;
    return { ...company, nextFollowUp: derived };
  });
}

export type OpenTaskMeta = {
  urgency: TaskUrgency;
  /** Uppercase eyebrow shown above the task text, e.g. "OPEN TASK · MON 9 NOV" */
  eyebrow: string;
};

/**
 * Formats the compact uppercase eyebrow label for the Option B Open Task bar
 * inside `CompanyDrawer`.
 */
export function formatOpenTaskMeta(
  activity: Activity,
  now = Date.now(),
): OpenTaskMeta {
  if (!activity.taskDueAt) {
    return {
      urgency: "none",
      eyebrow: "OPEN TASK · NO DUE DATE",
    };
  }

  const urgency = taskUrgency(activity, now);
  const dueDate = new Date(activity.taskDueAt);
  const shortDate = dueDate
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .replace(",", "")
    .toUpperCase();

  if (urgency === "overdue") {
    return { urgency, eyebrow: `OVERDUE TASK · ${shortDate}` };
  }
  if (urgency === "today") {
    return { urgency, eyebrow: `DUE TODAY · ${shortDate}` };
  }
  return { urgency, eyebrow: `OPEN TASK · ${shortDate}` };
}
