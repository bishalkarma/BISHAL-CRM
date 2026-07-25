"use client";

import { CalendarClock, Columns2, Flag, Info } from "lucide-react";
import {
  usePrioritisation,
  type PrioritisationMode,
} from "@/components/providers/prioritisation-provider";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: PrioritisationMode;
  label: string;
  icon: typeof Flag;
  hint: string;
}[] = [
  {
    id: "lead-status",
    label: "Lead status",
    icon: Flag,
    hint: "Manual temperature — Hot / Warm / Cold / Dormant. Quick to set, but someone must keep it honest.",
  },
  {
    id: "follow-up",
    label: "Follow-up date",
    icon: CalendarClock,
    hint: "A dated next action. Sorts by urgency automatically and tells you what to do today.",
  },
  {
    id: "both",
    label: "Compare",
    icon: Columns2,
    hint: "Show both columns side by side.",
  },
];

/**
 * Temporary evaluation control: lets the two prioritisation models be
 * compared on real data before one is chosen. Removed once decided.
 */
export function PrioritisationSwitch() {
  const { mode, setMode } = usePrioritisation();
  const active = OPTIONS.find((o) => o.id === mode)!;

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent/[0.04] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Info className="size-3.5 text-accent" />
          Trial
        </span>
        <span className="text-sm text-muted-foreground">
          How should companies be prioritised?
        </span>
        <div className="ml-auto flex items-center rounded-lg border border-border bg-background p-0.5">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setMode(option.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  mode === option.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {active.hint}
      </p>
    </div>
  );
}
