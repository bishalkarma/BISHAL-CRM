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

## Build 02 - Next Planned (Reserved)
- Awaiting user direction
