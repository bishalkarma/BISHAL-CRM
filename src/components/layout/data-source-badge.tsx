"use client";

import { AlertTriangle, Cloud, HardDrive, Loader2 } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Shows at a glance where the data on screen came from.
 * Temporary while we migrate — removed once Supabase is the only path.
 */
export function DataSourceBadge() {
  const { loading, source, error, companies, saving } = useData();

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
        <Loader2 className="size-3 animate-spin" />
        <span className="hidden sm:inline">Saving…</span>
      </span>
    );
  }

  if (loading) {
    return (
      <span className="hidden items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
        <Loader2 className="size-3 animate-spin" />
        Loading…
      </span>
    );
  }

  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">
            <AlertTriangle className="size-3" />
            <span className="hidden sm:inline">Offline data</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">
          <span className="font-medium">Could not reach Supabase</span>
          <span className="mt-0.5 block text-[10px] opacity-80">{error}</span>
          <span className="mt-1 block text-[10px] opacity-80">
            Showing bundled demo data instead.
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  const cloud = source === "supabase";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium",
            cloud
              ? "border-success/40 bg-success/10 text-success"
              : "border-border text-muted-foreground",
          )}
        >
          {cloud ? (
            <Cloud className="size-3" />
          ) : (
            <HardDrive className="size-3" />
          )}
          <span className="hidden sm:inline">{cloud ? "Cloud" : "Demo"}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {cloud ? (
          <>
            <span className="font-medium">Connected to Supabase</span>
            <span className="mt-0.5 block text-[10px] opacity-80">
              {companies.length} companies loaded from the database
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">Demo data</span>
            <span className="mt-0.5 block text-[10px] opacity-80">
              No Supabase credentials found
            </span>
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
