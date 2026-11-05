"use client";

import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import type { Company } from "@/lib/companies";
import { SPANCOP_MAP, type SpancopStage } from "@/lib/spancop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingSuggestion = {
  company: Company;
  suggestion: { stage: SpancopStage; reason: string };
};

/**
 * Full list of suggested stage changes, each with the reason the engine
 * proposed it. Opened from the count chip — the list is never shown inline.
 *
 * Mobile + desktop adaptive cards (BUILD 18.9 Option A):
 * - Full-width company identity so names and locations are never crushed
 * - Single horizontal stage-transition + reason bar
 * - 50/50 touch buttons on mobile; right-aligned compact actions on desktop
 * - Persistent "Keep" locks the company's stage until a new activity is logged
 */
export function SuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  onApprove,
  onDismiss,
  onDismissAll,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: PendingSuggestion[];
  onApprove: (id: string, stage: SpancopStage, reason: string) => void;
  onDismiss: (id: string, stage: SpancopStage) => void;
  onDismissAll?: () => void;
}) {
  const isLastItem = suggestions.length === 1;

  const handleApprove = (id: string, stage: SpancopStage, reason: string) => {
    onApprove(id, stage, reason);
    if (isLastItem) onOpenChange(false);
  };

  const handleDismiss = (id: string, stage: SpancopStage) => {
    onDismiss(id, stage);
    if (isLastItem) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border p-3.5 pr-10 text-left sm:p-5 sm:pr-12">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <Sparkles className="size-4 shrink-0 text-accent" />
            <span>Suggested stage changes</span>
            {suggestions.length > 0 && (
              <Badge variant="accent" className="px-2 py-0.5 text-[11px]">
                {suggestions.length} new
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Kept stages stay locked until a new activity is logged for that
            customer.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3.5 scrollbar-thin sm:p-5">
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No suggestions right now — every company is at its chosen stage.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {suggestions.map(({ company, suggestion }) => {
                const from = SPANCOP_MAP[company.spancop];
                const to = SPANCOP_MAP[suggestion.stage];
                return (
                  <li
                    key={company.id}
                    className="rounded-xl border border-border bg-card/40 p-3 transition-colors hover:border-accent/40"
                  >
                    {/* Row 1: Full-width Company identity */}
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
                        {company.name.charAt(0)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-semibold leading-snug text-foreground">
                          {company.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {company.area}, {company.emirate} · {company.owner}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Horizontal stage transition + reason strip */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border/70 bg-secondary/40 px-2.5 py-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            from.tint,
                          )}
                        >
                          <span
                            className={cn("size-1.5 rounded-full", from.color)}
                          />
                          {from.label}
                        </span>
                        <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            to.tint,
                          )}
                        >
                          <span
                            className={cn("size-1.5 rounded-full", to.color)}
                          />
                          {to.label}
                        </span>
                      </div>
                      <span className="min-w-0 break-words text-xs text-muted-foreground">
                        · {suggestion.reason}
                      </span>
                    </div>

                    {/* Row 3: Full-width 50/50 touch buttons on mobile, compact right-aligned on desktop */}
                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                      <Button
                        size="xs"
                        className="h-8 w-full px-3 text-xs font-semibold sm:w-auto"
                        onClick={() =>
                          handleApprove(
                            company.id,
                            suggestion.stage,
                            suggestion.reason,
                          )
                        }
                      >
                        <Check />
                        <span className="truncate">Move to {to.label}</span>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-8 w-full px-3 text-xs font-semibold sm:w-auto"
                        onClick={() =>
                          handleDismiss(company.id, suggestion.stage)
                        }
                      >
                        <X />
                        <span className="truncate">Keep {from.label}</span>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Sticky footer: one-tap Keep all + Close */}
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-popover/95 p-3 sm:justify-between sm:px-5 sm:py-3.5">
          {suggestions.length > 0 && onDismissAll && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 flex-1 text-xs font-semibold sm:flex-none"
              onClick={() => {
                onDismissAll();
                onOpenChange(false);
              }}
            >
              Keep all {suggestions.length} in current stage
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs font-semibold",
              suggestions.length === 0 || !onDismissAll
                ? "w-full sm:ml-auto sm:w-auto"
                : "px-4",
            )}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
