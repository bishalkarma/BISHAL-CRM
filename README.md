# Bishal Sales CRM

An enterprise-grade, mobile-first **B2B Sales CRM** built for trading companies,
distributors and hospitality suppliers (Hotels, Restaurants, Cafés, Hotel projects).

Designed to compete with Salesforce, HubSpot, Zoho, Monday CRM and Pipedrive —
while staying simple, modern and fast.

---

## Status: Part 1 complete — Design System, App Shell & Dashboard

| Part | Scope | Status |
| --- | --- | --- |
| **1** | Design system, theming, app shell, command palette, dashboard | ✅ Done |
| 2 | Deals pipeline (Kanban, drag & drop, forecasting) | Planned |
| 3 | Companies & Contacts (accounts, outlets, decision makers) | Planned |
| 4 | Activities, Quotations, Orders, Products | Planned |
| 5 | Reports, AI assistant, automations | Planned |
| 6 | Supabase auth, multi-tenancy & row-level security | Planned |

---

## Tech stack

- **Next.js 15.5** (App Router, React 19, Server Components)
- **TypeScript** — strict
- **Tailwind CSS v4** — CSS-first token config
- **Radix UI** primitives + custom shadcn-style components
- **Framer Motion** — Stripe-quality animation
- **Recharts** — dashboard visualisations
- **cmdk** — ⌘K command palette
- **Geist** — self-hosted premium typography
- **Supabase** — wired in Part 6 (deps already installed)

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm start        # serve production build
npm run lint     # eslint
```

---

## Theming — 6 palettes × light/dark

Users pick their palette in **Settings → Appearance**, from the command palette,
or via the 🎨 icon in the top bar. The choice persists in `localStorage` and is
applied before first paint (no flash).

| Theme | Primary | Accent | Best for |
| --- | --- | --- | --- |
| Modern Corporate Blue | `#1E3A8A` | `#3B82F6` | Trust, safety, traditional business tools |
| Vibrant Tech Teal | `#0F172A` | `#06B6D4` | Modern SaaS, speed, data dashboards |
| Warm Executive Amber | `#18181B` | `#F59E0B` | High-end sales, energy, premium clients |
| Signature Indigo | `#312E81` | `#6366F1` | Bold, modern product-led teams |
| Fresh Growth Emerald | `#064E3B` | `#10B981` | Revenue growth and momentum |
| Boutique Rose | `#4C0519` | `#F43F5E` | Hospitality and lifestyle brands |

Each theme defines its tokens in `src/app/globals.css` under
`[data-theme="<id>"]`, with a dark-mode override. Registry: `src/lib/themes.ts`.

**To add a theme:** append an entry to `THEMES` and add the matching CSS block —
nothing else needs to change.

---

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `⌘/Ctrl + K` | Command palette |
| `/` | Quick search |
| `?` | Shortcuts cheat sheet |
| `⌘/Ctrl + B` | Toggle sidebar |
| `⌘/Ctrl + J` | Toggle dark mode |
| `G` then `D` | Dashboard |
| `G` then `P` | Pipeline |
| `G` then `C` | Companies |
| `G` then `A` | Activities |
| `G` then `S` | Settings |
| `N` | New deal |

Shortcuts are suppressed while typing in inputs, textareas and editable fields.

---

## Mobile-first

- Bottom tab bar with animated active indicator (primary nav on phones)
- Slide-in drawer for full navigation
- Floating action button with radial speed-dial
- Safe-area insets for notched devices
- Tables collapse into cards below `sm`
- PWA manifest — installable to the home screen
- `prefers-reduced-motion` respected throughout

---

## Project structure

```
src/
├── app/
│   ├── (app)/              # authenticated shell routes
│   │   ├── dashboard/      # ✅ built
│   │   ├── settings/       # ✅ appearance & theming
│   │   └── ...             # pipeline, companies, … (roadmap pages)
│   ├── globals.css         # design tokens + 6 themes
│   ├── layout.tsx          # fonts, metadata, no-flash theme script
│   └── manifest.ts         # PWA
├── components/
│   ├── dashboard/          # KPI cards, charts, funnel, feed, leaderboard
│   ├── layout/             # shell, sidebar, topbar, palette, FAB, tab bar
│   ├── settings/           # appearance settings
│   ├── theme/              # theme provider + switchers
│   └── ui/                 # design-system primitives
└── lib/
    ├── demo-data.ts        # HORECA sample data (replaced by Supabase later)
    ├── navigation.ts       # nav + shortcut registry
    ├── themes.ts           # theme registry
    └── utils.ts            # cn, formatters, relative time
```

---

## Notes on data

Part 1 ships with a realistic HORECA demo dataset (`src/lib/demo-data.ts`) so the
dashboard can be evaluated with meaningful numbers. The types there
(`Deal`, `Activity`, …) are the contract the Supabase schema will implement in a
later part, so UI components won't need to change.
