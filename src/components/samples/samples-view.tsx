"use client";

import * as React from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Check,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import {
  SAMPLE_FOLLOWUP_DAYS,
  SAMPLE_OVERDUE_DAYS,
  buildSampleLedger,
  computeSampleRegisterStats,
  formatSampleDate,
  type SampleLedgerEntry,
} from "@/lib/samples";
import type { DealStage } from "@/lib/pipeline";
import { closePeriods, reopenPeriods } from "@/lib/deal-model";
import { useData } from "@/components/providers/data-provider";
import { useCompanies } from "@/components/companies/use-companies";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { DealDrawer } from "@/components/pipeline/deal-drawer";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  GiveSampleDialog,
  SampleDaysBadge,
  ScheduleSampleFollowUpDialog,
  TakeBackSampleDialog,
  type GiveSampleDialogTarget,
} from "./sample-dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterTab = "out" | "overdue" | "returned" | "all";
type SourceFilter = "all" | "deal" | "standalone";

export function SamplesView() {
  const {
    deals,
    customerSamples,
    companies,
    contacts,
    activities,
    loading,
    updateDeal,
    updateCustomerSample,
    cancelCustomerSample,
  } = useData();
  const { transitions, moveStage, dismissSuggestion } = useCompanies();

  const [tab, setTab] = React.useState<FilterTab>("out");
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);

  // Interactive popups & drawers right on the Samples Register page
  const [giveTarget, setGiveTarget] =
    React.useState<GiveSampleDialogTarget | null>(null);
  const [takeBackEntry, setTakeBackEntry] =
    React.useState<SampleLedgerEntry | null>(null);
  const [followUpEntry, setFollowUpEntry] =
    React.useState<SampleLedgerEntry | null>(null);
  const [openCompanyId, setOpenCompanyId] = React.useState<string | null>(null);
  const [openDealId, setOpenDealId] = React.useState<string | null>(null);

  const ledger = React.useMemo(
    () =>
      buildSampleLedger({
        deals,
        customerSamples,
        companies,
        contacts,
        activities,
      }),
    [deals, customerSamples, companies, contacts, activities],
  );

  const stats = React.useMemo(
    () => computeSampleRegisterStats(ledger),
    [ledger],
  );

  const owners = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of ledger) {
      if (e.owner) set.add(e.owner);
    }
    return Array.from(set).sort();
  }, [ledger]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledger.filter((e) => {
      if (tab === "out" && e.returnStatus !== "out") return false;
      if (
        tab === "overdue" &&
        !(e.returnStatus === "out" && e.daysWithCustomer >= SAMPLE_OVERDUE_DAYS)
      ) {
        return false;
      }
      if (
        tab === "returned" &&
        e.returnStatus !== "returned" &&
        e.returnStatus !== "consumable"
      ) {
        return false;
      }
      if (sourceFilter !== "all" && e.source !== sourceFilter) return false;
      if (ownerFilter !== "all" && e.owner !== ownerFilter) return false;

      if (q) {
        const hay = [
          e.product,
          e.brand,
          e.companyName,
          e.recipientLabel,
          e.dealId ?? "standalone",
          e.dealTitle ?? "",
          e.handoverNote,
          e.returnNote,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ledger, tab, sourceFilter, ownerFilter, search]);

  React.useEffect(() => {
    setPage(1);
  }, [tab, sourceFilter, ownerFilter, search, perPage]);

  const paged = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const activeCompany = React.useMemo(
    () => companies.find((c) => c.id === openCompanyId) ?? null,
    [companies, openCompanyId],
  );

  const activeDeal = React.useMemo(
    () => deals.find((d) => d.id === openDealId) ?? null,
    [deals, openDealId],
  );

  const handleMoveDealStage = React.useCallback(
    (dealId: string, nextStage: DealStage) => {
      const target = deals.find((d) => d.id === dealId);
      if (!target || target.stage === nextStage) return;
      const nowIso = new Date().toISOString();
      const wasClosed = target.stage === "won" || target.stage === "lost";
      const willClose = nextStage === "won" || nextStage === "lost";
      updateDeal(dealId, {
        stage: nextStage,
        closedFromStage: willClose
          ? wasClosed
            ? target.closedFromStage
            : target.stage
          : undefined,
        periods: willClose
          ? closePeriods(target.periods, nowIso)
          : wasClosed
            ? reopenPeriods(target.periods, nowIso)
            : target.periods,
        lastActivityAt: nowIso,
      });
    },
    [deals, updateDeal],
  );

  const handleUndoReturn = (entry: SampleLedgerEntry) => {
    if (entry.source === "deal" && entry.dealId && entry.lineId) {
      const deal = deals.find((d) => d.id === entry.dealId);
      if (!deal) return;
      updateDeal(deal.id, {
        lines: deal.lines.map((l) =>
          l.id === entry.lineId && l.sample
            ? {
                ...l,
                sample: {
                  ...l.sample,
                  returnedAt: null,
                  returnStatus: "out",
                },
              }
            : l,
        ),
      });
    } else if (entry.source === "standalone" && entry.standaloneId) {
      updateCustomerSample(entry.standaloneId, {
        returnedAt: null,
        returnStatus: "out",
      });
    }
  };

  if (loading && ledger.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-xl bg-secondary/60" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] animate-pulse rounded-2xl bg-secondary/60"
            />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-xl bg-secondary/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-secondary/60" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Samples Register"
        description="Every physical sample given to customers — when given, days with client, verdict, and when taken back."
        actions={
          <Button
            size="sm"
            onClick={() => setGiveTarget({ mode: "global" })}
          >
            <Plus className="size-4" />
            Give sample
          </Button>
        }
      />

      {/* 4 Clickable KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setTab("out")}
          className={cn(
            "rounded-2xl border p-4 text-left transition-colors",
            tab === "out"
              ? "border-accent bg-accent/[0.08]"
              : "border-border bg-card hover:border-accent/40",
          )}
        >
          <div className="text-xs font-semibold text-muted-foreground">
            With customer now
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
              {stats.outCount}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              active physical {stats.outCount === 1 ? "item" : "items"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTab("overdue")}
          className={cn(
            "rounded-2xl border p-4 text-left transition-colors",
            tab === "overdue"
              ? "border-destructive bg-destructive/[0.10]"
              : stats.overdueCount > 0
                ? "border-destructive/45 bg-destructive/[0.05] hover:border-destructive"
                : "border-border bg-card hover:border-accent/40",
          )}
        >
          <div className="flex items-center justify-between gap-1 text-xs font-semibold text-muted-foreground">
            <span>Overdue pickup ({SAMPLE_OVERDUE_DAYS}d+)</span>
            {stats.overdueCount > 0 && (
              <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
            )}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums sm:text-3xl",
                stats.overdueCount > 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {stats.overdueCount}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {stats.overdueCount > 0 ? "collect back now" : "none overdue"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTab("out")}
          className={cn(
            "rounded-2xl border p-4 text-left transition-colors",
            stats.followUpWindowCount > 0
              ? "border-warning/45 bg-warning/[0.05] hover:border-warning"
              : "border-border bg-card hover:border-accent/40",
          )}
        >
          <div className="text-xs font-semibold text-muted-foreground">
            Follow-up ({SAMPLE_FOLLOWUP_DAYS}–13d)
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-bold tabular-nums sm:text-3xl",
                stats.followUpWindowCount > 0
                  ? "text-warning"
                  : "text-foreground",
              )}
            >
              {stats.followUpWindowCount}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {stats.awaitingFeedbackCount} awaiting reply
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTab("returned")}
          className={cn(
            "rounded-2xl border p-4 text-left transition-colors",
            tab === "returned"
              ? "border-success bg-success/[0.10]"
              : "border-border bg-card hover:border-success/45",
          )}
        >
          <div className="text-xs font-semibold text-muted-foreground">
            Returned / closed
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-success sm:text-3xl">
              {stats.returnedCount + stats.consumableCount}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {stats.returnedCount > 0
                ? `avg ${stats.avgDaysHeld}d held`
                : "history log"}
            </span>
          </div>
        </button>
      </div>

      {/* Filter Bar: Tabs + Search + Source + Owner */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "out", label: `Out with customer (${stats.outCount})` },
              {
                id: "overdue",
                label: `Overdue ${SAMPLE_OVERDUE_DAYS}d+ (${stats.overdueCount})`,
              },
              {
                id: "returned",
                label: `Returned history (${stats.returnedCount + stats.consumableCount})`,
              },
              { id: "all", label: `All (${ledger.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === t.id
                  ? t.id === "overdue"
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, hotel, contact..."
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "deal", label: "Deals" },
                { id: "standalone", label: "Standalone" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSourceFilter(s.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  sourceFilter === s.id
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {owners.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  <Users className="size-3.5" />
                  {ownerFilter === "all" ? "All owners" : ownerFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by owner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOwnerFilter("all")}>
                  All owners
                </DropdownMenuItem>
                {owners.map((o) => (
                  <DropdownMenuItem
                    key={o}
                    onClick={() => setOwnerFilter(o)}
                  >
                    {o}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Package className="size-5" />
          </span>
          <p className="text-sm font-semibold">No samples match this view</p>
          <p className="max-w-md text-xs text-muted-foreground">
            {tab === "overdue"
              ? "Great news — no physical samples have been sitting with customers for 14+ days."
              : "Click + Give sample at the top right (or inside any Deal or Customer Card) to record a sample handover."}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop One-Pager Table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Sample Item &amp; Qty</th>
                    <th className="px-4 py-3">Customer &amp; Handed To</th>
                    <th className="px-4 py-3">Given / Returned Date</th>
                    <th className="px-4 py-3">Days With Client</th>
                    <th className="px-4 py-3">Deal / Verdict</th>
                    <th className="px-4 py-3 text-right">Custody / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {paged.map((entry) => {
                    const openFollowUp =
                      entry.followUpTask && !entry.followUpTask.taskDone
                        ? entry.followUpTask
                        : null;
                    return (
                      <tr
                        key={entry.key}
                        className="transition-colors hover:bg-secondary/20"
                      >
                        {/* 1. Item & Qty */}
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-semibold text-foreground">
                            {entry.product}{" "}
                            <span className="font-normal text-muted-foreground">
                              · {entry.sampleQty} {entry.unit}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {entry.brand && <span>{entry.brand}</span>}
                            {entry.dealId ? (
                              <button
                                type="button"
                                onClick={() => setOpenDealId(entry.dealId)}
                                className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent hover:underline"
                              >
                                {entry.dealId}
                              </button>
                            ) : (
                              <Badge
                                variant="outline"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                Standalone
                              </Badge>
                            )}
                          </div>
                          {entry.handoverNote && (
                            <p className="mt-1 max-w-xs break-words text-[11px] text-muted-foreground">
                              &ldquo;{entry.handoverNote}&rdquo;
                            </p>
                          )}
                          {entry.returnNote && (
                            <p className="mt-0.5 max-w-xs break-words text-[11px] text-success">
                              Back note: &ldquo;{entry.returnNote}&rdquo;
                            </p>
                          )}
                        </td>

                        {/* 2. Customer & Handed To */}
                        <td className="px-4 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={() => setOpenCompanyId(entry.companyId)}
                            className="inline-flex items-center gap-1.5 text-left font-semibold text-foreground hover:text-accent hover:underline"
                          >
                            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                            <span>{entry.companyName}</span>
                          </button>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Handed to: {entry.recipientLabel}
                          </div>
                        </td>

                        {/* 3. Given Date + Follow-Up */}
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-xs font-semibold tabular-nums text-foreground">
                            {formatSampleDate(entry.sentAt)}
                          </div>
                          {entry.returnStatus === "returned" &&
                            entry.returnedAt && (
                              <div className="mt-0.5 text-xs font-semibold tabular-nums text-success">
                                → Back {formatSampleDate(entry.returnedAt)}
                              </div>
                            )}
                          {entry.returnStatus === "out" && (
                            <div className="mt-1">
                              {openFollowUp ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                                  <CalendarClock className="size-3" />
                                  Due {formatSampleDate(openFollowUp.taskDueAt)}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setFollowUpEntry(entry)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground"
                                >
                                  <CalendarClock className="size-3" />
                                  + Follow-up
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. Days With Client */}
                        <td className="px-4 py-3.5 align-top">
                          <SampleDaysBadge entry={entry} />
                        </td>

                        {/* 5. Deal / Verdict */}
                        <td className="px-4 py-3.5 align-top">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              entry.verdictTone === "approved"
                                ? "bg-success/15 text-success"
                                : entry.verdictTone === "rejected"
                                  ? "bg-destructive/12 text-destructive"
                                  : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {entry.verdictTone === "approved" && (
                              <Check className="size-3" />
                            )}
                            {entry.verdictLabel}
                          </span>
                          {entry.dealAlertNote ? (
                            <div className="mt-1 text-[11px] font-semibold text-warning">
                              {entry.dealAlertNote}
                            </div>
                          ) : entry.dealStage ? (
                            <div className="mt-1 text-[11px] capitalize text-muted-foreground">
                              Stage: {entry.dealStage}
                            </div>
                          ) : null}
                        </td>

                        {/* 6. Custody / Action */}
                        <td className="px-4 py-3.5 text-right align-top">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            {entry.returnStatus === "out" ? (
                              <Button
                                size="xs"
                                className="h-8 bg-success text-xs text-success-foreground hover:bg-success/90"
                                onClick={() => setTakeBackEntry(entry)}
                              >
                                <PackageCheck className="size-3.5" />
                                Mark Taken Back
                              </Button>
                            ) : entry.returnStatus === "returned" ? (
                              <button
                                type="button"
                                onClick={() => handleUndoReturn(entry)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-secondary/30 px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                                title="Reopen as still out with customer"
                              >
                                <RotateCcw className="size-3" />
                                Undo
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() =>
                                setGiveTarget({ mode: "edit", entry })
                              }
                              className="inline-flex h-8 items-center rounded-lg border border-border px-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                              title="Edit sample record"
                            >
                              <Pencil className="size-3.5" />
                            </button>

                            {entry.source === "standalone" &&
                              entry.standaloneId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    cancelCustomerSample(entry.standaloneId!)
                                  }
                                  className="inline-flex h-8 items-center rounded-lg border border-border px-2 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                                  title="Remove standalone sample"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card List (< md) */}
          <div className="space-y-2.5 md:hidden">
            {paged.map((entry) => {
              const openFollowUp =
                entry.followUpTask && !entry.followUpTask.taskDone
                  ? entry.followUpTask
                  : null;
              return (
                <Card key={entry.key} className="space-y-2.5 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="break-words text-sm font-semibold">
                        {entry.product} ({entry.sampleQty} {entry.unit})
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenCompanyId(entry.companyId)}
                        className="mt-0.5 text-left text-xs font-medium text-accent hover:underline"
                      >
                        {entry.companyName}
                      </button>
                      <div className="text-[11px] text-muted-foreground">
                        To: {entry.recipientLabel}
                      </div>
                    </div>
                    <SampleDaysBadge entry={entry} compact />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Given:{" "}
                      <strong className="text-foreground">
                        {formatSampleDate(entry.sentAt)}
                      </strong>
                    </span>
                    {entry.returnedAt && (
                      <span className="font-semibold text-success">
                        → Back {formatSampleDate(entry.returnedAt)}
                      </span>
                    )}
                    {entry.dealId ? (
                      <button
                        type="button"
                        onClick={() => setOpenDealId(entry.dealId)}
                        className="rounded bg-accent/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent"
                      >
                        {entry.dealId}
                      </button>
                    ) : (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                        Standalone
                      </span>
                    )}
                  </div>

                  {entry.dealAlertNote && (
                    <div className="rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] font-semibold text-warning">
                      {entry.dealAlertNote}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                    {entry.returnStatus === "out" ? (
                      <Button
                        size="xs"
                        className="h-8 bg-success text-xs text-success-foreground hover:bg-success/90"
                        onClick={() => setTakeBackEntry(entry)}
                      >
                        <PackageCheck className="size-3.5" />
                        Mark Taken Back
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-success">
                        {entry.verdictLabel}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {entry.returnStatus === "out" &&
                        (openFollowUp ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-accent/35 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">
                            <CalendarClock className="size-3" />
                            {formatSampleDate(openFollowUp.taskDueAt)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setFollowUpEntry(entry)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[11px] text-muted-foreground"
                          >
                            <CalendarClock className="size-3" />
                            Follow-up
                          </button>
                        ))}

                      <button
                        type="button"
                        onClick={() => setGiveTarget({ mode: "edit", entry })}
                        className="inline-flex h-8 items-center rounded-lg border border-border px-2 text-muted-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(filtered.length / perPage))}
            total={filtered.length}
            pageSize={perPage}
            label="samples"
            compactMobile
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
          />
        </>
      )}

      {/* Shared Dialogs & Drawers */}
      <GiveSampleDialog
        target={giveTarget}
        onOpenChange={(o) => !o && setGiveTarget(null)}
      />

      <TakeBackSampleDialog
        entry={takeBackEntry}
        onOpenChange={(o) => !o && setTakeBackEntry(null)}
      />

      <ScheduleSampleFollowUpDialog
        entry={followUpEntry}
        onOpenChange={(o) => !o && setFollowUpEntry(null)}
      />

      <CompanyDrawer
        company={activeCompany}
        open={Boolean(activeCompany)}
        onOpenChange={(o) => !o && setOpenCompanyId(null)}
        transitions={transitions}
        onMoveStage={moveStage}
        onDismissSuggestion={dismissSuggestion}
      />

      <DealDrawer
        deal={activeDeal}
        open={Boolean(activeDeal)}
        onOpenChange={(o) => !o && setOpenDealId(null)}
        onMove={handleMoveDealStage}
      />
    </div>
  );
}
