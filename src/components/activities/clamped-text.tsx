"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shows long text at two lines, with the rest one tap away.
 *
 * The text is never shortened — the full string is always in the DOM, so
 * nothing is lost and it stays searchable and selectable. Only the height is
 * limited, because a customer who writes long notes every time would
 * otherwise make the summary taller than the log list it summarises.
 *
 * Short text renders plainly, with no control and no fade: the affordance
 * only appears when there is genuinely something hidden.
 */
export function ClampedText({
  children,
  className,
  lines = 2,
}: {
  children: string;
  className?: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [overflows, setOverflows] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  /*
    Measured rather than guessed from character count: the same string wraps
    differently in the pop-up column, the drawer and on a phone.
  */
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () =>
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  const clamped = !expanded && overflows;

  return (
    <span className="block">
      <span
        ref={ref}
        /*
          break-words is essential here, not cosmetic: line-clamp limits the
          number of rows but not the width, so a single unbroken string still
          widened the panel before clamping ever applied.
        */
        className={cn("block break-words", className)}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {children}
      </span>

      {overflows && (
        <button
          type="button"
          onClick={(e) => {
            // Never let this bubble into a row that opens a drawer.
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-0.5 text-[11px] font-medium text-accent hover:underline"
        >
          {clamped ? "Show more" : "Show less"}
        </button>
      )}
    </span>
  );
}
