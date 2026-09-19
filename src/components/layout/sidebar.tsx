"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Settings,
  Target,
} from "lucide-react";
import { NAV_SECTIONS } from "@/lib/navigation";
import { SPANCOP_MAP, SPANCOP_ORDER } from "@/lib/spancop";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatCurrency, initials } from "@/lib/utils";
import { useData } from "@/components/providers/data-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";

/** localStorage key for per-section collapsed state. */
const SECTION_KEY = "bishal-crm-sections";

type SectionState = Record<string, boolean>;

function loadSectionState(): SectionState {
  try {
    return JSON.parse(window.localStorage.getItem(SECTION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Count pending tasks and overdue follow-ups for the Today card. */
function useTodayStats() {
  const { activities, companies } = useData();
  return React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasks = activities.filter(
      (a) => a.task && !a.taskDone && a.taskDueAt && new Date(a.taskDueAt) <= today,
    ).length;
    const followUps = companies.filter(
      (c) => c.nextFollowUp && new Date(c.nextFollowUp) <= today,
    ).length;
    return { tasks, followUps };
  }, [activities, companies]);
}

/** Derive open-deal pipeline value and per-stage counts. */
function useDealPipelineStats() {
  const { deals } = useData();
  return React.useMemo(() => {
    const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const total = open.reduce((sum, d) => sum + d.value, 0);
    const byStage: Record<string, number> = {};
    PIPELINE_STAGES.forEach((s) => {
      byStage[s.shortLabel] = open.filter((d) => d.stage === s.id).length;
    });
    return { count: open.length, total, byStage };
  }, [deals]);
}

/** Derive per-SPANCOP-stage company counts. */
function useSpancopStats() {
  const { companies } = useData();
  return React.useMemo(() => {
    const counts: Record<string, number> = {};
    SPANCOP_ORDER.forEach((s) => {
      counts[s] = companies.filter((c) => c.spancop === s).length;
    });
    return counts;
  }, [companies]);
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  onOpenPopup,
  className,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onOpenPopup?: (popup: "today" | "pipeline") => void;
  className?: string;
}) {
  const pathname = usePathname();
  const today = useTodayStats();
  const pipeline = useDealPipelineStats();
  const spancop = useSpancopStats();
  const { user: currentUser } = useCurrentUser();

  const displayName = currentUser?.displayName ?? "User";
  const email = currentUser?.email ?? "";

  /* Persisted per-section collapse — defaults to all expanded. */
  const [sectionOpen, setSectionOpen] = React.useState<SectionState>(() => {
    const saved = loadSectionState();
    const initial: SectionState = {};
    NAV_SECTIONS.forEach((s) => {
      initial[s.title] = saved[s.title] ?? true;
    });
    return initial;
  });

  const toggleSection = React.useCallback((title: string) => {
    setSectionOpen((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        window.localStorage.setItem(SECTION_KEY, JSON.stringify(next));
      } catch {
        // Storage full or blocked — silently keep the UI state.
      }
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Collapsed state — icon rail only                                  */
  /* ---------------------------------------------------------------- */
  if (collapsed) {
    return (
      <aside
        className={cn(
          "flex h-full flex-col items-center border-r border-sidebar-border bg-sidebar",
          className,
        )}
      >
        {/* Logo + expand toggle */}
        <div className="flex h-16 w-full shrink-0 items-center justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-1">
            <Link href="/dashboard" onClick={onNavigate} aria-label="Dashboard">
              <Logo size={30} />
            </Link>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleCollapse}
                className="ml-0.5"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* New Deal */}
        <div className="py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => {
                  onNavigate?.();
                  window.location.href = "/pipeline";
                }}
                aria-label="New Deal"
                className="rounded-full"
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Deal</TooltipContent>
          </Tooltip>
        </div>

        {/* Icons only */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin px-2 py-1">
          {NAV_SECTIONS.map((section) =>
            section.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center justify-center rounded-lg p-2.5 transition-colors duration-200",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </Link>
              );
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }),
          )}
        </nav>

        {/* Avatar (collapsed) */}
        <div className="border-t border-sidebar-border py-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent/15 text-accent text-xs">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </aside>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Expanded state — card-segmented layout                           */
  /* ---------------------------------------------------------------- */
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0"
        >
          <Logo />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base font-semibold tracking-tight">
              Bishal Sales
            </div>
            <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              CRM
            </div>
          </div>
        </Link>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft />
          </Button>
        )}
      </div>

      {/* Primary action */}
      <div className="px-4 py-3">
        <Button
          className="w-full h-10 text-sm"
          onClick={() => {
            onNavigate?.();
            window.location.href = "/pipeline";
          }}
          aria-label="New Deal"
        >
          <Plus className="size-4" />
          <span>New Deal</span>
        </Button>
      </div>

      {/* Cards stack — fills sidebar with no empty space */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => {
          const open = sectionOpen[section.title] ?? true;
          return (
            <div
              key={section.title}
              className="rounded-xl border border-border/40 bg-secondary/30"
            >
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70 transition-colors hover:text-muted-foreground"
              >
                <span>{section.title}</span>
                {open ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>

              {/* Items */}
              {open && (
                <ul className="space-y-0.5 px-1.5 pb-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-colors duration-200",
                            active
                              ? "bg-accent/10 text-accent"
                              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-accent/10"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 34,
                              }}
                            />
                          )}
                          <Icon className="relative size-5 shrink-0" />
                          <span className="relative flex-1 truncate">
                            {item.label}
                          </span>
                          {item.soon && (
                            <Badge
                              variant="outline"
                              className="relative ml-auto px-1.5 py-0 text-[10px]"
                            >
                              Soon
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}

        {/* Today summary card — clickable to open detail popup */}
        <button
          type="button"
          onClick={() => onOpenPopup?.("today")}
          className="w-full cursor-pointer rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-2.5 text-left transition-colors hover:bg-accent/[0.10]"
        >
          <div className="flex items-center gap-1.5 pb-1.5">
            <CalendarClock className="size-3.5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Today
            </span>
          </div>
          <div className="space-y-1">
            {today.followUps > 0 && (
              <div className="flex items-center gap-2 text-[13px]">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">Follow-ups</span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {today.followUps}
                </span>
              </div>
            )}
            {today.tasks > 0 && (
              <div className="flex items-center gap-2 text-[13px]">
                <CheckSquare className="size-3.5 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">Tasks due</span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {today.tasks}
                </span>
              </div>
            )}
            {today.followUps === 0 && today.tasks === 0 && (
              <div className="text-[13px] text-muted-foreground/60">
                Nothing pending — you&apos;re all caught up.
              </div>
            )}
          </div>
        </button>

        {/* Pipeline Snapshot — clickable to open detail popup */}
        <button
          type="button"
          onClick={() => onOpenPopup?.("pipeline")}
          className="w-full cursor-pointer rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
        >
          <div className="flex items-center gap-1.5 pb-2">
            <Target className="size-3.5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Pipeline
            </span>
          </div>
          {/* Deal pipeline — open deals by stage */}
          <div className="mb-2">
            <div className="flex items-baseline justify-between pb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Open deals
              </span>
              <span className="text-[11px] tabular-nums font-semibold text-foreground">
                {pipeline.count} · {formatCurrency(pipeline.total)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              {PIPELINE_STAGES.map((stage) => {
                const count = pipeline.byStage[stage.shortLabel] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-0",
                      stage.tint,
                    )}
                    title={`${stage.label}: ${count}`}
                  >
                    <span className="text-sm font-bold tabular-nums leading-none">
                      {count}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium leading-none opacity-80 truncate max-w-[48px]">
                      {stage.shortLabel}
                    </span>
                  </div>
                );
              })}
              {pipeline.count === 0 && (
                <span className="text-[11px] text-muted-foreground/60">
                  No open deals
                </span>
              )}
            </div>
          </div>
          {/* SPANCOP — customers by relationship stage */}
          <div>
            <div className="flex items-baseline justify-between pb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Customers
              </span>
              <Link
                href="/companies"
                className="text-[11px] font-medium text-accent hover:underline"
              >
                All →
              </Link>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              {SPANCOP_ORDER.map((stage) => {
                const count = spancop[stage] ?? 0;
                if (count === 0) return null;
                const def = SPANCOP_MAP[stage];
                return (
                  <div
                    key={stage}
                    className={cn(
                      "flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-0",
                      def.tint,
                    )}
                    title={`${def.label}: ${count}`}
                  >
                    <span className="text-sm font-bold tabular-nums leading-none">
                      {count}
                    </span>
                    <span className="mt-0.5 text-[10px] font-medium leading-none opacity-80">
                      {def.letter}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </button>
      </div>

      {/* User profile card — anchored at the bottom */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/30 px-3 py-2.5 transition-colors hover:bg-secondary/50"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-accent/15 text-accent text-xs font-semibold">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {displayName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {email}
            </div>
          </div>
          <Settings className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>
    </aside>
  );
}
