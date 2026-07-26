/**
 * Activities — the interaction journal.
 *
 * One record type, read at three levels:
 *   deal drawer     → only activities linked to that deal
 *   company drawer  → every activity for that customer
 *   activities page → everything
 *
 * A deal link is always deliberate: nothing is preselected, because a customer
 * with one open deal still has conversations that have nothing to do with it.
 */

export type ActivityType =
  | "site_visit"
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "casual_follow_up"
  | "whatsapp"
  | "payment_follow_up";

export type ActivityDefinition = {
  id: ActivityType;
  label: string;
  /** The report field's label follows the type, prompting a real note. */
  reportLabel: string;
  /** Lucide icon name, resolved in the UI layer. */
  icon: string;
  color: string;
  tint: string;
};

export const ACTIVITY_TYPES: ActivityDefinition[] = [
  {
    id: "site_visit",
    label: "Site visit",
    reportLabel: "Visit report",
    icon: "MapPin",
    color: "bg-success",
    tint: "bg-success/12 text-success",
  },
  {
    id: "call",
    label: "Call",
    reportLabel: "Call report",
    icon: "Phone",
    color: "bg-chart-1",
    tint: "bg-chart-1/12 text-chart-1",
  },
  {
    id: "email",
    label: "Email",
    reportLabel: "Email summary",
    icon: "Mail",
    color: "bg-warning",
    tint: "bg-warning/15 text-warning",
  },
  {
    id: "meeting",
    label: "Meeting",
    reportLabel: "Meeting report",
    icon: "Users",
    color: "bg-chart-4",
    tint: "bg-chart-4/12 text-chart-4",
  },
  {
    id: "demo",
    label: "Demo",
    reportLabel: "Demo / sample report",
    icon: "Package",
    color: "bg-chart-5",
    tint: "bg-chart-5/12 text-chart-5",
  },
  {
    id: "casual_follow_up",
    label: "Casual follow-up",
    reportLabel: "Follow-up note",
    icon: "MessageSquare",
    color: "bg-muted-foreground/50",
    tint: "bg-secondary text-muted-foreground",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    reportLabel: "Message summary",
    icon: "MessageCircle",
    color: "bg-success",
    tint: "bg-success/12 text-success",
  },
  {
    id: "payment_follow_up",
    label: "Payment follow-up",
    reportLabel: "Payment note",
    icon: "Banknote",
    color: "bg-chart-3",
    tint: "bg-chart-3/12 text-chart-3",
  },
];

export const ACTIVITY_MAP: Record<ActivityType, ActivityDefinition> =
  Object.fromEntries(ACTIVITY_TYPES.map((t) => [t.id, t])) as Record<
    ActivityType,
    ActivityDefinition
  >;

export type Activity = {
  id: string;
  companyId: string;
  contactId: string | null;
  /** Null unless the user deliberately linked a deal. */
  dealId: string | null;
  type: ActivityType;
  report: string;
  /** When it happened — can be back-dated, unlike createdAt. */
  occurredAt: string;

  // Optional follow-up, captured through the inline reveal.
  task: string | null;
  taskDueAt: string | null;
  taskDone: boolean;
  remind: boolean;

  owner: string;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* Task helpers                                                        */
/* ------------------------------------------------------------------ */

export type TaskUrgency = "overdue" | "today" | "soon" | "later" | "none";

const DAY = 86_400_000;

/** Whole-day difference, so "today" isn't affected by the time of day. */
function dayDiff(iso: string, now = Date.now()) {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY);
}

export function taskUrgency(activity: Activity, now = Date.now()): TaskUrgency {
  if (!activity.task || activity.taskDone || !activity.taskDueAt) return "none";
  const diff = dayDiff(activity.taskDueAt, now);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 7) return "soon";
  return "later";
}

export function taskUrgencyLabel(activity: Activity, now = Date.now()) {
  const urgency = taskUrgency(activity, now);
  if (urgency === "none" || !activity.taskDueAt) return null;
  const diff = dayDiff(activity.taskDueAt, now);
  if (urgency === "overdue")
    return `Overdue ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`;
  if (urgency === "today") return "Due today";
  if (diff === 1) return "Tomorrow";
  if (urgency === "soon") return `In ${diff} days`;
  return new Date(activity.taskDueAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export const URGENCY_STYLES: Record<TaskUrgency, string> = {
  overdue: "bg-destructive/12 text-destructive font-semibold",
  today: "bg-warning/15 text-warning font-semibold",
  soon: "bg-accent/12 text-accent",
  later: "bg-secondary text-muted-foreground",
  none: "bg-secondary text-muted-foreground",
};

export function isOpenTask(activity: Activity) {
  return Boolean(activity.task) && !activity.taskDone;
}

/** Counts behind the bell badge and the dashboard tile. */
export function taskCounts(activities: Activity[], now = Date.now()) {
  let overdue = 0;
  let today = 0;
  let upcoming = 0;
  for (const activity of activities) {
    if (!isOpenTask(activity)) continue;
    const urgency = taskUrgency(activity, now);
    if (urgency === "overdue") overdue += 1;
    else if (urgency === "today") today += 1;
    else upcoming += 1;
  }
  return { overdue, today, upcoming, total: overdue + today + upcoming };
}

/* ------------------------------------------------------------------ */
/* Derived summary                                                     */
/* ------------------------------------------------------------------ */

export type ActivitySummary = {
  last: Activity | null;
  next: Activity | null;
};

/**
 * The two facts shown at the top of a journal: the most recent interaction,
 * and the oldest still-open task. Derived rather than typed, so it can never
 * go stale.
 */
export function summarise(activities: Activity[]): ActivitySummary {
  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const openTasks = activities
    .filter(isOpenTask)
    .sort(
      (a, b) =>
        new Date(a.taskDueAt ?? a.occurredAt).getTime() -
        new Date(b.taskDueAt ?? b.occurredAt).getTime(),
    );
  return { last: sorted[0] ?? null, next: openTasks[0] ?? null };
}

/** Newest first — the order the journal renders in. */
export function sortByRecent(activities: Activity[]) {
  return [...activities].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

/* ------------------------------------------------------------------ */
/* Demo data — replaced by Supabase once loaded                        */
/* ------------------------------------------------------------------ */

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

/**
 * Seeded to exercise every case: linked and unlinked activities, open and
 * completed tasks, overdue and due-today, and a full journal on one company
 * so the collapse behaviour is visible.
 */
export const ACTIVITIES: Activity[] = [
  // --- Atlantis: a full journal, mixed linked/unlinked ---------------
  {
    id: "AC-001",
    companyId: "C-001",
    contactId: "P-002",
    dealId: null,
    type: "site_visit",
    report:
      "Visited the property, met the storekeeper and collected the purchasing contact details.",
    occurredAt: days(-26),
    task: null,
    taskDueAt: null,
    taskDone: false,
    remind: false,
    owner: "Bishal Karma",
    createdAt: days(-26),
  },
  {
    id: "AC-002",
    companyId: "C-001",
    contactId: "P-003",
    dealId: null,
    type: "email",
    report: "Sent the company profile and product catalogue to Mr. Ankit.",
    occurredAt: days(-22),
    task: null,
    taskDueAt: null,
    taskDone: true,
    remind: false,
    owner: "Bishal Karma",
    createdAt: days(-22),
  },
  {
    id: "AC-003",
    companyId: "C-001",
    contactId: "P-003",
    dealId: "D-1041",
    type: "call",
    report:
      "Chased the catalogue email. Ankit confirmed interest in the annual dry goods contract and set a meeting.",
    occurredAt: days(-14),
    task: null,
    taskDueAt: null,
    taskDone: true,
    remind: false,
    owner: "Bishal Karma",
    createdAt: days(-14),
  },
  {
    id: "AC-004",
    companyId: "C-001",
    contactId: "P-003",
    dealId: "D-1041",
    type: "meeting",
    report:
      "Met Mr. Ankit and the executive chef. Confirmed volumes for rice and oil, requested revised rates.",
    occurredAt: days(-6),
    task: null,
    taskDueAt: null,
    taskDone: true,
    remind: false,
    owner: "Bishal Karma",
    createdAt: days(-6),
  },
  {
    id: "AC-005",
    companyId: "C-001",
    contactId: "P-003",
    dealId: "D-1041",
    type: "email",
    report: "Sent the revised pricing sheet. Waiting on the final offer decision.",
    occurredAt: days(-1),
    task: "Follow up on the revised pricing sheet",
    taskDueAt: days(-2),
    taskDone: false,
    remind: true,
    owner: "Bishal Karma",
    createdAt: days(-1),
  },

  // --- Overdue and due-today, for the bell counts --------------------
  {
    id: "AC-006",
    companyId: "C-003",
    contactId: "P-006",
    dealId: "D-1031",
    type: "call",
    report:
      "Discussed the quarterly seafood rates. Kenji wants a price lock against USD movement.",
    occurredAt: days(-3),
    task: "Send revised price list with the USD lock",
    taskDueAt: days(0),
    taskDone: false,
    remind: true,
    owner: "Bishal Karma",
    createdAt: days(-3),
  },
  {
    id: "AC-007",
    companyId: "C-004",
    contactId: "P-008",
    dealId: "D-1035",
    type: "demo",
    report: "Dispatched four coffee blend samples for the cupping session.",
    occurredAt: days(-9),
    task: "Collect cupping feedback from the head barista",
    taskDueAt: days(3),
    taskDone: false,
    remind: true,
    owner: "Ahmed Faris",
    createdAt: days(-9),
  },

  // --- Unlinked relationship touches ---------------------------------
  {
    id: "AC-008",
    companyId: "C-005",
    contactId: "P-010",
    dealId: null,
    type: "whatsapp",
    report: "Festive greetings to the housekeeping supervisor.",
    occurredAt: days(-4),
    task: null,
    taskDueAt: null,
    taskDone: false,
    remind: false,
    owner: "Priya Nair",
    createdAt: days(-4),
  },
  {
    id: "AC-009",
    companyId: "C-009",
    contactId: "P-014",
    dealId: null,
    type: "casual_follow_up",
    report: "Coffee catch-up with Nadia. No immediate requirement.",
    occurredAt: days(-8),
    task: null,
    taskDueAt: null,
    taskDone: false,
    remind: false,
    owner: "Ahmed Faris",
    createdAt: days(-8),
  },

  // --- Payment chasing -----------------------------------------------
  {
    id: "AC-010",
    companyId: "C-003",
    contactId: "P-006",
    dealId: null,
    type: "payment_follow_up",
    report:
      "Reminded Kenji about the outstanding invoice. Finance will release it this week.",
    occurredAt: days(-2),
    task: "Confirm the payment has been released",
    taskDueAt: days(1),
    taskDone: false,
    remind: true,
    owner: "Bishal Karma",
    createdAt: days(-2),
  },
  {
    id: "AC-011",
    companyId: "C-006",
    contactId: "P-011",
    dealId: "D-1026",
    type: "site_visit",
    report: "Banquet kitchen survey ahead of the disposables quotation.",
    occurredAt: days(-5),
    task: "Chase quote approval before wedding season",
    taskDueAt: days(-1),
    taskDone: false,
    remind: true,
    owner: "Ahmed Faris",
    createdAt: days(-5),
  },
  {
    id: "AC-012",
    companyId: "C-002",
    contactId: "P-004",
    dealId: "D-1038",
    type: "email",
    report: "Shared the pre-opening tableware catalogue with Elena.",
    occurredAt: days(-2),
    task: "Follow up on the tableware shortlist",
    taskDueAt: days(2),
    taskDone: false,
    remind: true,
    owner: "Priya Nair",
    createdAt: days(-2),
  },
];
