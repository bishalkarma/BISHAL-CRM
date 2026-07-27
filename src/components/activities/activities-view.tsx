"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  ListChecks,
  PenLine,
  Plus,
  Search,
  Users,
} from "lucide-react";
import {
  ACTIVITY_MAP,
  ACTIVITY_TYPES,
  URGENCY_STYLES,
  isOpenTask,
  sortByRecent,
  taskCounts,
  taskUrgency,
  taskUrgencyLabel,
  type Activity,
  type ActivityType,
} from "@/lib/activities";
import {
  countThreads,
  hasHappened,
  isUpcoming,
} from "@/lib/activity-narrative";
import { DEAL_OWNERS } from "@/lib/deals";
import { useData } from "@/components/providers/data-provider";
import { ActivityRow } from "./activity-row";
import { CustomerSummary } from "./customer-summary";
import { LogActivityDialog } from "./log-activity-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials, relativeTime } from "@/lib/utils";

type ViewMode = "timeline" | "by-customer" | "open-tasks";

/**
 * Timeline-only period filter.
 *
 * Deliberately not applied to By customer or Open tasks: a customer summary
 * built from one week of history would be misleading, and hiding a task
 * because it is old is the opposite of useful.
 */
type Period = "week" | "month" | "quarter" | "year" | "all";

const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "quarter", label: "Quarter", days: 90 },
  { id: "year", label: "Year", days: 365 },
  { id: "all", label: "All", days: null },
];

/** Groups the timeline into readable buckets rather than a flat list. */
function dateBucket(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return "This week";
  if (diff <= 30) return "This month";
  return "Earlier";
}

export function ActivitiesView() {
  const { activities, companies, loading } = useData();

  const [view, setView] = React.useState<ViewMode>("timeline");
  // "all" by default so the Timeline opens grouped by Today / Yesterday.
  // Choosing a period switches it to a flat dated list.
  const [period, setPeriod] = React.useState<Period>("all");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [query, setQuery] = React.useState("");
  const [types, setTypes] = React.useState<ActivityType[]>([]);
  const [owners, setOwners] = React.useState<string[]>([]);
  const [logOpen, setLogOpen] = React.useState(false);
  /** The open task being closed out — drives the pre-filled log form. */
  const [completing, setCompleting] = React.useState<Activity | null>(null);
  const [expandedCompanies, setExpandedCompanies] = React.useState<
    Record<string, boolean>
  >({});

  const counts = React.useMemo(() => taskCounts(activities), [activities]);
  const threadTotals = React.useMemo(
    () => countThreads(activities),
    [activities],
  );

  const companyName = React.useCallback(
    (id: string) => companies.find((c) => c.id === id)?.name ?? "—",
    [companies],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (types.length && !types.includes(a.type)) return false;
      if (owners.length && !owners.includes(a.owner)) return false;
      if (!q) return true;
      return `${a.report} ${a.task ?? ""} ${companyName(a.companyId)}`
        .toLowerCase()
        .includes(q);
    });
  }, [activities, types, owners, query, companyName]);

  /**
   * The period cut, applied to Timeline alone. Everything upstream of this
   * stays whole, so By customer and Open tasks are untouched by it.
   */
  const periodScoped = React.useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days ?? null;
    if (days === null) return filtered;
    const now = Date.now();
    const cutoff = now - days * 86_400_000;
    return filtered.filter((a) => {
      const at = new Date(a.occurredAt).getTime();
      // Upcoming entries are never filtered out: they sit in their own pinned
      // section, and "later than the cutoff" would otherwise let a meeting
      // booked for next year show up under Week.
      if (at > now) return true;
      return at >= cutoff;
    });
  }, [filtered, period]);

  /*
    Any change to the result set sends you back to page 1 — otherwise you can
    sit on page 8 of a list that now has two pages.
  */
  React.useEffect(() => {
    setPage(1);
  }, [period, perPage, query, types, owners]);

  /**
   * Completing a task opens the log form rather than silently ticking a box,
   * so the work is always recorded and the next follow-up can be set.
   */
  const startComplete = React.useCallback((activity: Activity) => {
    setCompleting(activity);
    setLogOpen(true);
  }, []);

  const activeFilters = types.length + owners.length + (query ? 1 : 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activities"
        description="Every interaction, across every customer."
        actions={
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus />
            Log activity
          </Button>
        }
      />

      {/* Task counts — the same numbers behind the bell */}
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Due today" value={counts.today} tone="warning" />
        <Tile label="Overdue" value={counts.overdue} tone="danger" />
        {/* Future-dated entries are not history yet, so they are not counted. */}
        <Tile
          label="Logged"
          value={threadTotals.logged}
          hint={
            threadTotals.upcoming > 0
              ? `${threadTotals.upcoming} upcoming`
              : "all time"
          }
        />
      </div>

      {/* Views + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          {(
            [
              ["timeline", "Timeline", CalendarClock],
              ["by-customer", "By customer", Building2],
              ["open-tasks", "Open tasks", ListChecks],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities…"
            className="h-9 pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Users />
              <span className="hidden sm:inline">Filter</span>
              {activeFilters > 0 && (
                <Badge variant="accent" className="ml-0.5 px-1.5 py-0">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[380px] w-56 overflow-y-auto">
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            {ACTIVITY_TYPES.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onSelect={(e) => {
                  e.preventDefault();
                  setTypes((cur) =>
                    cur.includes(t.id)
                      ? cur.filter((x) => x !== t.id)
                      : [...cur, t.id],
                  );
                }}
              >
                <span className="flex-1">{t.label}</span>
                {types.includes(t.id) && <Check className="size-4 text-accent" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Logged by</DropdownMenuLabel>
            {DEAL_OWNERS.map((o) => (
              <DropdownMenuItem
                key={o}
                onSelect={(e) => {
                  e.preventDefault();
                  setOwners((cur) =>
                    cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o],
                  );
                }}
              >
                <span className="flex-1 truncate">{o}</span>
                {owners.includes(o) && <Check className="size-4 text-accent" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Period pills — Timeline only, so the scope is never ambiguous. */}
      {view === "timeline" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                period === p.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
          <span className="ml-1 text-[11px] text-muted-foreground">
            {periodScoped.length} of {filtered.length} shown
          </span>

          <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Rows per page
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-7 rounded-lg border border-input bg-background px-1.5 text-xs outline-none focus-visible:border-accent"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading ? (
        <Card className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="size-7 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/4" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </Card>
      ) : view === "timeline" ? (
        <TimelineView
          activities={periodScoped}
          grouped={period === "all"}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
        />
      ) : view === "by-customer" ? (
        <ByCustomerView
          activities={filtered}
          companyName={companyName}
          expanded={expandedCompanies}
          setExpanded={setExpandedCompanies}
        />
      ) : (
        <OpenTasksView
          activities={filtered}
          companyName={companyName}
          onComplete={startComplete}
        />
      )}

      <LogActivityDialog
        open={logOpen}
        onOpenChange={(o) => {
          setLogOpen(o);
          if (!o) setCompleting(null);
        }}
        completing={completing}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Timeline.
 *
 * Three behaviours agreed with the user, all interacting:
 *
 *   UPCOMING sits above everything, outside the paging. Entries booked for a
 *   future date are few, and burying next week's meeting on page 6 would
 *   defeat the point of recording it.
 *
 *   HEADINGS only when unfiltered. Once a period is chosen the filter already
 *   states the range — under Week it produced 3 headings for 4 rows, which is
 *   more heading than content. Filtered views get a flat dated list instead.
 *
 *   PAGING applies to history only, newest first.
 */
function TimelineView({
  activities,
  grouped,
  page,
  perPage,
  onPageChange,
}: {
  activities: Activity[];
  /** Date buckets, used only when no period filter is active. */
  grouped: boolean;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const now = Date.now();

  const { upcoming, history } = React.useMemo(() => {
    const sorted = sortByRecent(activities);
    return {
      // Soonest first: the next thing to prepare for leads.
      upcoming: sorted
        .filter((a) => isUpcoming(a, now))
        .reverse(),
      history: sorted.filter((a) => hasHappened(a, now)),
    };
  }, [activities, now]);

  const totalPages = Math.max(Math.ceil(history.length / perPage), 1);
  const safePage = Math.min(page, totalPages);
  const pageItems = history.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  );

  // Buckets are built from the current page, so a heading never spans pages.
  const buckets = React.useMemo(() => {
    if (!grouped) return null;
    const map = new Map<string, Activity[]>();
    pageItems.forEach((a) => {
      const key = dateBucket(a.occurredAt);
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return [...map.entries()];
  }, [pageItems, grouped]);

  if (activities.length === 0) return <Empty />;

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div>
          <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-chart-4">
            Upcoming · {upcoming.length}
          </div>
          <Card className="divide-y divide-border/60 border-chart-4/30">
            {upcoming.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </Card>
        </div>
      )}

      {history.length === 0 ? (
        <Empty label="Nothing logged in this period yet." />
      ) : buckets ? (
        buckets.map(([bucket, items]) => (
          <div key={bucket}>
            <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {bucket}
            </div>
            <Card className="divide-y divide-border/60">
              {items.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <ActivityRow activity={a} />
                </motion.div>
              ))}
            </Card>
          </div>
        ))
      ) : (
        /* Filtered: flat list, each row carrying its own date. */
        <Card className="divide-y divide-border/60">
          {pageItems.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
            >
              <ActivityRow activity={a} showDate />
            </motion.div>
          ))}
        </Card>
      )}

      {history.length > perPage && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const btn =
    "flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          className={btn}
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          className={btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          className={btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-4" />
        </button>
        <button
          className={btn}
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ByCustomerView({
  activities,
  companyName,
  expanded,
  setExpanded,
}: {
  activities: Activity[];
  companyName: (id: string) => string;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach((a) => {
      map.set(a.companyId, [...(map.get(a.companyId) ?? []), a]);
    });
    return [...map.entries()]
      .map(([id, list]) => ({ id, list: sortByRecent(list) }))
      .sort((a, b) => b.list.length - a.list.length);
  }, [activities]);

  if (activities.length === 0) return <Empty />;

  return (
    <div className="space-y-3">
      {grouped.map(({ id, list }) => {
        const isOpen = expanded[id];
        // Only ever the newest three — the summary already covers the rest.
        const visible = list.slice(0, 3);
        const threads = countThreads(list);
        return (
          <Card key={id} className="overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-border bg-secondary/40 px-4 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-xs font-semibold text-accent">
                {companyName(id).charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {companyName(id)}
              </span>
              {/*
                The only place counts appear. Logged is history; anything
                booked ahead is named rather than added to it.
              */}
              <Badge variant="outline">{threads.logged}</Badge>
              {threads.upcoming > 0 && (
                <Badge variant="accent" className="px-1.5 py-0 text-[10px]">
                  {threads.upcoming} upcoming
                </Badge>
              )}
            </div>

            {/*
              Summary is the page. The raw entries stay shut until asked for —
              at hundreds of logs per customer, nobody reads them top to bottom.
            */}
            <div className="p-3">
              {/* Collapsed until asked for — the user decides what to open. */}
              <CustomerSummary activities={list} defaultOpen={false} />
            </div>

            {isOpen && (
              <div className="divide-y divide-border/60 border-t border-border">
                {visible.map((a) => (
                  <ActivityRow key={a.id} activity={a} showCompany={false} />
                ))}
              </div>
            )}

            <button
              onClick={() => setExpanded((e) => ({ ...e, [id]: !e[id] }))}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-medium text-accent transition-colors hover:bg-secondary/50"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
              {isOpen
                ? "Hide logs"
                : `Show last ${visible.length} log${visible.length === 1 ? "" : "s"}`}
            </button>
          </Card>
        );
      })}
    </div>
  );
}

function OpenTasksView({
  activities,
  companyName,
  onComplete,
}: {
  activities: Activity[];
  companyName: (id: string) => string;
  onComplete: (a: Activity) => void;
}) {
  const { contactById, deals } = useData();

  // Overdue first, then by due date — the order you would work them in.
  const tasks = React.useMemo(
    () =>
      activities
        .filter(isOpenTask)
        .sort(
          (a, b) =>
            new Date(a.taskDueAt ?? a.occurredAt).getTime() -
            new Date(b.taskDueAt ?? b.occurredAt).getTime(),
        ),
    [activities],
  );

  if (tasks.length === 0)
    return <Empty label="No open tasks. Everything is closed out." />;

  return (
    <div className="space-y-2">
      {/*
        Completed tasks leave this list the moment they are logged — the exit
        animation makes that visible, so it never looks like nothing happened.
      */}
      <AnimatePresence initial={false} mode="popLayout">
        {tasks.map((a, i) => {
          const urgency = taskUrgency(a);
          const contact = contactById(a.contactId);
          const deal = a.dealId ? deals.find((d) => d.id === a.dealId) : null;
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.2) }}
            >
            <Card
              className={cn(
                "border-l-4 p-3",
                urgency === "overdue"
                  ? "border-l-destructive"
                  : urgency === "today"
                    ? "border-l-warning"
                    : "border-l-accent",
              )}
            >
              <div className="flex items-start gap-2.5">
                {/*
                  No tickbox. A task can only be closed by recording what
                  happened, so the single action opens the log form.
                */}
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg",
                    urgency === "overdue"
                      ? "bg-destructive/12 text-destructive"
                      : urgency === "today"
                        ? "bg-warning/15 text-warning"
                        : "bg-accent/12 text-accent",
                  )}
                >
                  <ListChecks className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{a.task}</span>
                    {taskUrgencyLabel(a) && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px]",
                          URGENCY_STYLES[urgency],
                        )}
                      >
                        {taskUrgencyLabel(a)}
                      </span>
                    )}
                  </div>
                  {/* Full context, so nothing has to be opened */}
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    <div className="truncate font-medium text-foreground/80">
                      {companyName(a.companyId)}
                    </div>
                    {contact && (
                      <div className="truncate">
                        {contact.name} · {contact.role}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <Badge variant="outline" className="px-1.5 py-0">
                        {ACTIVITY_MAP[a.type].label}
                      </Badge>
                      {deal && (
                        <Badge variant="accent" className="px-1.5 py-0 font-mono text-[10px]">
                          {deal.id}
                        </Badge>
                      )}
                      <span>from {relativeTime(a.occurredAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-secondary text-[9px]">
                      {initials(a.owner)}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="xs" variant="outline" onClick={() => onComplete(a)}>
                    <PenLine />
                    Complete
                  </Button>
                </div>
              </div>
            </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Empty({ label = "No activities match your filters." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {tone === "danger" && <AlertTriangle className="size-3 text-destructive" />}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "warning" && value > 0 && "text-warning",
          tone === "danger" && value > 0 && "text-destructive",
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}
