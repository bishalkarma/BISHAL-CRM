# BISHAL-CRM Build History

## Build 00 - Stable Baseline (Pre-Dashboard Revamp)
- **Date:** 2026-09-19
- **Commit:** (this commit)
- **Branch:** arena/019fd829-bishal-crm
- **Status:** Stable - All features working (Companies, Contacts, Deals, Pipeline, Activities, Reports, Settings with Team/Roles, Manager filtering, self-healing owners)
- **Source commit:** Derived from 4b3016e "Complete CRM: All features including Reports, Settings with Team/Roles, Manager filtering, self-healing owners" + role-based auth fixes
- **Rollback:** `git reset --hard <this-commit-hash>` to return here at any time

## Build 01 - Dashboard Revamp (Compact 8-Card + Role-Based) - PLANNED
- **Date:** 2026-09-19
- **Changes:**
  - New compact KPI layout: 2 rows × 4 cards (Total Customer, Total Deal + from X customers, Total Deal Worth, Activity Mix | Deal Won + worth + Win Rate, Deal Loss + worth + Loss Rate, Open Opportunities + from X customers, Avg Deal Size)
  - Compact card design (p-3, text-xl, not full-width stretch)
  - Activity Mix mini donut inside top row
  - Distinct customers calculation for Total Deal and Open Opportunities
  - Average Deal Size calculation
  - Keep all existing widgets (Revenue vs Target, Pipeline, Today, SPANCOP, Why We Lose, Top Products, Expected Close, Samples, Cash, Customer Type) - no removals
  - Role-based: Admin/Manager see team data, Sales Rep sees personal only (via existing data-provider filtering)
  - Mobile responsive: 4→2→1 grid stacking
  - No layout stretch, compact heights to avoid long scroll
