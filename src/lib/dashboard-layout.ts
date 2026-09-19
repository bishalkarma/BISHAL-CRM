/**
 * Where each dashboard widget sits, and how big it is.
 *
 * Saved on this device, like the currency and the revenue target. A layout is
 * a personal preference rather than business data, so it does not belong in
 * the shared database — and it will become per-account for free once logins
 * exist, because it is keyed by nothing else.
 */

export type WidgetId =
  | "kpi"
  | "types" // BUILD 03: Customers by type now top-right of KPI
  | "team"
  | "revenue"
  | "pipeline" // BUILD 03: Pipeline now beside Revenue at y7 (not top)
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
  // BUILD 04 — fix clipping seen in fresh pull screenshot: top row too short (h4=160px clips Types donut)
  // Increase to h5 (200px) for breathing room; KPI stays compact but types now fully visible, no bottom cutoff
  { i: "kpi", x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 3 },
  { i: "types", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
  // Team Performance full width just below Row 2 (y5)
  { i: "team", x: 0, y: 5, w: 12, h: 3, minW: 6, minH: 2 },
  // Revenue + Pipeline side-by-side below Team (as in 2nd reference: Revenue large left, Pipeline narrow right)
  { i: "revenue", x: 0, y: 8, w: 8, h: 7, minW: 4, minH: 6 },
  { i: "pipeline", x: 8, y: 8, w: 4, h: 7, minW: 3, minH: 5 },
  { i: "today", x: 0, y: 15, w: 12, h: 6, minW: 4, minH: 5 },

  /* SPANCOP + Top products */
  { i: "spancop", x: 0, y: 21, w: 6, h: 9, minW: 4, minH: 7 },
  { i: "products", x: 6, y: 21, w: 6, h: 9, minW: 3, minH: 5 },

  /* Activity mix + Why we lose — both on same row now (cleaner) */
  { i: "mix", x: 0, y: 30, w: 6, h: 8, minW: 3, minH: 5 },
  { i: "loss", x: 6, y: 30, w: 6, h: 8, minW: 3, minH: 5 },

  { i: "expected", x: 0, y: 38, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "samples", x: 6, y: 38, w: 6, h: 7, minW: 3, minH: 5 },

  { i: "cash", x: 0, y: 45, w: 12, h: 7, minW: 3, minH: 5 },
];

const KEY = "bishal-crm:dashboard-layout";
const LAYOUT_VERSION = "build04-fix-types-clipping-h5";

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
    // BUILD 04 fixes clipping where types donut was cut off at h4 — bump to h5, invalidate old h4 layouts
    if (version !== LAYOUT_VERSION) {
      window.localStorage.setItem(`${KEY}:version`, LAYOUT_VERSION);
      if (raw) {
        const parsed = JSON.parse(raw) as WidgetBox[];
        const isOld = Array.isArray(parsed) && parsed.some((b) => (b.i === "types" && b.h === 4) || (b.i === "kpi" && b.h === 4));
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
