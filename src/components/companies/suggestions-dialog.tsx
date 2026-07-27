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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PendingSuggestion = {
  company: Company;
  suggestion: { stage: SpancopStage; reason: string };
};

/**
 * Full list of suggested stage changes, each with the reason the engine
 * proposed it. Opened from the count chip — the list is never shown inline.
 */
export function SuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  onApprove,
  onDismiss,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: PendingSuggestion[];
  onApprove: (id: string, stage: SpancopStage, reason: string) => void;
  onDismiss: (id: string, stage: SpancopStage) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            Suggested stage changes
          </DialogTitle>
          <DialogDescription>
            The engine proposes these based on deals, activities and orders.
            Nothing moves until you approve it.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No suggestions right now — every company is at the right stage.
          </p>
        ) : (
          <ul className="max-h-[52vh] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {suggestions.map(({ company, suggestion }) => {
              const from = SPANCOP_MAP[company.spancop];
              const to = SPANCOP_MAP[suggestion.stage];
              return (
                <li
                  key={company.id}
                  className="rounded-xl border border-border p-3 transition-colors hover:border-accent/40"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
                      {company.name.charAt(0)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {company.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {company.area}, {company.emirate} · {company.owner}
                      </div>

                      {/* Stage transition */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            from.tint,
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", from.color)} />
                          {from.label}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            to.tint,
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", to.color)} />
                          {to.label}
                        </span>
                      </div>

                      {/* Why the engine suggested it */}
                      <div className="mt-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-foreground">
                          Reason:{" "}
                        </span>
                        <span className="break-words text-muted-foreground">
                          {suggestion.reason}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        onClick={() =>
                          onApprove(
                            company.id,
                            suggestion.stage,
                            suggestion.reason,
                          )
                        }
                      >
                        <Check />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDismiss(company.id, suggestion.stage)}
                      >
                        <X />
                        Keep
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
