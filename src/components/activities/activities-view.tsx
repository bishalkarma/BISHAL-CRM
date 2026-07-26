"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  ListChecks,
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
import { DEAL_OWNERS } from "@/lib/deals";
import { useData } from "@/components/providers/data-provider";
import { ActivityRow } from "./activity-row";
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
  const { activities, companies, updateActivity, loading } = useData();

  const [view, setView] = React.useState<ViewMode>("timeline");
  const [query, setQuery] = React.useState("");
  const [types, setTypes] = React.useState<ActivityType[]>([]);
  const [owners, setOwners] = React.useState<string[]>([]);
  const [logOpen, setLogOpen] = React.useState(false);
  const [expandedCompanies, setExpandedCompanies] = React.useState<
    Record<string, boolean>
  >({});

  const counts = React.useMemo(() => taskCounts(activities), [activities]);

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

  const toggleTask = React.useCallback(
    (activity: Activity) =>
      updateActivity(activity.id, { taskDone: !activity.taskDone }),
    [updateActivity],
  );

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
        <Tile label="Logged" value={activities.length} hint="all time" />
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
        <TimelineView activities={filtered} onToggleTask={toggleTask} />
      ) : view === "by-customer" ? (
        <ByCustomerView
          activities={filtered}
          companyName={companyName}
          expanded={expandedCompanies}
          setExpanded={setExpandedCompanies}
          onToggleTask={toggleTask}
        />
      ) : (
        <OpenTasksView
          activities={filtered}
          companyName={companyName}
          onToggleTask={toggleTask}
        />
      )}

      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TimelineView({
  activities,
  onToggleTask,
}: {
  activities: Activity[];
  onToggleTask: (a: Activity) => void;
}) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, Activity[]>();
    sortByRecent(activities).forEach((a) => {
      const key = dateBucket(a.occurredAt);
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return [...map.entries()];
  }, [activities]);

  if (activities.length === 0) return <Empty />;

  return (
    <div className="space-y-4">
      {grouped.map(([bucket, items]) => (
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
                <ActivityRow activity={a} onToggleTask={onToggleTask} />
              </motion.div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

function ByCustomerView({
  activities,
  companyName,
  expanded,
  setExpanded,
  onToggleTask,
}: {
  activities: Activity[];
  companyName: (id: string) => string;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onToggleTask: (a: Activity) => void;
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
        const hidden = Math.max(list.length - 3, 0);
        const visible = isOpen ? list : list.slice(0, 3);
        return (
          <Card key={id} className="overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-border bg-secondary/40 px-4 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-xs font-semibold text-accent">
                {companyName(id).charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {companyName(id)}
              </span>
              <Badge variant="outline">{list.length}</Badge>
            </div>
            <div className="divide-y divide-border/60">
              {visible.map((a) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  showCompany={false}
                  onToggleTask={onToggleTask}
                />
              ))}
            </div>
            {hidden > 0 && (
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
                  ? "Hide earlier entries"
                  : `Show ${hidden} earlier ${hidden === 1 ? "entry" : "entries"}`}
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function OpenTasksView({
  activities,
  companyName,
  onToggleTask,
}: {
  activities: Activity[];
  companyName: (id: string) => string;
  onToggleTask: (a: Activity) => void;
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
      {tasks.map((a, i) => {
        const urgency = taskUrgency(a);
        const contact = contactById(a.contactId);
        const deal = a.dealId ? deals.find((d) => d.id === a.dealId) : null;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
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
                <button
                  onClick={() => onToggleTask(a)}
                  aria-label="Mark task as done"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-accent hover:bg-accent/10"
                />
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
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="bg-secondary text-[9px]">
                    {initials(a.owner)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Card>
          </motion.div>
        );
      })}
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
