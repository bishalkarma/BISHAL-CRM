"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  DollarSign,
  Percent,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCompactCurrency } from "@/lib/utils";

/**
 * Serializable formatter keys.
 *
 * KPI cards are rendered from Server Components, so the format cannot be
 * passed as a function prop — we pass a token and resolve it on the client.
 */
export type KpiFormat = "currency" | "percent" | "number";

/** Icon tokens — components themselves are not serializable across the RSC boundary. */
export type KpiIcon =
  | "target"
  | "revenue"
  | "winrate"
  | "deal"
  | "customers";

const ICONS: Record<KpiIcon, LucideIcon> = {
  target: Target,
  revenue: DollarSign,
  winrate: Percent,
  deal: CalendarCheck,
  customers: Users,
};

const FORMATTERS: Record<KpiFormat, (n: number) => string> = {
  currency: (n) => formatCompactCurrency(n),
  percent: (n) => `${Math.round(n)}%`,
  number: (n) => new Intl.NumberFormat("en-US").format(Math.round(n)),
};

/** Counts up to `value` when the card scrolls into view. */
function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format: KpiFormat;
}) {
  const formatter = FORMATTERS[format];
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 22 });
  const [display, setDisplay] = React.useState(() => formatter(0));

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  React.useEffect(
    () => spring.on("change", (latest) => setDisplay(formatter(latest))),
    [spring, formatter],
  );

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  format,
  delta,
  deltaLabel,
  icon,
  index = 0,
}: {
  label: string;
  value: number;
  format: KpiFormat;
  delta: number;
  deltaLabel: string;
  icon: KpiIcon;
  index?: number;
}) {
  const positive = delta >= 0;
  const Icon = ICONS[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Card interactive className="group relative overflow-hidden p-5">
        {/* subtle accent wash on hover */}
        <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-accent/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="size-[18px]" />
          </span>
        </div>

        <div className="mt-3 text-[26px] font-semibold leading-none tracking-tight sm:text-[28px]">
          <AnimatedNumber value={value} format={format} />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              positive
                ? "bg-success/12 text-success"
                : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta)}%
          </span>
          <span className="truncate text-muted-foreground">{deltaLabel}</span>
        </div>
      </Card>
    </motion.div>
  );
}
