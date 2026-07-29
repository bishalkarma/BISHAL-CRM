"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, PencilOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The one read-only pop-up used by every drill-down on the dashboard:
 * a pipeline stage, a lost reason, a product.
 *
 * Deliberately inert. No logging, no editing, no row navigation — agreed with
 * the user so a dashboard glance can never accidentally write to a record.
 * The single way onward is the link in the top-left corner.
 */
export type DetailRow = {
  id: string;
  /** Bold first line — usually the deal title. */
  title: string;
  /** Grey second line — company, owner, whatever identifies it. */
  meta: string;
  /** Right-aligned bold figure. */
  value: string;
  /** Small grey line under the figure. */
  hint?: string;
  /** Optional amber pill, e.g. "14 days idle". */
  flag?: string;
};

export function DetailDialog({
  open,
  onOpenChange,
  title,
  summary,
  rows,
  emptyLabel = "Nothing to show here.",
  linkHref = "/pipeline",
  linkLabel = "Deal Pipeline",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  summary: string;
  rows: DetailRow[];
  emptyLabel?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-1">
          {/* Top-left, above the title: the user asked for the way out to sit
              here rather than repeated at the bottom of every pop-up. */}
          <Link
            href={linkHref}
            className="flex w-fit items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
          >
            <ArrowUpRight className="size-3.5" />
            {linkLabel}
          </Link>
          <DialogTitle className="break-words">{title}</DialogTitle>
          <DialogDescription className="break-words">
            {summary}
          </DialogDescription>
        </DialogHeader>

        {/* Caps the pop-up on small screens; the list scrolls, the frame does not. */}
        <div className="max-h-[55vh] min-w-0 overflow-y-auto scrollbar-thin">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              {emptyLabel}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">
                      {row.title}
                    </p>
                    <p className="break-words text-xs text-muted-foreground">
                      {row.meta}
                      {row.flag && (
                        <span className="ml-1.5 inline-block rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                          {row.flag}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {row.value}
                    </p>
                    {row.hint && (
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {row.hint}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
          <PencilOff className="size-3 shrink-0" />
          Read-only — nothing here changes your data.
        </p>
      </DialogContent>
    </Dialog>
  );
}
