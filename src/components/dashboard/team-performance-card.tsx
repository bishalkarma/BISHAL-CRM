"use client";

import * as React from "react";
import { Crown, Users, TrendingUp } from "lucide-react";
import type { OwnerPerfRow } from "@/lib/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TeamPerformanceCard({
  rows,
  formatMoney,
  periodLabel,
  viewerRole,
  viewerName,
}: {
  rows: OwnerPerfRow[];
  formatMoney: (n: number) => string;
  periodLabel: string;
  viewerRole?: string;
  viewerName?: string;
}) {
  const isTeamView = viewerRole === "Admin" || viewerRole === "Manager";
  const title = isTeamView ? "Team Performance" : "My Performance";
  const desc = isTeamView
    ? `Who's doing what · ${periodLabel}`
    : `Your deals · ${periodLabel}`;

  if (rows.length === 0) {
    return (
      <Card className="flex min-h-[140px] flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {isTeamView ? <Users className="size-4 text-accent" /> : <Crown className="size-4 text-accent" />}
            {title}
          </CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground">
          No deals in this period yet.
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...rows.map((r) => r.totalValue), 1);

  // For sales rep personal view, highlight their own row even if multiple rows somehow appear (team filtering guarantees single)
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              {isTeamView ? <Users className="size-4 text-accent" /> : <Crown className="size-4 text-accent" />}
              {title}
            </CardTitle>
            <CardDescription>{desc}</CardDescription>
          </div>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            {rows.length} {rows.length === 1 ? "member" : "members"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.slice(0, 5).map((r, idx) => {
          const pct = Math.round((r.totalValue / maxValue) * 100);
          const isYou = viewerName && r.owner === viewerName;
          const isLeader = idx === 0 && isTeamView;
          return (
            <div
              key={r.owner}
              className={cn(
                "relative overflow-hidden rounded-lg border px-3 py-2",
                isYou ? "border-accent/40 bg-accent/[0.06]" : "border-border/60",
                isLeader && "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
              )}
            >
              <div
                className="absolute inset-y-0 left-0 opacity-[0.08]"
                style={{
                  width: `${pct}%`,
                  background: isLeader ? "#f59e0b" : "hsl(var(--accent))",
                }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                      isLeader ? "bg-amber-500" : idx === 1 ? "bg-zinc-400" : idx === 2 ? "bg-amber-700" : "bg-accent"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{r.owner}</span>
                      {isYou && (
                        <span className="rounded bg-accent px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-accent-foreground">
                          You
                        </span>
                      )}
                      {isLeader && isTeamView && <Crown className="size-3.5 text-amber-500" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.dealCount} deals · {r.wonCount} won · {r.openCount} open
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular-nums">{formatMoney(r.totalValue)}</div>
                  <div className="text-[11px] text-muted-foreground">{pct}% of top</div>
                </div>
              </div>
            </div>
          );
        })}
        {isTeamView && rows.length > 5 && (
          <div className="pt-1 text-center text-[11px] text-muted-foreground">
            +{rows.length - 5} more team members
          </div>
        )}
      </CardContent>
    </Card>
  );
}
