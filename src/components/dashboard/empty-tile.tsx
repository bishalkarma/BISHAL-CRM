"use client";

import { CheckCircle2 } from "lucide-react";

/**
 * What a tile shows when it has nothing to show.
 *
 * Deliberately NOT hidden. Hiding an empty widget was considered and rejected:
 * the dashboard grid stores a saved position per tile, so a tile that vanishes
 * lets everything below slide up, and when the data returns it reappears in
 * the wrong place. The layout would rearrange itself while nobody was looking.
 *
 * So it keeps its place and its size, and simply goes quiet.
 */
export function EmptyTile({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex h-full min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <CheckCircle2 className="size-5 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">{message}</p>
      {hint && (
        <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
}
