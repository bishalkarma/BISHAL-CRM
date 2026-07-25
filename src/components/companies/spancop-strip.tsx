"use client";

import { SPANCOP_STAGES, SPANCOP_ORDER, type SpancopStage } from "@/lib/spancop";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Seven-segment S-P-A-N-C-O-P progress strip. */
export function SpancopStrip({
  stage,
  size = "default",
  onSelect,
}: {
  stage: SpancopStage;
  size?: "sm" | "default";
  onSelect?: (stage: SpancopStage) => void;
}) {
  const currentIndex = SPANCOP_ORDER.indexOf(stage);

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={`SPANCOP stage: ${stage}`}
    >
      {SPANCOP_STAGES.map((item, index) => {
        const reached = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Element = onSelect ? "button" : "div";

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Element
                {...(onSelect
                  ? {
                      onClick: () => onSelect(item.id),
                      "aria-current": isCurrent ? ("step" as const) : undefined,
                    }
                  : {})}
                className={cn(
                  "flex items-center justify-center rounded-md font-semibold transition-all duration-200",
                  size === "sm"
                    ? "h-5 w-5 text-[9px]"
                    : "h-7 flex-1 text-[11px]",
                  reached
                    ? isCurrent
                      ? `${item.color} text-white ring-2 ring-offset-1 ring-offset-background ring-current/30 scale-105`
                      : `${item.color} text-white opacity-55`
                    : "bg-secondary text-muted-foreground/60",
                  onSelect && "cursor-pointer hover:opacity-100",
                )}
              >
                {item.letter}
              </Element>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">{item.label}</span>
              <span className="block text-[10px] opacity-80">
                {item.description}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function SpancopBadge({
  stage,
  className,
}: {
  stage: SpancopStage;
  className?: string;
}) {
  const def = SPANCOP_STAGES.find((s) => s.id === stage)!;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        def.tint,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", def.color)} />
      {def.label}
    </span>
  );
}
