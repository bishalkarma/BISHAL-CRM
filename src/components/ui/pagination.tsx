"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  label?: string;
};

/**
 * Reusable pagination bar.
 *
 * Shows "Showing X–Y of Z" with Prev/Next and page-number buttons.
 * Caps visible page buttons at 7 so wide datasets don't overflow.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  label = "records",
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Build the list of visible page numbers, capped at 7 with ellipsis.
  const pages = React.useMemo(() => {
    const maxVisible = 7;
    if (totalPages <= 0) return [];
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Always show first, last, current, and neighbors.
    const set = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    const arr = Array.from(set).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    if (arr.length > maxVisible) {
      // Keep the edges, drop the middle ones.
      return [arr[0], arr[1], -1, arr[arr.length - 2], arr[arr.length - 1]];
    }
    return arr;
  }, [page, totalPages]);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Showing <strong className="text-foreground">{start}–{end}</strong> of{" "}
          <strong className="text-foreground">{total}</strong> {label}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
          >
            {[10, 25, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} per page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => onPageChange(p)}
              className={cn("min-w-[2rem]", p === page && "bg-accent text-accent-foreground")}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Client-side slice helper — takes a full array and returns the page slice.
 * For server-side pagination replace with a Supabase .range() call.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
