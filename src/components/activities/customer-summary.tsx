"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { briefCustomer, type BulletKind } from "@/lib/activity-narrative";
import type { Activity } from "@/lib/activities";
import { useData } from "@/components/providers/data-provider";
import { cn } from "@/lib/utils";

/** Each bullet answers one question, and is colour-coded to match. */
const BULLET_TONE: Record<BulletKind, string> = {
  now: "bg-accent",
  history: "bg-muted-foreground/50",
  next: "bg-success",
  overdue: "bg-destructive",
  upcoming: "bg-chart-4",
  none: "bg-warning",
};

/**
 * The summary block at the top of a customer's history.
 *
 * Reads the whole journal, shows three bullets. The log entries below stay
 * collapsed — once a customer has hundreds of them, the summary is what gets
 * read, and the raw entries are opened only when something needs checking.
 */
export function CustomerSummary({
  activities,
  defaultOpen = true,
}: {
  activities: Activity[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const { contactById } = useData();

  const nameOf = React.useCallback(
    (id: string | null) => contactById(id)?.name ?? null,
    [contactById],
  );

  const brief = React.useMemo(
    () => briefCustomer(activities, nameOf),
    [activities, nameOf],
  );

  if (!brief) return null;

  const { bullets, risk } = brief;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.05]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2.5 p-3 text-left"
      >
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Sparkles className="size-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </span>
            {/*
              Soft by design. This is a prompt to go and look, never a verdict,
              and it never moves a SPANCOP stage.
            */}
            {risk && (
              <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                Possible risk
              </span>
            )}
            {/*
              No counts here on purpose. They live once, next to the customer
              name — repeating them was noise, and two copies can drift.
            */}
          </div>

          {/* Collapsed: the risk if there is one, otherwise where it stands. */}
          {!open && (
            <p
              className={cn(
                "mt-1 line-clamp-2 text-sm",
                risk ? "text-warning" : "text-foreground/85",
              )}
            >
              {risk
                ? `${risk.why.charAt(0).toUpperCase()}${risk.why.slice(1)} — ${
                    risk.daysAgo === 0
                      ? "today"
                      : risk.daysAgo === 1
                        ? "yesterday"
                        : `${risk.daysAgo} days ago`
                  }`
                : bullets[0]?.text}
            </p>
          )}
        </div>

        <ChevronRight
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-accent/20 px-3 pb-3 pt-2.5">
              {risk && (
                <div className="flex items-start gap-1.5 rounded-lg bg-warning/10 px-2.5 py-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <span className="min-w-0 flex-1 text-xs font-medium text-warning">
                    {risk.why.charAt(0).toUpperCase()}
                    {risk.why.slice(1)} —{" "}
                    {risk.daysAgo === 0
                      ? "mentioned today"
                      : risk.daysAgo === 1
                        ? "mentioned yesterday"
                        : `mentioned ${risk.daysAgo} days ago`}
                  </span>
                </div>
              )}

              <ul className="space-y-1.5">
                {bullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.04 + i * 0.06 }}
                    className="flex items-start gap-2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[7px] size-1.5 shrink-0 rounded-full",
                        BULLET_TONE[bullet.kind],
                      )}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[13px] leading-relaxed",
                        bullet.kind === "overdue"
                          ? "font-medium text-destructive"
                          : bullet.kind === "none"
                            ? "text-warning"
                            : "text-foreground/85",
                      )}
                    >
                      {bullet.text}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/*
                Supporting detail under the bullets.

                Interactions and Deals are deliberately absent: the count is
                already beside the customer name and the deal is already in
                bullet 2. Showing either again would be the same duplication
                we just removed.
              */}
              <div className="space-y-2 border-t border-accent/20 pt-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Stat
                    label="Cadence"
                    value={brief.cadenceDays ? `${brief.cadenceDays}d` : "—"}
                    hint="avg gap"
                  />
                  <Stat
                    label="Last contact"
                    value={
                      brief.daysSinceLast === null
                        ? "—"
                        : brief.daysSinceLast === 0
                          ? "Today"
                          : `${brief.daysSinceLast}d`
                    }
                    hint={brief.daysSinceLast ? "ago" : undefined}
                  />
                </div>

                {brief.mix && <Line label="Mix" value={brief.mix} />}
                <Line label="Rhythm" value={brief.rhythm} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-background/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">
        {value}
        {hint && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-14 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-foreground/80">{value}</span>
    </div>
  );
}
