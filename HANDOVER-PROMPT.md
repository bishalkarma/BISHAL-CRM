# HANDOVER PROMPT — Bishal Sales CRM

Copy everything below and paste it into a new AI chat to hand over this project.

---

## 📋 HANDOVER: Bishal Sales CRM — Full Project Context

You are taking over development of **Bishal Sales CRM**, a B2B sales CRM for a food & beverage distribution company in Dubai, UAE. The project is at `https://github.com/bishalkarma/BISHAL-CRM` on the `development` branch.

---

## ⚠️ CRITICAL RULES — READ FIRST

1. **NEVER assume anything.** If you are confused about ANYTHING, ASK the user before making changes.
2. **DO NOT change a single line of code** in the CRM app unless the user explicitly tells you to build or fix something specific.
3. **Understand the full context first** — ask questions until you fully understand, then ONLY build what the user asks.
4. **All changes go on the `development` branch.** The user tests on development, then merges to `main` when satisfied.
5. **The user has only 2 branches: `main` (production) and `development` (testing).** Never create or push to any other branch.
6. **The user is NOT a developer.** They pull code, run `npm install`, `npm run dev`, and test. They need clear, simple instructions.

---

## 🏗️ TECHNOLOGY STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.21 (App Router) |
| Language | TypeScript (React 19) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (username-based login) |
| UI Components | Radix UI + shadcn/ui (custom) |
| Styling | Tailwind CSS with custom theme system |
| Charts | Recharts |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit (pipeline board) |
| Icons | Lucide React |
| Dark/Light Mode | next-themes |

---

## 📁 PROJECT STRUCTURE

```
BISHAL-CRM/
├── src/
│   ├── app/
│   │   ├── (app)/                    # Authenticated app pages
│   │   │   ├── activities/page.tsx   # Activity journal page
│   │   │   ├── companies/page.tsx    # Companies (customers) page
│   │   │   ├── contacts/page.tsx     # Contacts page
│   │   │   ├── dashboard/page.tsx    # Main dashboard
│   │   │   ├── layout.tsx            # App layout (AuthGuard + AppShell)
│   │   │   ├── pipeline/page.tsx     # Deals pipeline (kanban board)
│   │   │   ├── reports/page.tsx      # Reports & analytics
│   │   │   ├── settings/page.tsx     # Settings (team, themes, currency)
│   │   │   ├── orders/page.tsx       # Coming Soon
│   │   │   ├── products/page.tsx     # Coming Soon
│   │   │   └── quotations/page.tsx   # Coming Soon
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Login & me endpoints
│   │   │   ├── team/                 # User CRUD, roles, manager assignment, fix-stale-owners
│   │   │   ├── notifications/        # Notifications CRUD
│   │   │   ├── transfer-history/     # Ownership transfer log
│   │   │   ── admin/reset-data/     # Reset all data
│   │   ├── login/page.tsx            # Login page
│   │   ├── page.tsx                  # Landing → redirects to login/dashboard
│   │   └── layout.tsx                # Root layout (providers, fonts)
│   ├── components/
│   │   ├── activities/               # Activity journal components
│   │   ├── auth/                     # Auth guard & login form
│   │   ├── companies/                # Companies list, table, drawer, SPANCOP funnel
│   │   ├── contacts/                 # Contacts list & dialogs
│   │   ├── dashboard/                # Dashboard widgets (KPIs, charts, tiles)
│   │   ├── deals/                    # Deal creation, line items, company picker
│   │   ├── layout/                   # Sidebar, topbar, app shell, command palette, FAB
│   │   ├── providers/                # DataProvider (Supabase data context)
│   │   ├── reports/                  # Sales performance, pipeline health, customer revenue
│   │   ├── settings/                 # Team settings, danger zone, theme picker, currency
│   │   └── ui/                       # Reusable UI components (button, card, dialog, etc.)
│   ├── hooks/
│   │   └── use-current-user.ts       # Current user hook
│   └── lib/                          # Business logic & data models
│       ├── companies.ts              # Company model, demo data, types
│       ├── contacts.ts               # Contact model
│       ├── deals.ts                  # Deal model, demo data
│       ├── deal-model.ts             # Line items, fulfilment, ageing logic
│       ├── spancop.ts                # SPANCOP stage engine & rules
│       ├── pipeline.ts               # Pipeline (deal) stages
│       ├── activities.ts             # Activity model & urgency
│       ├── reports.ts                # Report helpers (filtering, metrics, CSV)
│       ├── navigation.ts             # Sidebar navigation config
│       ├── supabase.ts               # Browser Supabase client
│       ├── supabase-admin.ts         # Server Supabase admin client (service role)
│       ├── supabase-mappers.ts       # DB row ↔ app model translation
│       ├── themes.ts                 # 6 accent themes
│       ├── currency.ts               # Multi-currency support (AED, USD, SAR, etc.)
│       ├── csv-import.ts             # CSV import for companies
│       └── utils.ts                  # General utilities
├── supabase/                         # SQL migrations (run in order in Supabase SQL Editor)
│   ├── 01-schema.sql                 # Core tables (companies, contacts, deals, deal_lines, stage_transitions, activities)
│   ├── 02-seed.sql                   # Demo seed data
│   ├── 03-activities.sql             # Activities table migration
│   ├── 04-order-fulfilment.sql       # Order fulfilment columns
│   ├── 05-line-samples.sql           # Per-line sampling
│   ├── 06-performance-indexes.sql    # Performance indexes
│   ├── 07-role-based-features.sql    # Auth system (profiles, roles, transfer_history, notifications)
│   ├── 08-add-created-by-to-deals.sql # created_by column
│   ├── 09-additional-performance-indexes.sql
│   └── 10-advanced-performance-indexes.sql
└── package.json
```

---

##  CORE BUSINESS CONCEPTS

### 1. SPANCOP — Customer Relationship Stage (Company-Level)

SPANCOP is a **looping** customer relationship lifecycle, NOT a one-way ladder:

```
Suspect → Prospect → Approach → Negotiate → Close → Order → Payment
                    ↑                                      │
                    └────────── cash collected ────────────┘
                    ↑
                    ────────── deal lost ─────────────────
```

- **Suspect (S):** Added but never contacted
- **Prospect (P):** Profile completed, not yet approached
- **Approach (A):** In conversation — the RESTING STATE between deals
- **Negotiate (N):** One or more deals are open
- **Close (C):** Deal won — awaiting purchase order
- **Order (O):** Purchase order received, not yet delivered
- **Payment (P):** Delivered — cash still to collect

**Key rule:** Stage is SUGGESTED automatically by the engine (`suggestSpancopStage()`) but NEVER applied silently. The user must confirm every move. Every transition is written to `stage_transitions` history.

**Priority order (furthest point wins):**
1. Payment outstanding (awaitingPayment) → Payment
2. PO received (hasPurchaseOrder) → Order
3. Open deals (openDealCount > 0) → Negotiate
4. Last deal won, no PO yet → Close
5. Known customer, no live deal → Approach (resting state)
6. Profile complete, no contact → Prospect
7. Default → Suspect

### 2. Pipeline — Deal Stage (Deal-Level)

```
Lead → Qualified → Quotation → Negotiation → Sampling → Won / Lost
```

**Sampling sits AFTER negotiation** — commercial terms agreed first, then samples go to the chef for sign-off.

- Each stage has a default win probability and rot days (stalled threshold)
- Deals can be reopened after being lost (tracked via `periods` array — dormant time excluded from ageing)
- Line items: `quoted`, `approved`, `rejected`. Deal value = sum of non-rejected lines.

### 3. Order Fulfilment (C·O·P Chain)

For WON deals: Won → PO → Delivered → Paid
- Tracked via `fulfilment` object on each deal
- Partial deliveries supported
- Over-payments become credit (UAE trade practice)
- Ageing: <30 days = fresh, 30-60 = chase, >60 = risk

### 4. Line Items

- One deal = multiple line items (products)
- Per-line sampling (not per-deal)
- Line status: quoted (counts as approved), approved, rejected
- Deal value derived from lines, never stored

---

## 👥 USER ROLES & PERMISSIONS

| Role | Visibility |
|---|---|
| **Admin** | Sees ALL data. Can manage team, delete users, change roles |
| **Manager** | Sees own data + assigned team's data + unassigned records |
| **Sales Rep** | Sees ONLY their own assigned records (UUID filter) |
| **Viewer** | Same as Sales Rep but read-only |

**Team hierarchy:** Admin → Manager → Sales Rep. Managers can be assigned Sales Reps via Settings → Manager Team Assignment.

---

## ️ DATABASE SCHEMA

### Core Tables (from 01-schema.sql)

**companies** — Customer records
- `id` (text PK), `name`, `cluster`, `emirate`, `area`, `business` (Hotel/Project/Restaurant/Cafe/Catering/Banquet), `type` (Hotel: 4★/5★/6★/7★, others: New/Old/Renovation)
- Contact snapshot: `contact_name`, `contact_role`, `email`, `phone`, `whatsapp_same_as_phone`
- `owner` (text, denormalized name), `owner_id` (UUID → profiles, nullable), `created_by` (UUID → profiles)
- `lead_source`, `remarks`, `spancop`, `spancop_since`, `lead_status` (hot/warm/cold/dormant), `next_follow_up`
- Derived: `activity_count`, `last_activity_at`, `has_purchase_order`, `awaiting_payment`, `has_ever_ordered`, `last_order_at`, `lifetime_value`

**contacts** — Multiple per company
- `id`, `company_id` (FK), `name`, `role`, `email`, `phone`, `is_primary`, `is_decision_maker`

**deals** — One per enquiry
- `id`, `title`, `category` (OS&E/FF&E/FOH/BOH), `company_id`, `company_name`
- `enquiry_from_id` (locked), `current_contact_id` (moves), `contact_trail` (JSON)
- `value` (derived from lines), `currency`, `stage`, `probability`, `on_hold`
- `owner` (text), `owner_id` (UUID), `created_by` (UUID)
- `lost_reason` (required when stage=lost), `lost_note`
- `task`, `task_due_date`, `task_done`, `next_action`, `remarks`
- `periods` (JSON — active work periods for accurate ageing)
- `sample_sent_at`, `sample_feedback_at`, `sample_feedback`

**deal_lines** — Products on a deal
- `id`, `deal_id` (FK), `product`, `brand`, `quantity`, `unit`, `unit_price`, `status` (quoted/approved/rejected), `reject_reason`, `position`

**stage_transitions** — SPANCOP history
- `id`, `company_id` (FK), `from_stage`, `to_stage`, `trigger` (manual/accepted-suggestion/seed/automatic), `reason`, `at`, `by_user`

**activities** — Calls, visits, emails
- `id`, `company_id`, `contact_id`, `deal_id`, `type`, `report`, `occurred_at`, `task`, `task_due_at`, `task_done`, `remind`, `owner`, `owner_id`, `created_by`

### Auth Tables (from 07-role-based-features.sql)

**profiles** — User profiles (linked to Supabase Auth)
- `id` (UUID, matches Supabase Auth user ID), `username`, `display_name`, `email`, `role_id` (FK → roles), `manager_id` (FK → profiles, for team hierarchy)

**roles** — Role definitions
- `id` (UUID PK), `name` (Admin/Manager/Sales Rep/Viewer)

**transfer_history** — Ownership change log
- `id`, `customer_id`, `from_owner_id`, `to_owner_id`, `transferred_by`, `transferred_at`, `reason`

**notifications** — In-app notifications
- `id`, `user_id`, `type` (transfer_in/transfer_out/stage_change/overdue), `title`, `message`, `customer_id`, `is_read`, `created_at`

---

## 🔄 DATA FLOW ARCHITECTURE

### DataProvider (src/components/providers/data-provider.tsx)
- **Single source of truth** for all data (companies, contacts, deals, activities, transitions)
- **Optimistic writes:** Local state updates immediately, then persists to Supabase
- **Self-healing:** On every load, resolves stale owner names by:
  1. Fetching active users from `/api/team/users`
  2. Mapping `owner_id` → display name
  3. Detecting owner names that don't match any active user (deleted users)
  4. Fixing them in-memory immediately
  5. Calling `/api/team/fix-stale-owners` in background to persist the fix to DB
- **Role-based filtering:** Admin sees all, Manager sees team, Sales Rep sees own only
- **Demo fallback:** If Supabase not configured, uses bundled demo data

### Write Pattern (CRITICAL — never break this)
- All writes happen **OUTSIDE** `setState` updaters
- Use refs (`companiesRef`, `dealsRef`, etc.) to read current state for write logic
- React 19 StrictMode invokes updaters twice — writes inside updaters fire twice and corrupt data
- Pattern: compute → write once → setState

---

## 🎨 UI/UX DESIGN SYSTEM

### Layout
- **Sidebar** (collapsible): Logo, New Deal button, nav sections (Sell/Insights), Today card, Pipeline snapshot, user profile
- **Topbar:** Breadcrumbs, notifications bell, keyboard shortcuts, data source badge
- **App Shell:** Sidebar + content area with FAB (floating action button)

### Navigation
- Two sections: "Sell" (Dashboard, Pipeline, Companies, Contacts, Activities) and "Insights" (Reports, Settings)
- Keyboard shortcuts: G then D/P/C/O/A/E/S to navigate
- Command palette (Cmd+K / Ctrl+K): Global search across companies, deals, contacts

### Themes
- 6 accent themes: Corporate Blue, Tech Teal, Executive Amber, Signature Indigo, Growth Emerald, Boutique Rose
- Light/dark mode via next-themes
- Theme stored in localStorage

### Currency
- Multi-currency: AED, USD, SAR, EUR, GBP, INR, etc.
- All amounts displayed in selected currency with conversion

---

## 📊 KEY PAGES

### Dashboard
- KPI blocks: Revenue, Deals Won, Win Rate, Pipeline Value, etc.
- Revenue target chart (monthly vs target)
- SPANCOP funnel widget
- Pipeline funnel chart
- Top products tile
- Loss reasons tile
- Distribution chart (by business type)
- Work tiles: Today's tasks, follow-ups, overdue items

### Companies
- SPANCOP funnel snapshot at top (clickable to filter)
- Suggestions banner (AI-suggested stage changes)
- Table with: Company, Business, Type, SPANCOP strip, Lead status, Follow-up, Alert, Owner
- Pagination (25/50/100 per page)
- Filters: Business type, Emirate, Owner, Alerts only
- Company drawer: Full details, SPANCOP controls, activity journal, transfer history

### Pipeline (Deals)
- Kanban board with 7 columns (Lead → Won/Lost)
- Drag & drop between columns
- Deal cards show: title, company, value, probability, task, ageing
- Rotting alerts for stale deals
- Quick actions: Won, Lost, Edit

### Activities
- Journal-style timeline per company
- Log activities: Call, Meeting, Email, WhatsApp, Visit, Note
- Task tracking with due dates and reminders
- Activity urgency: overdue → today → soon → later

### Reports
- Period selector: Week/Month/Quarter/Year/All Time
- Sales Performance: KPIs, revenue chart, team leaderboard, all reps table
- Pipeline Health: Funnel chart, stage velocity, bottleneck alerts
- Customer Revenue: Top customers, revenue by rep pie chart, going cold alerts

### Settings
- Team management: Add/edit/delete users, assign roles, manager team assignment
- Theme picker
- Currency settings
- Danger zone: Reset all data

---

## 🐛 RECENTLY FIXED ISSUES (Context for Future Work)

### 1. "Soon" badge removed from Reports
- File: `src/lib/navigation.ts`
- `soon: true` was removed from the Reports nav item

### 2. Deleted users no longer show in reports
- File: `src/lib/reports.ts`
- `metricsByOwner()` now groups by `owner_id` (which gets updated on deletion) instead of the stale `owner` name string

### 3. Self-healing stale owner names
- File: `src/components/providers/data-provider.tsx`
- On every load, resolves owner_id → name and detects deleted user names
- File: `src/app/api/team/fix-stale-owners/route.ts`
- Background API that permanently repairs the database

### 4. DELETE endpoint handles null owner_id
- File: `src/app/api/team/users/[id]/route.ts`
- When deleting a user, also updates records where `owner_id` is null but `owner` name matches the deleted user
- Updates BOTH `owner_id` AND `owner` name to admin

### 5. Foreign key constraint fix for user deletion
- The DELETE endpoint updates both `owner_id` AND `created_by` on all 6 tables before deleting the profile

---

## 🌿 BRANCH STRATEGY

- **`main`** — Production. Stable, tested, deployed.
- **`development`** — Testing. All new changes go here first.
- User tests on development, then merges to main when satisfied.
- **NEVER push to main directly. NEVER create new branches.**

---

## 📦 ENVIRONMENT VARIABLES (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Without Supabase credentials, the app falls back to demo data.

---

## 🚀 USER'S WORKFLOW

```bash
git pull origin development
npm install
npm run dev
```
Then test at `http://localhost:3000`. Hard refresh browser (`Ctrl+Shift+R`) after code changes.

---

##  WHEN YOU START A NEW SESSION

1. Read this entire document first
2. Run `git log --oneline -20` to see recent changes
3. Read the key files: `src/lib/spancop.ts`, `src/lib/pipeline.ts`, `src/components/providers/data-provider.tsx`, `src/lib/navigation.ts`
4. **ASK the user what they want to build/fix before touching any code**
5. Understand the request fully before implementing
6. Push changes to `development` branch only
