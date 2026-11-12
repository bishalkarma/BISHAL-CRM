"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  History,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { Activity } from "@/lib/activities";
import type { Company } from "@/lib/companies";
import { LEAD_STATUS_META } from "@/lib/companies";
import { SPANCOP_MAP, type SpancopStage, type StageTransition } from "@/lib/spancop";
import {
  alertFor,
  suggestionFor,
  useDismissedSuggestions,
} from "./use-companies";
import { isSuggestionDismissed } from "@/lib/spancop-dismissals";
import { evaluateCustomerDeletePermission } from "@/lib/company-guards";
import {
  formatOpenTaskMeta,
  openTasksForCompany,
} from "@/lib/customer-followups";
import { DrawerJournal } from "@/components/activities/drawer-journal";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { useData } from "@/components/providers/data-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NewCompanyDialog } from "./new-company-dialog";
import { SpancopStrip } from "./spancop-strip";
import { FollowUpCell } from "./follow-up-cell";
import { CustomerSampleCustody } from "@/components/samples/customer-sample-custody";
import {
  TransferHistory,
  type TransferHistoryEntry,
} from "./transfer-history";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatCurrency, initials, relativeTime } from "@/lib/utils";

export type MobileCompanyTab = "activity" | "history";
export const DEFAULT_MOBILE_COMPANY_TAB: MobileCompanyTab = "activity";

export function CompanyDrawer({
  company,
  transitions,
  open,
  onOpenChange,
  onMoveStage,
  onDismissSuggestion,
}: {
  company: Company | null;
  transitions: StageTransition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveStage: (
    id: string,
    to: SpancopStage,
    reason: string,
    trigger: "manual" | "accepted-suggestion",
  ) => void;
  onDismissSuggestion: (id: string, stage: SpancopStage) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [completingTask, setCompletingTask] = React.useState<Activity | null>(
    null,
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [mobileTab, setMobileTab] = React.useState<MobileCompanyTab>(
    DEFAULT_MOBILE_COMPANY_TAB,
  );
  const [transfers, setTransfers] = React.useState<TransferHistoryEntry[]>([]);
  const [transfersLoading, setTransfersLoading] = React.useState(false);
  const [dismissed] = useDismissedSuggestions();
  const { user: currentUser } = useCurrentUser();

  const {
    companies,
    deals,
    source,
    contactsFor,
    updateCompanyWithContact,
    deleteCompany,
    activitiesFor,
  } = useData();
  const companyActivities = React.useMemo(
    () => (company ? activitiesFor({ companyId: company.id }) : []),
    [activitiesFor, company],
  );
  const companyContacts = React.useMemo(
    () => (company ? contactsFor(company.id) : []),
    [contactsFor, company],
  );
  const companyDeals = React.useMemo(
    () => (company ? deals.filter((d) => d.companyId === company.id) : []),
    [deals, company],
  );
  const openTasks = React.useMemo(
    () =>
      company ? openTasksForCompany(company.id, companyActivities) : [],
    [company, companyActivities],
  );

  const customerId = company?.id;
  const companyOwner = company?.owner;

  React.useEffect(() => {
    setCompletingTask(null);
    setConfirmDeleteOpen(false);
    setDeleteError(null);
    setMobileTab(DEFAULT_MOBILE_COMPANY_TAB);
  }, [customerId]);

  React.useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    setTransfersLoading(true);

    const fetchTransfers = async () => {
      try {
        const res = await fetch(
          `/api/transfer-history?customer_id=${encodeURIComponent(customerId)}`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setTransfers(data.transfers || []);
        }
      } catch (err) {
        console.error("Failed to fetch transfer history:", err);
      } finally {
        if (!cancelled) {
          setTransfersLoading(false);
        }
      }
    };

    fetchTransfers();
    return () => {
      cancelled = true;
    };
  }, [open, customerId, companyOwner]);

  if (!company) return null;

  const storedRole =
    typeof window !== "undefined"
      ? sessionStorage.getItem("demo_user_role")
      : null;
  const storedUserId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("demo_user_id")
      : null;
  const storedDisplayName =
    typeof window !== "undefined"
      ? sessionStorage.getItem("demo_display_name") ??
        sessionStorage.getItem("demo_user")
      : null;

  const effectiveRole =
    currentUser?.roleName ||
    storedRole ||
    (source === "demo" ? "Admin" : "Viewer");
  const effectiveUserId = currentUser?.id || storedUserId;
  const effectiveDisplayName = currentUser?.displayName || storedDisplayName;

  const isDirectOwner =
    Boolean(effectiveUserId && company.owner_id === effectiveUserId) ||
    Boolean(
      !company.owner_id &&
        effectiveDisplayName &&
        company.owner.toLowerCase() === effectiveDisplayName.toLowerCase(),
    );

  const isOwnerOrTeam =
    effectiveRole === "Admin" ||
    isDirectOwner ||
    (effectiveRole === "Manager" &&
      source === "supabase" &&
      companies.some((c) => c.id === company.id));

  const deletePermission = evaluateCustomerDeletePermission({
    role: effectiveRole,
    isOwnerOrTeam,
    dealCount: companyDeals.length,
  });

  const handleConfirmDelete = async () => {
    if (!deletePermission.allowed || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteCompany(company.id);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error ?? "Could not delete customer.");
      return;
    }
    setConfirmDeleteOpen(false);
    onOpenChange(false);
  };

  const suggestion = suggestionFor(company, deals);
  const hasSuggestion =
    suggestion.stage !== company.spancop &&
    !isSuggestionDismissed(company, companyActivities, dismissed);
  const alert = alertFor(company);
  const history = transitions.filter((t) => t.companyId === company.id);
  const totalHistoryCount = history.length + transfers.length;
  const lead = LEAD_STATUS_META[company.leadStatus];
  const primaryOpenTask = openTasks[0] ?? null;
  const primaryTaskMeta = primaryOpenTask
    ? formatOpenTaskMeta(primaryOpenTask)
    : null;

  const renderOpenTaskBar = (compact = false) =>
    primaryOpenTask && primaryTaskMeta ? (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-accent/35 bg-background/70",
          compact ? "px-2.5 py-2" : "mt-3 p-3",
        )}
      >
        <button
          type="button"
          onClick={() => setCompletingTask(primaryOpenTask)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-success/45 bg-success/12 px-2.5 py-1.5 text-[11px] font-semibold text-success transition-colors hover:bg-success/20"
        >
          <Check className="size-3" />
          Done
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                primaryTaskMeta.urgency === "overdue"
                  ? "text-destructive"
                  : primaryTaskMeta.urgency === "today"
                    ? "text-warning"
                    : "text-accent",
              )}
            >
              {primaryTaskMeta.eyebrow}
            </span>
            {openTasks.length > 1 && (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                +{openTasks.length - 1} more
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 break-words text-xs font-semibold leading-snug text-foreground">
            {primaryOpenTask.task}
          </p>
        </div>
      </div>
    ) : null;

  const renderSuggestionBanner = (compact = false) =>
    hasSuggestion ? (
      <div
        className={cn(
          "rounded-xl border border-accent/40 bg-accent/[0.06]",
          compact ? "p-3" : "p-3.5",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 font-medium",
            compact ? "text-xs sm:text-sm" : "text-sm",
          )}
        >
          <Sparkles className="size-4 shrink-0 text-accent" />
          <span className="truncate">
            Suggested: {SPANCOP_MAP[company.spancop].label}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {SPANCOP_MAP[suggestion.stage].label}
          </span>
        </div>
        <p className="mt-1 break-words text-xs text-muted-foreground">
          {suggestion.reason}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            size={compact ? "xs" : "sm"}
            className={compact ? "h-8 text-xs" : undefined}
            onClick={() =>
              onMoveStage(
                company.id,
                suggestion.stage,
                suggestion.reason,
                "accepted-suggestion",
              )
            }
          >
            <Check />
            Move to {SPANCOP_MAP[suggestion.stage].label}
          </Button>
          <Button
            size={compact ? "xs" : "sm"}
            variant="outline"
            className={compact ? "h-8 text-xs" : undefined}
            onClick={() => onDismissSuggestion(company.id, suggestion.stage)}
          >
            <X />
            Keep {SPANCOP_MAP[company.spancop].label}
          </Button>
        </div>
      </div>
    ) : null;

  const renderAlertBanner = () =>
    alert ? (
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-xl border p-3",
          alert.kind === "reorder-gap"
            ? "border-destructive/40 bg-destructive/[0.06]"
            : "border-warning/40 bg-warning/[0.07]",
        )}
      >
        <AlertTriangle
          className={cn(
            "mt-0.5 size-4 shrink-0",
            alert.kind === "reorder-gap" ? "text-destructive" : "text-warning",
          )}
        />
        <div className="min-w-0 text-sm">
          <div className="font-medium">{alert.label}</div>
          <div className="text-xs text-muted-foreground">{alert.detail}</div>
        </div>
      </div>
    ) : null;

  const renderStageHistoryList = (showCount = false) => (
    <div>
      <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Stage history{showCount && history.length > 0 ? ` · ${history.length}` : ""}
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No stage changes recorded yet.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {history.map((t) => (
            <li key={t.id} className="flex gap-2.5 text-xs">
              <span
                className={cn(
                  "mt-1 size-1.5 shrink-0 rounded-full",
                  SPANCOP_MAP[t.to].color,
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {t.from ? `${SPANCOP_MAP[t.from].label} → ` : ""}
                  {SPANCOP_MAP[t.to].label}
                </div>
                <div className="break-words text-muted-foreground">
                  {t.reason} · {relativeTime(t.at)} · {t.by}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        BUILD 18.10: Fixed viewport height (`h-[88dvh]` mobile / `lg:h-[86vh]` desktop)
        so switching between `Activity` and `Stage & Owner History` never resizes
        or jumps the card on screen.
      */}
      <DialogContent className="flex h-[88dvh] max-h-[88dvh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-1.5rem)] lg:h-[86vh] lg:max-h-[86vh]">
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border p-3.5 pr-10 text-left sm:p-4 sm:pr-11 lg:p-5 lg:pr-12">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent lg:size-10">
              {company.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm sm:text-base">
                {company.name}
              </DialogTitle>
              <div className="truncate text-xs text-muted-foreground">
                {company.cluster && company.cluster !== "Independent"
                  ? `${company.cluster} · `
                  : ""}
                {company.area}, {company.emirate}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 lg:pt-1">
            {/* Corrections happen here, in the record you are already reading. */}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mr-0.5 flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
            >
              <Pencil className="size-3" />
              Edit
            </button>
            <Badge variant="outline" className="gap-1">
              <Building2 />
              {company.business}
            </Badge>
            <Badge variant="accent">{company.type}</Badge>
            {company.hasEverOrdered && (
              <Badge variant="success">
                Customer · {formatCurrency(company.lifetimeValue)}
              </Badge>
            )}
            {deletePermission.canSeeButton && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmDeleteOpen(true);
                }}
                className="ml-auto flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/[0.08] px-2.5 py-1 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive/15"
              >
                <Trash2 className="size-3" />
                Delete
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Mobile / tablet layout (< lg): Option B — Compact Top Overview + 2 Tabs in 1 unified scroll */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:hidden">
          <div className="flex flex-1 flex-col space-y-2.5 p-3.5 sm:p-4">
            {/* 1. Compact SPANCOP card */}
            <div className="rounded-xl border border-border bg-secondary/20 p-2.5">
              <div className="flex items-center justify-between gap-2 pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  SPANCOP
                </span>
                <span className="truncate text-[11px] font-medium text-muted-foreground">
                  {SPANCOP_MAP[company.spancop].label} ·{" "}
                  {relativeTime(company.spancopSince)}
                </span>
              </div>
              <SpancopStrip stage={company.spancop} />
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {SPANCOP_MAP[company.spancop].description}
              </p>
            </div>

            {renderSuggestionBanner(true)}
            {renderAlertBanner()}

            {/* 2. Compact Lead Status + Next Follow-up (+ Open Task bar when open task exists) */}
            <div
              className={cn(
                "rounded-xl border px-3 py-2",
                openTasks.length > 0
                  ? "space-y-2 border-success/40 bg-accent/[0.04]"
                  : "border-border bg-secondary/20",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Status
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      lead.tint,
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", lead.dot)} />
                    {lead.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Follow-up
                  </span>
                  <FollowUpCell date={company.nextFollowUp} compact />
                </div>
              </div>
              {openTasks.length > 0 && (
                <div className="border-t border-border/60 pt-2">
                  {renderOpenTaskBar(true)}
                </div>
              )}
            </div>

            {/* 2b. Customer Sample Custody (Deal + Standalone samples) */}
            <CustomerSampleCustody companyId={company.id} compact />

            {/* 3. Compact Primary Contact + Quick Actions */}
            <div className="rounded-xl border border-border bg-secondary/20 p-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-[11px]">
                    {initials(company.contactName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold sm:text-sm">
                    {company.contactName}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {company.contactRole}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Contact
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <Button variant="outline" size="xs" className="h-8 text-xs" asChild>
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`}>
                    <Phone />
                    Call
                  </a>
                </Button>
                <Button variant="outline" size="xs" className="h-8 text-xs" asChild>
                  <a
                    href={`https://wa.me/${company.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    WhatsApp
                  </a>
                </Button>
                {company.email ? (
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-8 text-xs"
                    asChild
                  >
                    <a href={`mailto:${company.email}`}>
                      <Mail />
                      Email
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-8 text-xs"
                    disabled
                  >
                    <Mail />
                    Email
                  </Button>
                )}
              </div>
            </div>

            {/* 4. Compact 2×2 Key Details Grid (Owner, Lead source, Location, Last activity) */}
            <dl className="grid grid-cols-2 gap-1.5">
              <DetailCell icon={User} label="Owner" value={company.owner} />
              <DetailCell
                icon={Building2}
                label="Lead source"
                value={company.leadSource}
              />
              <DetailCell
                icon={MapPin}
                label="Location"
                value={`${company.area}, ${company.emirate}`}
              />
              <DetailCell
                icon={History}
                label="Last activity"
                value={
                  company.lastActivityAt
                    ? relativeTime(company.lastActivityAt)
                    : "No activity yet"
                }
              />
            </dl>

            {company.remarks && (
              <div className="break-words rounded-xl bg-secondary/50 px-3 py-2 text-xs leading-snug text-muted-foreground">
                {company.remarks}
              </div>
            )}

            {/* 5. Two-tab switcher: Activity | Stage & Owner History */}
            <Tabs
              value={mobileTab}
              onValueChange={(value) =>
                setMobileTab(value as MobileCompanyTab)
              }
              className="flex flex-1 flex-col pt-0.5"
            >
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-secondary p-1">
                <TabsTrigger
                  value="activity"
                  className="gap-1.5 px-2 text-xs font-semibold"
                >
                  <span>Activity</span>
                  <span className="text-[11px] opacity-80">
                    ({companyActivities.length})
                    {openTasks.length > 0
                      ? ` · ${openTasks.length} ${openTasks.length === 1 ? "task" : "tasks"}`
                      : ""}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="gap-1 px-2 text-xs font-semibold"
                >
                  <span className="truncate">Stage &amp; Owner History</span>
                  {totalHistoryCount > 0 && (
                    <span className="shrink-0 text-[11px] opacity-80">
                      ({totalHistoryCount})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-2.5 flex-1">
                <div className="h-full rounded-xl border border-border bg-card/40 p-3">
                  <DrawerJournal
                    activities={companyActivities}
                    scope="company"
                    companyId={company.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-2.5 flex-1">
                <div className="h-full space-y-3.5 rounded-xl border border-border bg-card/40 p-3">
                  {renderStageHistoryList(true)}
                  <Separator />
                  <TransferHistory
                    customerId={company.id}
                    entries={transfers}
                    loading={transfersLoading}
                    showEmpty
                    compact
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Pinned mobile bottom Close bar so card height stays completely steady */}
        <div className="shrink-0 border-t border-border bg-popover/95 px-3.5 py-2.5 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>

        {/* Desktop layout (lg+): original 2-column side-by-side record + journal */}
        <div className="hidden min-h-0 flex-1 gap-0 overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5 overflow-y-auto p-5 lg:border-r lg:border-border">
            {/* SPANCOP */}
            <div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  SPANCOP
                </span>
                <span className="text-xs text-muted-foreground">
                  {SPANCOP_MAP[company.spancop].label} ·{" "}
                  {relativeTime(company.spancopSince)}
                </span>
              </div>
              <SpancopStrip stage={company.spancop} />
              <p className="mt-2 text-xs text-muted-foreground">
                {SPANCOP_MAP[company.spancop].description}
              </p>
            </div>

            {renderSuggestionBanner(false)}
            {renderAlertBanner()}

            <Separator />

            {/* Prioritisation — both models shown for comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Lead status
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    lead.tint,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", lead.dot)} />
                  {lead.label}
                </span>
              </div>
              <div>
                <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Next follow-up
                </div>
                <FollowUpCell date={company.nextFollowUp} />
              </div>
            </div>

            {renderOpenTaskBar(false)}

            <CustomerSampleCustody companyId={company.id} />

            <Separator />

            {/* Contact */}
            <div>
              <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Primary contact
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-secondary text-xs">
                    {initials(company.contactName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {company.contactName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {company.contactRole}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`}>
                    <Phone />
                    Call
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://wa.me/${company.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle />
                    WhatsApp
                  </a>
                </Button>
                {company.email ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${company.email}`}>
                      <Mail />
                      Email
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <Mail />
                    Email
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Details */}
            <dl className="space-y-2.5 text-sm">
              <Row
                icon={MapPin}
                label="Location"
                value={`${company.area}, ${company.emirate}`}
              />
              <Row icon={User} label="Owner" value={company.owner} />
              <Row
                icon={Building2}
                label="Lead source"
                value={company.leadSource}
              />
              {company.lastActivityAt && (
                <Row
                  icon={History}
                  label="Last activity"
                  value={relativeTime(company.lastActivityAt)}
                />
              )}
            </dl>

            {company.remarks && (
              <div className="break-words rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
                {company.remarks}
              </div>
            )}

            <Separator />

            {/* Stage history — the basis of period-flow reporting */}
            {renderStageHistoryList(false)}

            <Separator />

            {/* Transfer history — ownership changes */}
            <TransferHistory
              customerId={company.id}
              entries={transfers}
              loading={transfersLoading}
            />
          </div>

          {/*
            Every activity for this customer, across all deals — the widest of
            the three scopes, so it keeps the full summary and risk flag.
          */}
          <div className="overflow-y-auto p-5">
            <DrawerJournal
              activities={companyActivities}
              scope="company"
              companyId={company.id}
            />
          </div>
        </div>
      </DialogContent>

      {/* Safe Delete Customer Confirmation Modal (BUILD 18.10 Option A) */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md border-destructive/40 p-5">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <Trash2 className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-base">
                  Delete customer?
                </DialogTitle>
                <DialogDescription className="text-xs">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/35 bg-destructive/[0.06] p-3 text-xs">
              <div className="break-words text-sm font-semibold text-foreground">
                {company.name}
              </div>
              <div className="mt-0.5 text-muted-foreground">
                {company.area}, {company.emirate} · Owner: {company.owner}
              </div>
              <div className="mt-2 font-medium text-muted-foreground">
                Will also remove linked records:
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-foreground">
                <span>
                  • {companyContacts.length}{" "}
                  {companyContacts.length === 1 ? "Contact" : "Contacts"}
                </span>
                <span>
                  • {companyActivities.length}{" "}
                  {companyActivities.length === 1 ? "Activity" : "Activities"}
                </span>
                <span>
                  • {companyDeals.length}{" "}
                  {companyDeals.length === 1 ? "Deal" : "Deals"}
                </span>
                <span>• History logs</span>
              </div>
            </div>

            {!deletePermission.allowed && deletePermission.reason && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{deletePermission.reason}</span>
              </div>
            )}

            {deletePermission.allowed && companyDeals.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Warning: {companyDeals.length} linked{" "}
                  {companyDeals.length === 1 ? "deal" : "deals"} and their
                  product lines will also be permanently deleted.
                </span>
              </div>
            )}

            {deleteError && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
                {deleteError}
              </div>
            )}
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!deletePermission.allowed || deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 />
                  Delete customer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reuses the create form, pre-filled. Saving writes the company and
          its primary contact together so the two copies cannot disagree. */}
      <NewCompanyDialog
        open={editing}
        onOpenChange={setEditing}
        editing={company}
        onCreate={() => {}}
        onSaveEdit={(patch) =>
          updateCompanyWithContact(company.id, patch, {
            name: patch.contactName ?? company.contactName,
            role: patch.contactRole ?? company.contactRole,
            email: patch.email ?? company.email,
            phone: patch.phone ?? company.phone,
            whatsappSameAsPhone:
              patch.whatsappSameAsPhone ?? company.whatsappSameAsPhone,
          })
        }
        existingNames={companies.map((c) => c.name)}
      />

      {/* Closes the open task loop directly from the customer popup (Option B) */}
      <LogActivityDialog
        open={Boolean(completingTask)}
        onOpenChange={(o) => {
          if (!o) setCompletingTask(null);
        }}
        completing={completingTask}
      />
    </Dialog>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 px-2.5 py-2">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
        <Icon className="size-3 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-0.5 truncate text-xs font-medium text-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{value}</dd>
    </div>
  );
}
