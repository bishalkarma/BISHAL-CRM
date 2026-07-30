"use client";

import { motion } from "framer-motion";
import { SPANCOP_STAGES, SPANCOP_RULE, type SpancopStage } from "@/lib/spancop";
import { cn } from "@/lib/utils";

/** Live snapshot: how many companies sit at each stage right now. */
export function SpancopFunnel({
  snapshot,
  activeStages,
  onToggleStage,
}: {
  snapshot: Record<SpancopStage, number>;
  activeStages: SpancopStage[];
  onToggleStage: (stage: SpancopStage) => void;
}) {
  const max = Math.max(...Object.values(snapshot), 1);

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {SPANCOP_STAGES.map((stage, index) => {
        const count = snapshot[stage.id];
        const active = activeStages.includes(stage.id);
        return (
          <motion.button
            key={stage.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            onClick={() => onToggleStage(stage.id)}
            aria-pressed={active}
            /* Native title, so the rule is available on hover, on keyboard
               focus and on a long press — no extra component to mount 7 times. */
            title={`${stage.label} — ${SPANCOP_RULE[stage.id]}`}
            className={cn(
              "group rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5",
              active
                ? "border-accent bg-accent/[0.07] shadow-[var(--shadow-soft)]"
                : "border-border bg-card hover:border-accent/40",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded text-[10px] font-bold text-white",
                  stage.color,
                )}
              >
                {stage.letter}
              </span>
              <span className="truncate text-[10px] font-medium text-muted-foreground">
                {stage.label}
              </span>
            </div>
            <div className="mt-1.5 text-xl font-semibold tabular-nums">
              {count}
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(count / max) * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={cn("h-full rounded-full", stage.color)}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
