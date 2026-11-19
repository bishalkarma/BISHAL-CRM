/**
 * Where each dashboard widget sits, and how big it is.
 */

export type WidgetId =
  | "kpi"
  | "types" // top-right of KPI
  | "revenue"
  | "pipeline"
  | "today"
  | "mix"
  | "spancop"
  | "loss"
  | "products"
  | "expected"
  | "samples"
  | "cash";

export type WidgetBox = {
  i: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
};

/** 12 columns, matching the proportions we agreed before drag was added. */
export const COLUMNS = 12;
export const ROW_HEIGHT = 40;

export const DEFAULT_LAYOUT: WidgetBox[] = [
  // Six compact KPIs in one full-width strip—no oversized three-across tiles.
  { i: "kpi", x: 0, y: 0, w: 12, h: 3, minW: 8, minH: 3 },
  { i: "revenue", x: 0, y: 3, w: 8, h: 7, minW: 4, minH: 6 },
  { i: "pipeline", x: 8, y: 3, w: 4, h: 7, minW: 3, minH: 5 },
  { i: "today", x: 0, y: 10, w: 12, h: 6, minW: 4, minH: 5 },

  // Journey and product performance share a balanced row.
  { i: "spancop", x: 0, y: 16, w: 6, h: 9, minW: 4, minH: 7 },
  { i: "products", x: 6, y: 16, w: 6, h: 9, minW: 3, minH: 5 },

  // Supporting distribution and outcome insights are paired evenly.
  { i: "mix", x: 0, y: 25, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "types", x: 6, y: 25, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "loss", x: 0, y: 32, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "expected", x: 6, y: 32, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "samples", x: 0, y: 39, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "cash", x: 6, y: 39, w: 6, h: 7, minW: 3, minH: 5 },
];

const KEY = "bishal-crm:dashboard-layout";
const LAYOUT_VERSION = "build18.19-compact-kpi-row";

function reconcile(saved: WidgetBox[]): WidgetBox[] {
  const byId = new Map(saved.map((b) => [b.i, b]));
  let nextY = Math.max(...saved.map((b) => b.y + b.h), 0);

  return DEFAULT_LAYOUT.map((fallback) => {
    const box = byId.get(fallback.i);
    if (!box) {
      const placed = { ...fallback, x: 0, y: nextY };
      nextY += fallback.h;
      return placed;
    }
    return { ...box, minW: fallback.minW, minH: fallback.minH };
  });
}

export function readLayout(): WidgetBox[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const version = window.localStorage.getItem(`${KEY}:version`);
    const raw = window.localStorage.getItem(KEY);
    // One-time reset so older saved arrangements don't preserve the overly-wide KPI row.
    if (version !== LAYOUT_VERSION) {
      window.localStorage.setItem(`${KEY}:version`, LAYOUT_VERSION);
      window.localStorage.removeItem(KEY);
      return DEFAULT_LAYOUT;
    }
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as WidgetBox[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAYOUT;
    return reconcile(parsed);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function writeLayout(boxes: WidgetBox[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(
        boxes.map(({ i, x, y, w, h, minW, minH }) => ({
          i,
          x,
          y,
          w,
          h,
          minW,
          minH,
        })),
      ),
    );
  } catch {
    // Private browsing can refuse writes; the layout still works in memory.
  }
}

export function clearLayout() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(`${KEY}:version`);
  } catch {
    /* nothing to undo */
  }
}
