/**
 * Bishal Sales CRM — accent theme registry.
 *
 * Each theme is a pair of colors applied on top of the light/dark mode:
 *  - `primary` drives the brand surfaces (sidebar rail, hero gradients)
 *  - `accent`  drives interactive elements (buttons, focus rings, charts)
 *
 * The actual color tokens live in `globals.css` under `[data-theme="<id>"]`.
 */

export type ThemeId =
  | "corporate-blue"
  | "tech-teal"
  | "executive-amber"
  | "signature-indigo"
  | "growth-emerald"
  | "boutique-rose";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  bestFor: string;
  /** Swatches shown in the theme picker (primary, accent). */
  swatch: { primary: string; accent: string };
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "corporate-blue",
    name: "Modern Corporate Blue",
    description: "Deep Blue + Bright Sky Blue",
    bestFor: "Trust, safety, and traditional business tools.",
    swatch: { primary: "#1E3A8A", accent: "#3B82F6" },
  },
  {
    id: "tech-teal",
    name: "Vibrant Tech Teal",
    description: "Dark Slate + Electric Teal",
    bestFor: "Modern SaaS, speed, and data dashboards.",
    swatch: { primary: "#0F172A", accent: "#06B6D4" },
  },
  {
    id: "executive-amber",
    name: "Warm Executive Amber",
    description: "Charcoal + Golden Amber",
    bestFor: "High-end sales, energy, and premium client management.",
    swatch: { primary: "#18181B", accent: "#F59E0B" },
  },
  {
    id: "signature-indigo",
    name: "Signature Indigo",
    description: "Midnight Indigo + Electric Violet",
    bestFor: "Product-led teams that want a bold, modern feel.",
    swatch: { primary: "#312E81", accent: "#6366F1" },
  },
  {
    id: "growth-emerald",
    name: "Fresh Growth Emerald",
    description: "Forest Green + Vivid Emerald",
    bestFor: "Revenue growth, targets, and positive momentum.",
    swatch: { primary: "#064E3B", accent: "#10B981" },
  },
  {
    id: "boutique-rose",
    name: "Boutique Rose",
    description: "Deep Plum + Warm Rose",
    bestFor: "Hospitality, boutique hotels, and lifestyle brands.",
    swatch: { primary: "#4C0519", accent: "#F43F5E" },
  },
];

export const DEFAULT_THEME: ThemeId = "corporate-blue";

export const THEME_STORAGE_KEY = "bishal-crm-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && THEMES.some((theme) => theme.id === value)
  );
}
