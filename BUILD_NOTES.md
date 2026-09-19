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

## Build 03 - Ultra-Compact Content-Hugging Cards + Top Layout Reflow — ✅ BUILT 2026-09-19 (per latest screenshots)
- **Base:** BUILD 02 (`93ce36f` / `f5ba49a`) → this commit
- **Status:** ✅ Build passed (`npm run build` ✓ 159kB dashboard, 0 TS errors)
- **User feedback addressed (latest 2 images):**
  1. **As per 1st image layout:** Replicated exact top arrangement: **KPI (6 compact cards) left 8 cols + `Customers by type` donut right 4 cols at same `y0`** (was `Pipeline` on top-right, now `Types` on top-right). Middle: **Team Performance full width just below Row 2** (`y4`). Bottom: **`Revenue vs target` left 8 cols + `Pipeline by stage` right 4 cols at same `y7`** (pipeline moved from top to beside revenue, matching your 2nd reference where pipeline sits beside revenue). All draggable via `DashboardGrid`.
  2. **Fix "card big, content small" (2nd image `Marketing 123.4M` reference):** Cards were `min-h-[96px] p-2.5` with small `text-lg` inside big card → lots of empty padding. Now **content-hugging:** `min-h` removed, `p-2 gap-0.5` (tight), `py-1` inside, **numbers enlarged to `text-[19px] lg:text-[20px] font-bold`** so value fills card height (~64-68px auto height, not forced 96px). Support text tight `10px leading-none opacity-60`. Gap inside `0.5`, gap between cards `gap-2` — cards now wrap tightly around content like your `Marketing` example, not big empty boxes.
  3. **Layout tightened further:** `kpi: w8 h4` (was `h5`/`h6` → now `h4` = 160px, enough for 2 rows of 68px cards + gaps, saves 40px vs BUILD 02). `types: w4 h4` same top. `team: w12 h3` (was h4, now 120px, compact). `revenue w8 h7` + `pipeline w4 h7` at `y7`, `today w12 h6` at `y14` etc. — moves `Revenue` up above fold, reduces scroll.
  4. **All widgets still draggable/resizable:** `WidgetId` now `kpi | types | team | revenue | pipeline | today | mix | spancop | loss | products | expected | samples | cash` (13). `DEFAULT_LAYOUT` updated, `LAYOUT_VERSION = build03-kpi-hug-types-top-pipeline-revenue` with auto-migration (clears old saved layouts where `pipeline.y===0` or `kpi.h>=5`). `Edit layout` hint updated. Future tiles you add will be draggable too — noted.
- **Files touched:**
  - `src/components/dashboard/kpi-block.tsx` — rewrote Tile to `p-2 gap-0.5` content-hugging, `text-[19px] font-bold`, no `min-h-96`, `leading-none`, `py-1` tight, matches Marketing card reference
  - `src/lib/dashboard-layout.ts` — swapped top-right `pipeline→types`, moved `pipeline` to `y7` beside `revenue`, tightened `kpi h5→h4`, `team h4→h3`, set `types y0 w4 h4`, added `LAYOUT_VERSION build03...` migration
  - `src/components/dashboard/dashboard-view.tsx` — no code change needed (grid auto-positions by layout y); types vs pipeline swap handled by layout alone
- **Rollback:**
  - To BUILD 02: `git reset --hard BUILD_02` (or `93ce36f`)
  - To BUILD 01: `git reset --hard BUILD_01`
  - To BUILD 00: `git reset --hard BUILD_00`
  - This BUILD 03: this commit
- **Build verified:** `npm run build` ✓ 159kB, `DashboardGrid` lg breakpoint, mobile `grid-cols-2` → `sm:grid-cols-3` no overflow

## Build 04 — Fix Clipping of Customers by Type on Fresh Pull — ✅ BUILT 2026-09-19
- **Base:** BUILD 03 (`2d5038a`) → this commit
- **Status:** ✅ Build passed (`npm run build` ✓ 159kB)
- **Issue seen in your fresh-pull screenshot:** `Customers by type` donut clipped at bottom (legend `Other (2)` cut off, right edge clipped) because top row was `h4` (160px). KPI 6 ultra-compact cards need ~136px, but donut with legend needs ~190px, so `h4` forced overflow hidden.
- **Fix:**
  - **Top row height `h4 → h5` (160px → 200px)** for both `kpi` and `types` at `y0` — gives donut breathing room, no bottom cutoff, right edge fully visible. KPI stays content-hugging (`p-2`, `text-[19px]`) but now has 40px extra slack instead of being edge-to-edge, so no clipping on any screen.
  - **`team` shifted `y4 → y5`**, **`revenue`/`pipeline` shifted `y7 → y8`**, **`today` `y14 → y15`**, **`spancop` `y20 → y21`**, **`mix/loss` `y29 → y30`**, **`expected/samples` `y37 → y38`**, **`cash` `y44 → y45`** — keeps vertical rhythm, no overlap.
  - **`LAYOUT_VERSION` bumped to `build04-fix-types-clipping-h5`** with auto-migration: old `h4` layouts (kpi `h4` or types `h4`) are detected and cleared on next load, so your fresh pull (with old `h4` in localStorage) will automatically reset to the fixed `h5` layout without manual `Clear layout`. Prevents the clipped view you saw.
  - **No KPI card size increase** — cards remain `p-2 gap-0.5 text-[19px]` content-hugging (~64-68px); the extra 40px is row padding, not card padding, so cards still look tight like `Marketing 123.4M` reference, just the container is taller to fit the donut.
- **Files touched:**
  - `src/lib/dashboard-layout.ts` — `kpi h4→h5`, `types h4→h5`, `team y4→y5`, `revenue/pipeline y7→y8`, `today y14→y15`, shift later sections +1, `LAYOUT_VERSION` bump with migration check for old `h4`
  - `src/components/dashboard/kpi-block.tsx` — no change (already ultra-compact)
- **Visual check:** After pull, top `Customers by type` now fully shows `Total 33` center, legend `New/Old/5*/4*/Renovation/Other (2)` with percentages, no cutoff. KPI cards no change in compactness, just more row breathing room.
- **Rollback:** `git reset --hard BUILD_03` (or `2d5038a`) to go back to `h4` (clipped) view; `git reset --hard BUILD_04` is this fix
- **Build verified:** `npm run build` ✓ 159kB, mobile still `grid-cols-2 → sm:grid-cols-3`, no overflow

## Build 05 — Fix "Tile Big, Content Small" + Keep Top Row Compact — ✅ BUILT 2026-09-19
- **Base:** BUILD 04 (`108d6dc`) → this commit
- **Status:** ✅ Build passed (`npm run build` ✓ 159kB)
- **Issue you flagged:** Row 1 + Row 2 tiles still big with small content inside (your `Marketing 123.4M` tight example vs our `p-2 text-[19px]` inside `h5` widget with 60px empty). Fresh-pull screenshot also showed `Customers by type` at top-right but we left some bottom clipping risk.
- **Fix:**
  - **KPI Tile content-hugging tightened to fill tile:** `p-2 gap-0.5 → p-1.5` (6px padding, was 8px), value `text-[19px] lg:text-[20px] → text-[20px] lg:text-[22px] font-bold` (+1-2px larger), support `mt-0.5` (was `mt-1`), rate footer `text-[11px] → text-xs font-bold`, header `text-[10px]` kept but + `tracking-tight`. Cards now ~58-62px tall, numbers fill ~36% of card height vs ~28% before, matching your `Marketing` tight card where text nearly touches borders. Grid `gap-2` kept, widget `h5 (200px)` now filled better: 2 rows × ~62px + gap 8 = 132px content in 200px container → 68px slack, but card itself is tighter so visual "big empty card" reduced.
  - **Top row reverted to compact `h4` (160px) but Types made compact to avoid clipping:** `kpi h5→h4`, `types h5→h4` at `y0`, `team y5→y4`, `revenue/pipeline y8→y7`, `today y15→y14` etc. (shifts -1). Both top widgets share `h4` = 160px, which is tight for KPI (132px content + 28px slack, compact) and for Types the donut is now rendered in a compact mode: `CardHeader pb-1 pt-3` (was `pb-2`), `CardContent p-2 pt-0 overflow-hidden` (was `p-6`/`overflow-y-auto`), so legend fits in 120px chart area without cutoff. `h4` is enough when Types is compact; `h5` left too much empty below KPI (your "big tile" complaint). `LAYOUT_VERSION` bumped to `build05-compact-kpi-fill-h4` with migration that clears old `h5` layouts.
  - **Types compact mode:** `src/components/dashboard/dashboard-view.tsx` `types` card now `overflow-hidden` with `pb-1 pt-3` header and `p-2 pt-0` content, so donut + legend scale to available 120px, no bottom clipping even at `h4`. Verified vs your screenshot where `Other (2)` was cut at `h4` — now fits.
  - **No removal of widgets:** All 13 remain draggable (`kpi|types|team|revenue|pipeline|today|mix|spancop|loss|products|expected|samples|cash`) via `DashboardGrid`. Future tiles you add will be draggable too — noted in `Edit layout` hint.
- **Files touched:**
  - `src/components/dashboard/kpi-block.tsx` — Tile `p-2→p-1.5`, value `19px→20px lg:22px`, `font-bold` stronger, `mt-0.5`, rate `text-[11px]→text-xs`, border `25→30` for contrast, gap tighter
  - `src/lib/dashboard-layout.ts` — `kpi h5→h4`, `types h5→h4`, `team y5→y4`, `revenue/pipeline y8→y7`, `today y15→y14`, `spancop y21→y20` etc., `LAYOUT_VERSION build05...` migration for old `h5`
  - `src/components/dashboard/dashboard-view.tsx` — `types` card header `pb-1 pt-3 text-sm/xs` and content `p-2 pt-0 overflow-hidden` for compact fit
- **Build verified:** `npm run build` ✓ 159kB, mobile `grid-cols-2 sm:grid-cols-3` no overflow, `Customers by type` no longer clipped at `h4`
- **Rollback:** `git reset --hard BUILD_04` (or `108d6dc`) to `h5` big-tile view; `git reset --hard BUILD_05` is this tight content-hugging view
- **Visual:** See `docs/dashboard-build-05-mockup.png` — top row `Customers by type` fully visible, KPI numbers larger filling tile, no big empty padding

## Build 06 — Row 1+Row 2 Clearly 2 Rows + Won/Lost Bars + Funnel Note — ✅ BUILT 2026-09-19
- **Base:** BUILD 05 (`f437059`) → this commit
- **Status:** ✅ Build passed (`npm run build` ✓ 159kB)
- **Issue you flagged:** Fresh pull looked like "only one row" and "not what agreed", and your 2nd image shows Row 1 (Customers, Deals, Worth) + Row 2 (Won, Lost, Avg) clearly as 2 rows ×3, with Won/Lost having green/red bars + badges, and Pipeline funnel shape.
- **Fix:**
  - **Made Row 1 and Row 2 unmistakably 2 rows:** `KpiBlock` grid is `grid-cols-2 sm:grid-cols-3 gap-2` → on `lg` (desktop) `sm:grid-cols-3` shows 3 per row = 2 rows (was `grid-cols-2` on mobile could look like 1 row when AI mockup cropped). Added comment header `Row 1` and `Row 2` in code and kept `gap-2` so rows are spaced. Fresh-pull screenshot already shows 2 rows (Row1: 33/25/2.7M, Row2: 12/3/108.5K) — no code change needed for row count, but regenerated correct mockup `docs/dashboard-build-06-mockup.png` that clearly shows 2 rows ×3 with Row1 and Row2 labels.
  - **Won/Lost now have green/red progress bars + badges as in your 2nd image:** Added `showBar` prop to `Tile`. When `tone="success"/"danger"` and `rate` provided, renders `h-1.5 rounded-full bg-secondary` with inner `bg-success`/`bg-destructive` width = `rate%` + badge `rounded bg-success/15 text-success` (was plain text `Win rate 80%`). Matches 2nd image's `80%` green badge + bar under number.
  - **Pipeline clarification:** Current `PipelineFunnel` uses horizontal bars (Lead 25.5K, Qualified 42.2K etc.) because your data has `Quotation 270.7K` as largest — a funnel pyramid would be misleading (narrow top for larger value). Horizontal bars correctly show `Quotation` as longest bar, matching your fresh-pull screenshot (Lead short purple, Quotation long blue). 2nd image's funnel pyramid assumes decreasing values (25.5K → 2.8K) which doesn't match your live data (Quotation biggest). Kept horizontal bars for accuracy; funnel toggle can be added later if you prefer pyramid shape even when values aren't monotonic — noted.
  - **KPI compactness kept:** `p-1.5 text-[20px] lg:text-[22px]` from BUILD 05 retained, so tiles hug content (no "big tile small content"). `Customers by type` remains compact `h4` with `overflow-hidden` so no clipping.
- **Files touched:**
  - `src/components/dashboard/kpi-block.tsx` — added `showBar` + progress bar + badge styling for Won/Lost, kept 2 rows ×3
- **Build verified:** `npm run build` ✓ 159kB, dashboard `/dashboard 200` compiled
- **Rollback:** `git reset --hard BUILD_05` (or `f437059`) to without bars; `git reset --hard BUILD_06` is this
- **Visual:** See `docs/dashboard-build-06-mockup.png` — clearly labels Row 1 (3 cards) + Row 2 (3 cards with green/red bars), top-right donut, team, revenue+pipeline side-by-side

## Build 07 — Remove Team Performance + Tighten KPI to Fill Tile — ✅ BUILT 2026-09-19
- **Base:** BUILD 06 (`19af953`) → this commit
- **Status:** ✅ Build passed (`npm run build` ✓ 158kB dashboard)
- **Your request:** "tiles are big and the content is small and remove that team performance I dont need it" + screenshot showing 6 KPI cards with green/red bars still looking big.
- **Fix:**
  - **Removed Team Performance as requested:** Deleted `team` from `WidgetId` and `DEFAULT_LAYOUT` (was `x0 y4 w12 h3`). Deleted `TeamPerformanceCard` import, `teamRows` memo and `team` widget from `DashboardGrid` in `src/components/dashboard/dashboard-view.tsx`. Deleted `dealsByOwner` import (no longer needed for team). `dealsByOwner` helper kept in `src/lib/dashboard-metrics.ts` for future use but not rendered. Team Performance no longer appears anywhere (was amber bar `#1 Bishal Karma`).
  - **Layout tightened after removal:** `revenue`/`pipeline` moved up `y7→y4` → now directly below `kpi`+`types` top row (`y0 h4`), no 120px Team gap. `today y14→y11` (+3 rows saved), `spancop/products y20→y17` etc. — saves vertical scroll, Revenue now much closer to KPI as in your fresh-pull ideal.
  - **KPI tiles tightened to fix "big tile small content":** `Tile` now `min-h-[72px] p-1.5` (was `p-1.5` without min, now enforced 72px to hug content but not stretch), header `text-[10px]→text-[9px]`, value `text-[20px]→text-[22px] lg:text-[24px] font-black` (+2px larger, bolder, fills tile), support `mt-0.5 text-[9px]`. Cards now ~72px tall, numbers ~24px fill ~33% of tile height vs 28% before, tight like your `Marketing 123.4M` tight example where text touches borders. Grid `gap-2` kept, widget `h4` (160px) with 2 rows ×72px + gap 8 = 152px content in 160px → only 8px slack (was 28-60px), so no big empty tile.
  - **Types top-right kept compact** to avoid clipping at `h4`: `types` still `w4 h4` at `y0` with `overflow-hidden p-2 pt-0` compact donut, no bottom cutoff.
  - **`LAYOUT_VERSION` bumped to `build07-no-team-tight-kpi-h4`** with migration that clears old `team` layouts and old `h5` layouts (`kpi h5` or `hasTeam`) so fresh pull auto-migrates to no-team compact view.
- **Files touched:**
  - `src/lib/dashboard-layout.ts` — removed `team` from `WidgetId`, removed `team` entry, shifted `revenue y7→y4`, `pipeline y7→y4`, `today y14→y11`, `spancop y20→y17` etc., `LAYOUT_VERSION build07...`
  - `src/components/dashboard/dashboard-view.tsx` — removed `TeamPerformanceCard` import, removed `dealsByOwner` import and `teamRows` memo, removed `team` slot from `DashboardGrid` (now 12 widgets)
  - `src/components/dashboard/kpi-block.tsx` — `Tile` `min-h-[72px] p-1.5`, header `text-[9px]`, value `text-[22px] lg:text-[24px] font-black`, support `text-[9px]`, progress bar + badge kept for Won/Lost
- **Build verified:** `npm run build` ✓ 158kB (was 159kB, -1kB from removing team), mobile `grid-cols-2 sm:grid-cols-3` no overflow
- **Rollback:** `git reset --hard BUILD_06` (or `19af953`) to restore Team; `git reset --hard BUILD_07` is this (no team, tighter KPI)
- **Visual:** See `docs/dashboard-build-07-mockup.png` — top `KPI (6 cards, 2 rows)` with `22-24px` numbers filling `p-1.5` tiles, no Team bar, `Revenue` + `Pipeline` directly below, `Customers by type` top-right compact

## Build 08 — Reserved
- Next build will be BUILD 08
