"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  History,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { Company } from "@/lib/companies";
import { LEAD_STATUS_META } from "@/lib/companies";
import { SPANCOP_MAP, type SpancopStage, type StageTransition } from "@/lib/spancop";
import { alertFor, suggestionFor } from "./use-companies";
import { DrawerJournal } from "@/components/activities/drawer-journal";
import { useData } from "@/components/providers/data-provider";
import { NewCompanyDialog } from "./new-company-dialog";
import { SpancopStrip } from "./spancop-strip";
import { FollowUpCell } from "./follow-up-cell";
import {
  TransferHistory,
  type TransferHistoryEntry,
} from "./transfer-history";
import {
  Dialog,
  DialogContent,
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
  const [mobileTab, setMobileTab] = React.useState<MobileCompanyTab>(
    DEFAULT_MOBILE_COMPANY_TAB,
  );
  const [transfers, setTransfers] = React.useState<TransferHistoryEntry[]>([]);
  const [transfersLoading, setTransfersLoading] = React.useState(false);

  const { companies, updateCompanyWithContact, activitiesFor } = useData();
  const companyActivities = React.useMemo(
    () => (company ? activitiesFor({ companyId: company.id }) : []),
    [activitiesFor, company],
  );

  const customerId = company?.id;
  const companyOwner = company?.owner;

  React.useEffect(() => {
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

  const suggestion = suggestionFor(company);
  const hasSuggestion = suggestion.stage !== company.spancop;
  const alert = alertFor(company);
  const history = transitions.filter((t) => t.companyId === company.id);
  const totalHistoryCount = history.length + transfers.length;
  const lead = LEAD_STATUS_META[company.leadStatus];

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
            Keep
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
        Desktop (`lg+`): side-by-side customer record and activity journal.
        Mobile / tablet (`< lg`): single smooth vertical scroll with a compact
        above-the-fold overview (SPANCOP, Status + Follow-up, Primary contact,
        2×2 Details grid) and 2 tabs below (`Activity` | `Stage & Owner History`)
        so nothing is buried under competing scrollbars.
      */}
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-1.5rem)]">
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
              className="mr-1 flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
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
          </div>
        </DialogHeader>

        {/* Mobile / tablet layout (< lg): Option B — Compact Top Overview + 2 Tabs in 1 unified scroll */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:hidden">
          <div className="space-y-2.5 p-3.5 sm:p-4">
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

            {/* 2. Compact Lead Status + Next Follow-up single horizontal strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/20 px-3 py-2">
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
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8 text-xs"
                  asChild={Boolean(company.email)}
                  disabled={!company.email}
                >
                  {company.email ? (
                    <a href={`mailto:${company.email}`}>
                      <Mail />
                      Email
                    </a>
                  ) : (
                    <span>
                      <Mail />
                      Email
                    </span>
                  )}
                </Button>
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
              className="pt-0.5"
            >
              <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl bg-secondary p-1">
                <TabsTrigger
                  value="activity"
                  className="gap-1.5 px-2 text-xs font-semibold"
                >
                  <span>Activity</span>
                  <span className="text-[11px] opacity-80">
                    ({companyActivities.length})
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

              <TabsContent value="activity" className="mt-2.5">
                <div className="rounded-xl border border-border bg-card/40 p-3">
                  <DrawerJournal
                    activities={companyActivities}
                    scope="company"
                    companyId={company.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-2.5">
                <div className="space-y-3.5 rounded-xl border border-border bg-card/40 p-3">
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

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  asChild={Boolean(company.email)}
                  disabled={!company.email}
                >
                  {company.email ? (
                    <a href={`mailto:${company.email}`}>
                      <Mail />
                      Email
                    </a>
                  ) : (
                    <span>
                      <Mail />
                      Email
                    </span>
                  )}
                </Button>
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
