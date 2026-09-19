# BISHAL-CRM Build History

## Build 00 - Stable Baseline (Pre-Dashboard Revamp)
- **Date:** 2026-09-19
- **Commit:** (this commit)
- **Branch:** arena/019fd829-bishal-crm
- **Status:** Stable - All features working (Companies, Contacts, Deals, Pipeline, Activities, Reports, Settings with Team/Roles, Manager filtering, self-healing owners)
- **Source commit:** Derived from 4b3016e "Complete CRM: All features including Reports, Settings with Team/Roles, Manager filtering, self-healing owners" + role-based auth fixes
- **Rollback:** `git reset --hard <this-commit-hash>` to return here at any time

## Build 01 - Dashboard Revamp (Compact 8-Card + Role-Based) - ✅ BUILT 2026-09-19
- **Commit:** d81feff → (this commit)  (BUILD 01)
- **Branch:** arena/019fd829-bishal-crm
- **Status:** ✅ Build completed, `npm run build` passed (Compiled successfully, 159kB dashboard)
- **Changes:**
  - **New compact KPI layout:** 2 rows × 4 cards, `grid-cols-2 lg:grid-cols-4 gap-3`, each card `min-h-[118px] p-3` — not full-width stretch, revenue chart stays above fold
    - **Row 1:** Total Customers (`All time`/`in this period`), Total Deals (`from X customers`), Total Deal Worth (money + period label), Activity Mix (mini 44px conic-gradient donut + top 3 labels)
    - **Row 2:** Deals Won (`worth` + `Win rate %` footer in success tint), Deals Lost (`worth` + `Loss rate %` in danger tint), Open Opportunities (`from X customers` + `open value`), Avg Deal Size (`across N deals`)
  - **Metrics added** in `src/lib/dashboard-metrics.ts`: `distinctCustomerCount()`, `openOpportunities()`, `openOpportunitiesSummary()`, `averageDealSize()`, `dealsByOwner()` (owner performance leaderboard)
  - **Team Performance card** `src/components/dashboard/team-performance-card.tsx`: Admin/Manager see full team leaderboard (ranked by total value, bar + You badge), Sales Rep sees personal performance — both filtered via existing `data-provider` role filtering
  - **Layout compacted** in `src/lib/dashboard-layout.ts`: kpi h 5→6, revenue/pipeline h 8→7, today h 8→7, subsequent y offsets tightened (20/29/37/45) — avoids long scroll, saves ~80px vertical space
  - **All existing widgets preserved** (Revenue vs Target, Pipeline by Stage, Today, Activity Mix full chart, SPANCOP, Customer Type, Why We Lose, Top Products, Expected to Close, Samples, Cash) — no removals
  - **Mobile responsive:** 2 cols on mobile (4 rows), 4 cols on desktop (2 rows), cards stay `text-xl` not `text-5xl`, gap-3 not full stretch, tested via `DashboardGrid` lg breakpoint
  - **Build verified:** `npm run build` ✓ Compiled successfully in 25.3s, no TS errors
- **Files touched:**
  - `src/components/dashboard/kpi-block.tsx` (full rewrite to 8-card compact)
  - `src/components/dashboard/dashboard-view.tsx` (new metrics, team strip, new KpiBlock props)
  - `src/lib/dashboard-metrics.ts` (new helpers)
  - `src/lib/dashboard-layout.ts` (compact heights)
  - `src/components/dashboard/team-performance-card.tsx` (new)
- **Rollback:**
  - To **BUILD 00**: `git log --oneline` find `BUILD 00` (d81feff), then `git reset --hard d81feff && git push --force` or `git revert`
  - To **BUILD 01**: this commit — `git reset --hard <this-hash>`
- **Next build:** BUILD 02 will be numbered sequentially

## Build 02 - Compact 6-Card + Pipeline Right + Team Below — ✅ BUILT 2026-09-19
- **Commit:** d3db97a (BUILD 01) → (this commit) (BUILD 02)
- **Branch:** arena/019fd829-bishal-crm
- **Status:** ✅ Build completed, `npm run build` passed (Compiled successfully, 159 kB dashboard)
- **User feedback addressed (4 points):**
  1. **Team Performance moved** from top → **just below Row 2** (now a draggable widget `team` at y5, full width 12 cols, h4). Keeps “move/resize” feature — all widgets remain in `DashboardGrid` with `Edit layout` → drag handle and corner resize.
  2. **Removed 2 duplicate cards** from top: `Activity Mix` (mini donut) and `Open Opportunities` — both already exist as full widgets lower (Activity Mix full donut + Open deals via Pipeline). Top now **6 cards** not 8.
  3. **Cards made even more compact** + **Pipeline moved to right of Row 1+Row 2:**
     - KPI cards: `min-h 118px → 96px`, `p-3 → p-2.5`, `text-xl → text-lg/lg:xl`, `gap-3 → gap-2`, `grid-cols-2 lg:grid-cols-4 → grid-cols-2 sm:grid-cols-3` (3 per row, so 6 cards = 3×2). Content now fits tightly inside card with no wasted padding — as in your 2nd reference image.
     - KPI widget: `w12 h6 → w8 h5` (left 66% width). Pipeline widget: `x8 y0 w4 h5` (right 33% width, same height as KPI, side-by-side). Tight, no full-width stretch, exactly like reference layout.
  4. **Reference layout replicated:** KPI (6 cards left) + Pipeline (right tall) on top, Team below (full width), then Revenue (w8) + Customers by type (w4) side-by-side, then Today, SPANCOP+Products, etc. — matches your 2nd image.
- **Files touched:**
  - `src/components/dashboard/kpi-block.tsx` — rewrote to 6-card compact 3×2, removed MiniDonut and Open cards, tightened padding/height
  - `src/components/dashboard/dashboard-view.tsx` — removed open* calculations and ActivityMix prop, moved TeamPerformance from outside grid → inside `team` slot, KpiBlock now 6 props
  - `src/lib/dashboard-layout.ts` — added `team` WidgetId, new DEFAULT_LAYOUT: kpi w8 + pipeline w4 on y0, team y5 w12 h4, revenue+types y9 side-by-side, today y16, spancop/products y23, mix/loss y32, expected/samples y40, cash y47 full width; added `LAYOUT_VERSION = build02-6card-pipeline-right` with auto-migration (clears old saved layouts that had w12 KPI or missing team)
  - `src/lib/dashboard-metrics.ts` — no change (helpers kept for future), but open helpers no longer used in KPI
- **All existing widgets preserved + draggable/resizable:** Every card (including new Team) is inside `DashboardGrid` → `Edit layout` button → drag `Move` tab and resize corners. Layout saved per-device in localStorage, survives refresh, versioned.
- **Mobile responsive:** Top row becomes `kpi` stacked above `pipeline` on <lg (single column fallback in DashboardGrid), KPI internal `grid-cols-2` (mobile 3 rows) → `sm:grid-cols-3` (desktop 2 rows). Pipeline stays tall but stacks below KPI on phone — no horizontal overflow.
- **Build verified:** `npm run build` ✓ Compiled successfully, no TS errors
- **Rollback:**
  - To **BUILD 00** (stable pre-revamp): `git reset --hard BUILD_00`
  - To **BUILD 01** (8-card): `git reset --hard BUILD_01`
  - To **BUILD 02** (this): this commit
- **Next build:** BUILD 03 will be numbered sequentially

## Build 03 - Next Planned (Reserved)
- Awaiting user direction
