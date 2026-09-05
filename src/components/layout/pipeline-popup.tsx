"use client";

import * as React from "react";
import Link from "next/link";
import { Target, Users, X } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { PopupPanel } from "./popup-panel";
import { SPANCOP_MAP, SPANCOP_ORDER, type SpancopStage } from "@/lib/spancop";
import { PIPELINE_STAGES, type DealStage } from "@/lib/pipeline";
import { cn, formatCurrency } from "@/lib/utils";

export function PipelinePopup({ onClose }: { onClose: () => void }) {
  const { deals, companies } = useData();
  const [selectedDealStage, setSelectedDealStage] = React.useState<DealStage | null>(null);
  const [selectedSpancopStage, setSelectedSpancopStage] = React.useState<SpancopStage | null>(null);

  const stats = React.useMemo(() => {
    const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const total = open.reduce((sum, d) => sum + d.value, 0);
    const byStage: Record<string, typeof open> = {};
    PIPELINE_STAGES.forEach((s) => {
      byStage[s.id] = open.filter((d) => d.stage === s.id);
    });

    const spancop: Record<string, typeof companies> = {};
    SPANCOP_ORDER.forEach((s) => {
      spancop[s] = companies.filter((c) => c.spancop === s);
    });

    return { open, total, byStage, spancop };
  }, [deals, companies]);

  const toggleDealStage = (stage: DealStage) => {
    setSelectedDealStage((prev) => (prev === stage ? null : stage));
  };

  const toggleSpancopStage = (stage: SpancopStage) => {
    setSelectedSpancopStage((prev) => (prev === stage ? null : stage));
  };

  const visibleDealStages = selectedDealStage
    ? PIPELINE_STAGES.filter((s) => s.id === selectedDealStage)
    : PIPELINE_STAGES;

  const visibleSpancopStages = selectedSpancopStage
    ? SPANCOP_ORDER.filter((s) => s === selectedSpancopStage)
    : SPANCOP_ORDER;

  return (
    <PopupPanel title="Pipeline Snapshot" accent="accent" onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(70vh-80px)]">
        {/* ─── Deal pipeline column ─── */}
        <div className="flex flex-col min-h-0">
          {/* Header row */}
          <div className="mb-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                Open deals
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums">{stats.open.length}</div>
              <div className="text-[11px] tabular-nums text-muted-foreground">
                {formatCurrency(stats.total)}
              </div>
            </div>
          </div>

          {/* Stage pills — FIXED HEIGHT, never changes */}
          <div className="shrink-0 h-[88px] flex gap-2 mb-1">
            {PIPELINE_STAGES.map((stage) => {
              const count = stats.byStage[stage.id]?.length ?? 0;
              const isSelected = selectedDealStage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => toggleDealStage(stage.id)}
                  disabled={count === 0}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-lg px-2 py-2 transition-all duration-150 border min-w-0",
                    isSelected
                      ? cn(stage.tint, "border-current/30 scale-105 shadow-sm")
                      : count > 0
                        ? cn(stage.tint, "border-transparent hover:scale-105 cursor-pointer")
                        : "bg-secondary/30 text-muted-foreground/30 border-transparent cursor-not-allowed",
                  )}
                >
                  <span className="text-lg font-bold tabular-nums leading-none">{count}</span>
                  <span className="mt-1 text-[10px] font-medium leading-none truncate max-w-full">
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clear-filter slot — fixed height */}
          <div className="shrink-0 h-5 mb-1">
            {selectedDealStage && (
              <button
                type="button"
                onClick={() => setSelectedDealStage(null)}
                className="flex items-center gap-1 text-[11px] text-accent hover:underline"
              >
                <X className="size-3" />
                Clear — {PIPELINE_STAGES.find((s) => s.id === selectedDealStage)?.label} only
              </button>
            )}
          </div>

          {/* Deal list — ONLY scrollable part */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-0">
            <div className="space-y-3">
              {visibleDealStages.map((stage) => {
                const list = stats.byStage[stage.id] ?? [];
                if (list.length === 0) return null;
                return (
                  <div key={stage.id}>
                    <div className="mb-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", stage.color)} />
                      {stage.label}
                      <span className="text-muted-foreground/60">({list.length})</span>
                    </div>
                    <ul className="space-y-0.5">
                      {list.map((d) => (
                        <li key={d.id}>
                          <Link
                            href={`/pipeline?id=${d.id}`}
                            onClick={onClose}
                            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", stage.color)} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{d.title}</div>
                              <div className="truncate text-[11px] text-muted-foreground">{d.company}</div>
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {formatCurrency(d.value)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!visibleDealStages.some((s) => (stats.byStage[s.id]?.length ?? 0) > 0) && (
                <p className="text-sm text-muted-foreground py-2">No deals in this stage.</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── SPANCOP customers column ─── */}
        <div className="flex flex-col min-h-0">
          {/* Header row */}
          <div className="mb-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                Customers
              </span>
            </div>
            <Link
              href="/companies"
              onClick={onClose}
              className="text-[11px] font-medium text-accent hover:underline"
            >
              All →
            </Link>
          </div>

          {/* SPANCOP stage pills — FIXED HEIGHT, never changes */}
          <div className="shrink-0 h-[88px] flex gap-2 mb-1">
            {SPANCOP_ORDER.map((stage) => {
              const count = stats.spancop[stage]?.length ?? 0;
              const def = SPANCOP_MAP[stage];
              const isSelected = selectedSpancopStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => toggleSpancopStage(stage)}
                  disabled={count === 0}
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-lg px-1 py-2 transition-all duration-150 border min-w-0",
                    isSelected
                      ? cn(def.tint, "border-current/30 scale-105 shadow-sm")
                      : count > 0
                        ? cn(def.tint, "border-transparent hover:scale-105 cursor-pointer")
                        : "bg-secondary/30 text-muted-foreground/30 border-transparent cursor-not-allowed",
                  )}
                >
                  <span className="text-lg font-bold tabular-nums leading-none">{count}</span>
                  <span className="mt-1 text-[10px] font-medium leading-none truncate max-w-full">
                    {def.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clear-filter slot — fixed height */}
          <div className="shrink-0 h-5 mb-1">
            {selectedSpancopStage && (
              <button
                type="button"
                onClick={() => setSelectedSpancopStage(null)}
                className="flex items-center gap-1 text-[11px] text-accent hover:underline"
              >
                <X className="size-3" />
                Clear — {SPANCOP_MAP[selectedSpancopStage].label} only
              </button>
            )}
          </div>

          {/* Company list — ONLY scrollable part */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-0">
            <div className="space-y-3">
              {visibleSpancopStages.map((stage) => {
                const list = stats.spancop[stage] ?? [];
                if (list.length === 0) return null;
                const def = SPANCOP_MAP[stage];
                return (
                  <div key={stage}>
                    <div className="mb-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", def.color)} />
                      {def.label}
                      <span className="text-muted-foreground/60">({list.length})</span>
                    </div>
                    <ul className="space-y-0.5">
                      {list.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/companies?id=${c.id}`}
                            onClick={onClose}
                            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", def.color)} />
                            <span className="flex-1 truncate font-medium">{c.name}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {c.openDealIds.length > 0
                                ? `${c.openDealIds.length} deal${c.openDealIds.length > 1 ? "s" : ""}`
                                : "—"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {!visibleSpancopStages.some((s) => (stats.spancop[s]?.length ?? 0) > 0) && (
                <p className="text-sm text-muted-foreground py-2">No customers in this stage.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PopupPanel>
  );
}
