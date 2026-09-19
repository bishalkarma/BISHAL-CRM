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
  // BUILD 08 — fix crushed Types + flat tiles: top row h4->h5 (160->200px) gives Types breathing room, KPI tiles more square
  // KPI tiles min-h 72->88px + p-1.5->p-2 makes them square-ish (88px tall vs ~260px wide = ~3:1 not 4.7:1 flat), content fills tile
  { i: "kpi", x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
  { i: "types", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
  // Revenue + Pipeline now directly below KPI+Types (y5), no Team gap
  { i: "revenue", x: 0, y: 5, w: 8, h: 7, minW: 4, minH: 6 },
  { i: "pipeline", x: 8, y: 5, w: 4, h: 7, minW: 3, minH: 5 },
  { i: "today", x: 0, y: 12, w: 12, h: 6, minW: 4, minH: 5 },

  /* SPANCOP + Top products */
  { i: "spancop", x: 0, y: 18, w: 6, h: 9, minW: 4, minH: 7 },
  { i: "products", x: 6, y: 18, w: 6, h: 9, minW: 3, minH: 5 },

  /* Activity mix + Why we lose */
  { i: "mix", x: 0, y: 27, w: 6, h: 8, minW: 3, minH: 5 },
  { i: "loss", x: 6, y: 27, w: 6, h: 8, minW: 3, minH: 5 },

  { i: "expected", x: 0, y: 35, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "samples", x: 6, y: 35, w: 6, h: 7, minW: 3, minH: 5 },

  { i: "cash", x: 0, y: 42, w: 12, h: 7, minW: 3, minH: 5 },
];

const KEY = "bishal-crm:dashboard-layout";
const LAYOUT_VERSION = "build08-square-tiles-uncrushed-types-h5";

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
    // BUILD 08: top row h4->h5 to make tiles square + uncrush Types, remove Team — bump version
    if (version !== LAYOUT_VERSION) {
      window.localStorage.setItem(`${KEY}:version`, LAYOUT_VERSION);
      if (raw) {
        const parsed = JSON.parse(raw) as WidgetBox[];
        const isOld = Array.isArray(parsed) && parsed.some((b) => b.i === "kpi" && b.h === 4);
        if (isOld) {
          window.localStorage.removeItem(KEY);
          return DEFAULT_LAYOUT;
        }
      } else {
        return DEFAULT_LAYOUT;
      }
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
