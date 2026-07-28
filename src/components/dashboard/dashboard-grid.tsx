"use client";

import * as React from "react";
/*
  v2 splits its entry points: WidthProvider lives on the legacy export, and
  the package ships its own types, so @types/react-grid-layout is not used.
*/
import ReactGridLayout, {
  WidthProvider,
  type Layout,
} from "react-grid-layout/legacy";
import { GripVertical } from "lucide-react";
import {
  COLUMNS,
  ROW_HEIGHT,
  type WidgetBox,
  type WidgetId,
} from "@/lib/dashboard-layout";
import { cn } from "@/lib/utils";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const Grid = WidthProvider(ReactGridLayout);

/**
 * The arrangeable dashboard.
 *
 * Only active above `lg`. A widget six columns wide has nowhere to go in a
 * single-column phone view, so below that breakpoint the widgets simply stack
 * in their saved order — the arrangement is a desktop preference, not a
 * layout the phone can honour.
 *
 * Dragging is off unless editing. A dashboard that rearranges itself when you
 * meant to click a chart is worse than one that cannot move at all.
 */
export function DashboardGrid({
  layout,
  editing,
  onLayoutChange,
  children,
}: {
  layout: WidgetBox[];
  editing: boolean;
  onLayoutChange: (next: WidgetBox[]) => void;
  children: Partial<Record<WidgetId, React.ReactNode>>;
}) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const ordered = React.useMemo(
    () => [...layout].sort((a, b) => a.y - b.y || a.x - b.x),
    [layout],
  );

  // Phone and tablet: a plain stack in the same order, no grid at all.
  if (!isDesktop) {
    return (
      <div className="space-y-4">
        {ordered.map((box) => (
          <div key={box.i}>{children[box.i]}</div>
        ))}
      </div>
    );
  }

  const handleChange = (next: Layout) => {
    const byId = new Map(next.map((l) => [l.i, l]));
    onLayoutChange(
      layout.map((box) => {
        const moved = byId.get(box.i);
        return moved
          ? { ...box, x: moved.x, y: moved.y, w: moved.w, h: moved.h }
          : box;
      }),
    );
  };

  return (
    <Grid
      className={cn(editing && "rgl-editing")}
      layout={layout}
      cols={COLUMNS}
      rowHeight={ROW_HEIGHT}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      isDraggable={editing}
      isResizable={editing}
      draggableHandle=".widget-drag-handle"
      onLayoutChange={handleChange}
      // Widgets slide out of the way rather than overlapping.
      compactType="vertical"
      preventCollision={false}
    >
      {layout.map((box) => (
        <div key={box.i} className="min-w-0">
          <div className="relative h-full min-w-0">
            {editing && (
              <div
                className="widget-drag-handle absolute -top-2.5 left-1/2 z-20 flex -translate-x-1/2 cursor-grab items-center gap-1 rounded-full border border-accent/40 bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground shadow-sm active:cursor-grabbing"
                title="Drag to move"
              >
                <GripVertical className="size-3" />
                Move
              </div>
            )}
            <div
              className={cn(
                "h-full min-w-0 overflow-hidden",
                // Charts inside must not fight the grid for height.
                "[&>*]:h-full",
                editing &&
                  "rounded-2xl ring-2 ring-accent/40 ring-offset-2 ring-offset-background",
              )}
            >
              {children[box.i]}
            </div>
          </div>
        </div>
      ))}
    </Grid>
  );
}
