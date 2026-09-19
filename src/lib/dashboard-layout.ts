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
  | "team"
  | "revenue"
  | "pipeline"
  | "today"
  | "mix"
  | "spancop"
  | "types"
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
  // BUILD 02 — KPI (6 cards, 3×2, compact 96px) + Pipeline on the right share top row
  // User 2nd image reference: KPI left 8cols, Pipeline right 4cols, Team below, then Revenue+Types
  { i: "kpi", x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
  { i: "pipeline", x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
  // Team Performance now a draggable widget just below Row 2
  { i: "team", x: 0, y: 5, w: 12, h: 4, minW: 6, minH: 3 },
  // Revenue + Customers by type side-by-side as in reference image
  { i: "revenue", x: 0, y: 9, w: 8, h: 7, minW: 4, minH: 6 },
  { i: "types", x: 8, y: 9, w: 4, h: 7, minW: 3, minH: 5 },
  { i: "today", x: 0, y: 16, w: 12, h: 7, minW: 4, minH: 5 },

  /* SPANCOP does not move. Top products sits beside it because it is a
     scrolling list — it fills a tall tile without leaving a gap, which a
     four-bar chart could not. */
  { i: "spancop", x: 0, y: 23, w: 6, h: 9, minW: 4, minH: 7 },
  { i: "products", x: 6, y: 23, w: 6, h: 9, minW: 3, minH: 5 },

  /* Activity mix + Why we lose */
  { i: "mix", x: 0, y: 32, w: 6, h: 8, minW: 3, minH: 5 },
  { i: "loss", x: 6, y: 32, w: 6, h: 8, minW: 3, minH: 5 },

  { i: "expected", x: 0, y: 40, w: 6, h: 7, minW: 3, minH: 5 },
  { i: "samples", x: 6, y: 40, w: 6, h: 7, minW: 3, minH: 5 },

  { i: "cash", x: 0, y: 47, w: 12, h: 7, minW: 3, minH: 5 },
];

const KEY = "bishal-crm:dashboard-layout";
const LAYOUT_VERSION = "build02-6card-pipeline-right";

/** Widgets are added over time; an old saved layout must not hide a new one. */
function reconcile(saved: WidgetBox[]): WidgetBox[] {
  const byId = new Map(saved.map((b) => [b.i, b]));
  let nextY = Math.max(...saved.map((b) => b.y + b.h), 0);

  return DEFAULT_LAYOUT.map((fallback) => {
    const box = byId.get(fallback.i);
    if (!box) {
      // Unknown to this saved layout — drop it in below everything else.
      const placed = { ...fallback, x: 0, y: nextY };
      nextY += fallback.h;
      return placed;
    }
    // Keep position and size, but re-apply current minimums.
    return { ...box, minW: fallback.minW, minH: fallback.minH };
  });
}

export function readLayout(): WidgetBox[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const version = window.localStorage.getItem(`${KEY}:version`);
    const raw = window.localStorage.getItem(KEY);
    // BUILD 02 changed the top row to KPI+Pipeline side-by-side and added Team.
    // Invalidate old saved layouts that predate this version so the new arrangement shows.
    if (version !== LAYOUT_VERSION) {
      window.localStorage.setItem(`${KEY}:version`, LAYOUT_VERSION);
      if (raw) {
        const parsed = JSON.parse(raw) as WidgetBox[];
        const hasTeam = Array.isArray(parsed) && parsed.some((b) => b.i === "team");
        const kpiIsFullWidth = Array.isArray(parsed) && parsed.some((b) => b.i === "kpi" && b.w === 12);
        if (!hasTeam || kpiIsFullWidth) {
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
    // A corrupt layout should never leave the dashboard blank.
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
