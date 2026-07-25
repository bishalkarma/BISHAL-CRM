"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  Coins,
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react";
import type { PipelineFilters } from "./use-pipeline";
import { DEAL_OWNERS, type DealPriority } from "@/lib/deals";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/components/providers/currency-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";

const PRIORITIES: DealPriority[] = ["high", "medium", "low"];

export function PipelineToolbar({
  filters,
  setFilters,
  activeFilterCount,
  resetFilters,
  view,
  setView,
}: {
  filters: PipelineFilters;
  setFilters: React.Dispatch<React.SetStateAction<PipelineFilters>>;
  activeFilterCount: number;
  resetFilters: () => void;
  view: "board" | "list";
  setView: (view: "board" | "list") => void;
}) {
  const { display, setDisplay, enabled } = useCurrency();

  const toggleOwner = (owner: string) =>
    setFilters((f) => ({
      ...f,
      owners: f.owners.includes(owner)
        ? f.owners.filter((o) => o !== owner)
        : [...f.owners, owner],
    }));

  const togglePriority = (priority: DealPriority) =>
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(priority)
        ? f.priorities.filter((p) => p !== priority)
        : [...f.priorities, priority],
    }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) =>
            setFilters((f) => ({ ...f, query: e.target.value }))
          }
          placeholder="Search deals…"
          className="h-9 pl-9 pr-8"
        />
        {filters.query && (
          <button
            onClick={() => setFilters((f) => ({ ...f, query: "" }))}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <Filter />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="accent" className="ml-0.5 px-1.5 py-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Owner</DropdownMenuLabel>
          {DEAL_OWNERS.map((owner) => (
            <DropdownMenuItem
              key={owner}
              onSelect={(e) => {
                e.preventDefault();
                toggleOwner(owner);
              }}
              className="gap-2"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold">
                {initials(owner)}
              </span>
              <span className="flex-1 truncate">{owner}</span>
              {filters.owners.includes(owner) && (
                <Check className="size-4 text-accent" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {PRIORITIES.map((priority) => (
            <DropdownMenuItem
              key={priority}
              onSelect={(e) => {
                e.preventDefault();
                togglePriority(priority);
              }}
              className="gap-2 capitalize"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  priority === "high"
                    ? "bg-destructive"
                    : priority === "medium"
                      ? "bg-warning"
                      : "bg-muted-foreground/40",
                )}
              />
              <span className="flex-1">{priority}</span>
              {filters.priorities.includes(priority) && (
                <Check className="size-4 text-accent" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setFilters((f) => ({ ...f, rottingOnly: !f.rottingOnly }));
            }}
            className="gap-2"
          >
            <AlertTriangle className="size-4 text-warning" />
            <span className="flex-1">Stalled only</span>
            {filters.rottingOnly && <Check className="size-4 text-accent" />}
          </DropdownMenuItem>

          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={resetFilters} className="gap-2">
                <X className="size-4" />
                Clear all filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0">
            <Coins />
            {display}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Display currency</DropdownMenuLabel>
          {enabled.map((code) => (
            <DropdownMenuItem
              key={code}
              onSelect={() => setDisplay(code)}
              className="gap-2"
            >
              <span className="w-8 font-mono text-xs font-semibold">
                {code}
              </span>
              <span className="flex-1 truncate text-muted-foreground">
                {CURRENCIES[code].name}
              </span>
              {display === code && <Check className="size-4 text-accent" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings" className="text-xs text-muted-foreground">
              Manage currencies in Settings →
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View switch */}
      <div className="ml-auto flex shrink-0 items-center rounded-lg border border-border p-0.5">
        <button
          onClick={() => setView("board")}
          aria-label="Board view"
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-colors",
            view === "board"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          onClick={() => setView("list")}
          aria-label="List view"
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-colors",
            view === "list"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <List className="size-4" />
        </button>
      </div>
    </div>
  );
}
