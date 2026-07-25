"use client";

import * as React from "react";
import {
  Building2,
  Check,
  CalendarClock,
  Clock,
  MapPin,
  Package,
  PauseCircle,
  RotateCcw,
  Tag,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import type { Deal } from "@/lib/deals";
import {
  PIPELINE_STAGES,
  CLOSED_STAGES,
  STAGE_MAP,
  daysSince,
  type DealStage,
} from "@/lib/pipeline";
import { CURRENCIES } from "@/lib/currency";

import {
  LINE_STATUS_META,
  activeDays,
  currentRunDays,
  daysToFeedback,
  dormantDays,
  isReopened,
  lineTotal,
  quotedValue,
  rejectedValue,
} from "@/lib/deal-model";
import { useCurrency } from "@/components/providers/currency-provider";
import { useData } from "@/components/providers/data-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials, relativeTime } from "@/lib/utils";

export function DealDrawer({
  deal,
  open,
  onOpenChange,
  onMove,
  onEditLostReason,
}: {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (dealId: string, stage: DealStage) => void;
  onEditLostReason?: (deal: Deal) => void;
}) {
  const { display, toDisplay, format } = useCurrency();
  const { contactById } = useData();
  if (!deal) return null;

  const probability = deal.probability ?? STAGE_MAP[deal.stage].probability;
  const converted = toDisplay(deal.value, deal.currency);
  const isForeign = deal.currency !== display;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-5 pr-12">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px]">
              {deal.id}
            </Badge>
            <Badge className={cn("gap-1.5", STAGE_MAP[deal.stage].tint)}>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  STAGE_MAP[deal.stage].color,
                )}
              />
              {STAGE_MAP[deal.stage].label}
            </Badge>
            {deal.onHold && (
              <Badge variant="warning" className="gap-1">
                <PauseCircle />
                On hold
              </Badge>
            )}
            {isReopened(deal.periods) && (
              <Badge variant="info" className="gap-1">
                <RotateCcw />
                Reopened
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg leading-snug">{deal.title}</SheetTitle>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-3.5" />
            {deal.company}
            <span aria-hidden>·</span>
            <span>{deal.accountType}</span>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-5">
          {/* Value */}
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Deal value
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {format(converted)}
            </div>
            {isForeign && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                Booked in {CURRENCIES[deal.currency].symbol}{" "}
                {new Intl.NumberFormat("en-US").format(deal.value)}{" "}
                {deal.currency}
              </div>
            )}
            {rejectedValue(deal.lines) > 0 && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {CURRENCIES[deal.currency].symbol}{" "}
                {new Intl.NumberFormat("en-US").format(
                  rejectedValue(deal.lines),
                )}{" "}
                not taken · quoted{" "}
                {new Intl.NumberFormat("en-US").format(quotedValue(deal.lines))}
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>
                <strong className="font-medium text-foreground">
                  {activeDays(deal.periods)}
                </strong>{" "}
                active days
              </span>
              {isReopened(deal.periods) && (
                <>
                  <span>
                    {currentRunDays(deal.periods)} in current run
                  </span>
                  <span>{dormantDays(deal.periods)} dormant, excluded</span>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${probability}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums">
                {probability}%
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3" />
              Weighted: {format(converted * (probability / 100))}
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-baseline justify-between pb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Line items
              </span>
              <span className="text-[11px] text-muted-foreground">
                {deal.lines.length}{" "}
                {deal.lines.length === 1 ? "product" : "products"}
              </span>
            </div>
            <ul className="space-y-1.5">
              {deal.lines.map((item) => {
                const meta = LINE_STATUS_META[item.status];
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-lg border border-border p-2.5",
                      item.status === "rejected" && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-sm font-medium",
                            item.status === "rejected" && "line-through",
                          )}
                        >
                          {item.product}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.brand && `${item.brand} · `}
                          {item.quantity} {item.unit} ×{" "}
                          {new Intl.NumberFormat("en-US", {
                            maximumFractionDigits: 2,
                          }).format(item.unitPrice)}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold tabular-nums">
                          {new Intl.NumberFormat("en-US", {
                            maximumFractionDigits: 0,
                          }).format(lineTotal(item))}
                        </div>
                        <span
                          className={cn(
                            "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                            meta.tint,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    {item.rejectReason && (
                      <div className="mt-1 text-[10px] text-destructive">
                        {item.rejectReason}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <Separator />

          {/* Contacts — who sent it vs who we deal with now */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Enquiry from
              </div>
              <div className="text-sm font-medium">
                {contactById(deal.enquiryFromId)?.name ?? "—"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {contactById(deal.enquiryFromId)?.role}
              </div>
            </div>
            <div>
              <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Current contact
              </div>
              <div className="text-sm font-medium">
                {contactById(deal.currentContactId)?.name ?? "—"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {contactById(deal.currentContactId)?.role}
              </div>
            </div>
          </div>

          {/* Working notes */}
          {(deal.nextAction || deal.task) && (
            <>
              <Separator />
              <div className="space-y-2.5">
                {deal.nextAction && (
                  <div>
                    <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Next action — from the client
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {deal.nextAction}
                    </p>
                  </div>
                )}
                {deal.task && (
                  <div>
                    <div className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Our task
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-2.5">
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          deal.taskDone
                            ? "border-success bg-success text-success-foreground"
                            : "border-border",
                        )}
                      >
                        {deal.taskDone && <Check className="size-3" />}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          deal.taskDone && "text-muted-foreground line-through",
                        )}
                      >
                        {deal.task}
                      </span>
                      {deal.taskDueDate && !deal.taskDone && (
                        <Badge
                          variant={
                            new Date(deal.taskDueDate) < new Date()
                              ? "destructive"
                              : "outline"
                          }
                          className="shrink-0"
                        >
                          {relativeTime(deal.taskDueDate)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Stage-gated: sample tracking appears only from Sampling on */}
          {deal.sample && (
            <>
              <Separator />
              <div>
                <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Sample tracking
                </div>
                <div className="space-y-1.5 rounded-xl border border-chart-5/40 bg-chart-5/[0.06] p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="size-3.5 shrink-0 text-chart-5" />
                    <span className="flex-1">Sample sent</span>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(deal.sample.sentAt)}
                    </span>
                  </div>
                  {deal.sample.feedbackAt ? (
                    <>
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                        <span className="flex-1">{deal.sample.feedback}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {daysToFeedback(deal.sample)} days to feedback
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Awaiting feedback
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Move stage */}
          <div>
            <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Move to stage
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...PIPELINE_STAGES, ...CLOSED_STAGES].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => onMove(deal.id, stage.id)}
                  disabled={stage.id === deal.stage}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200",
                    stage.id === deal.stage
                      ? "cursor-default border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", stage.color)} />
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Details */}
          <dl className="space-y-3 text-sm">
            <Row
              icon={User}
              label="Contact"
              value={contactById(deal.currentContactId)?.name ?? "—"}
            />
            <Row
              icon={MapPin}
              label="Location"
              value={`${deal.city} · ${deal.accountType}`}
            />
            <Row
              icon={CalendarClock}
              label="Expected close"
              value={`${new Date(deal.expectedCloseDate).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short", year: "numeric" },
              )} (${relativeTime(deal.expectedCloseDate)})`}
            />
            <Row
              icon={Clock}
              label="Last activity"
              value={`${relativeTime(deal.lastActivityAt)} · ${daysSince(
                deal.lastActivityAt,
              )} days idle`}
            />
            <Row
              icon={Tag}
              label="Priority"
              value={
                deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)
              }
            />
          </dl>

          {deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {deal.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {deal.stage === "lost" && deal.lostReason && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/[0.06] p-3">
              <div className="flex items-center gap-1.5">
                <XCircle className="size-3.5 text-destructive" />
                <span className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  Lost reason
                </span>
                {onEditLostReason && (
                  <button
                    onClick={() => onEditLostReason(deal)}
                    className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
                  >
                    edit
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm font-medium">{deal.lostReason}</p>
              {deal.lostNote && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {deal.lostNote}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Owner */}
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-accent/12 text-accent">
                {initials(deal.owner)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium">{deal.owner}</div>
              <div className="text-xs text-muted-foreground">Deal owner</div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            Notes, files, quotations and the full activity timeline arrive in
            Part 3 &amp; 4.
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
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium">{value}</dd>
    </div>
  );
}
