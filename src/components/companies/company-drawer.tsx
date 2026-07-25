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
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { Company } from "@/lib/companies";
import { LEAD_STATUS_META } from "@/lib/companies";
import { SPANCOP_MAP, type SpancopStage, type StageTransition } from "@/lib/spancop";
import { alertFor, suggestionFor } from "./use-companies";
import { SpancopStrip } from "./spancop-strip";
import { FollowUpCell } from "./follow-up-cell";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatCurrency, initials, relativeTime } from "@/lib/utils";

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
  if (!company) return null;

  const suggestion = suggestionFor(company);
  const hasSuggestion = suggestion.stage !== company.spancop;
  const alert = alertFor(company);
  const history = transitions.filter((t) => t.companyId === company.id);
  const lead = LEAD_STATUS_META[company.leadStatus];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-5 pr-12">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent">
              {company.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">
                {company.name}
              </SheetTitle>
              <div className="truncate text-xs text-muted-foreground">
                {company.cluster && company.cluster !== "Independent"
                  ? `${company.cluster} · `
                  : ""}
                {company.area}, {company.emirate}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
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
        </SheetHeader>

        <div className="space-y-5 p-5">
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

          {/* Suggestion — never auto-applied */}
          {hasSuggestion && (
            <div className="rounded-xl border border-accent/40 bg-accent/[0.06] p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-accent" />
                Suggested: {SPANCOP_MAP[company.spancop].label}
                <ArrowRight className="size-3.5 text-muted-foreground" />
                {SPANCOP_MAP[suggestion.stage].label}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {suggestion.reason}
              </p>
              <div className="mt-2.5 flex gap-2">
                <Button
                  size="sm"
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
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onDismissSuggestion(company.id, suggestion.stage)
                  }
                >
                  <X />
                  Keep
                </Button>
              </div>
            </div>
          )}

          {alert && (
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
                  alert.kind === "reorder-gap"
                    ? "text-destructive"
                    : "text-warning",
                )}
              />
              <div className="min-w-0 text-sm">
                <div className="font-medium">{alert.label}</div>
                <div className="text-xs text-muted-foreground">
                  {alert.detail}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Prioritisation — both models shown for comparison */}
          <div className="grid grid-cols-2 gap-3">
            {(
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
            )}
            {(
              <div>
                <div className="pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Next follow-up
                </div>
                <FollowUpCell date={company.nextFollowUp} />
              </div>
            )}
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
            <Row icon={MapPin} label="Location" value={`${company.area}, ${company.emirate}`} />
            <Row icon={User} label="Owner" value={company.owner} />
            <Row icon={Building2} label="Lead source" value={company.leadSource} />
            {company.lastActivityAt && (
              <Row
                icon={History}
                label="Last activity"
                value={relativeTime(company.lastActivityAt)}
              />
            )}
          </dl>

          {company.remarks && (
            <div className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
              {company.remarks}
            </div>
          )}

          <Separator />

          {/* Stage history — the basis of period-flow reporting */}
          <div>
            <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Stage history
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
                      <div className="text-muted-foreground">
                        {t.reason} · {relativeTime(t.at)} · {t.by}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
