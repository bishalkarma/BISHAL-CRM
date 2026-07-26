-- ============================================================
--  Bishal Sales CRM — database schema
--  Stage 2 of 4 · run this in Supabase → SQL Editor → Run
--
--  Safe to run more than once: it drops and rebuilds cleanly.
--  Creates 6 tables. Does not touch your app.
-- ============================================================

-- ---- Clean slate (so re-running is always safe) ------------
drop table if exists deal_lines cascade;
drop table if exists stage_transitions cascade;
drop table if exists activities cascade;
drop table if exists deals cascade;
drop table if exists contacts cascade;
drop table if exists companies cascade;

drop type if exists business_type cascade;
drop type if exists emirate_type cascade;
drop type if exists spancop_stage cascade;
drop type if exists deal_stage cascade;
drop type if exists line_status cascade;
drop type if exists lead_status cascade;
drop type if exists deal_priority cascade;

-- ---- Enums: the picklists we agreed -------------------------
create type business_type as enum
  ('Hotel', 'Project', 'Restaurant', 'Cafe', 'Catering', 'Banquet');

create type emirate_type as enum
  ('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman',
   'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain');

-- SPANCOP is a loop; payment collected returns a customer to approach.
create type spancop_stage as enum
  ('suspect', 'prospect', 'approach', 'negotiate', 'close', 'order', 'payment');

-- Business stage order: sampling sits AFTER negotiation.
create type deal_stage as enum
  ('lead', 'qualified', 'quotation', 'negotiation', 'sampling', 'won', 'lost');

create type line_status  as enum ('quoted', 'approved', 'rejected');
create type lead_status  as enum ('hot', 'warm', 'cold', 'dormant');
create type deal_priority as enum ('high', 'medium', 'low');


-- ============================================================
--  companies
-- ============================================================
create table companies (
  id            text primary key,
  name          text not null,
  cluster       text,
  emirate       emirate_type not null,
  area          text not null,
  lat           double precision,
  lng           double precision,
  business      business_type not null,
  -- Hotel -> 4/5/6/7 star, everything else -> New/Old/Renovation.
  -- Kept as text because the valid set depends on `business`.
  type          text not null,

  contact_name  text not null,
  contact_role  text not null,
  email         text,                       -- optional by design
  phone         text not null,
  whatsapp_same_as_phone boolean not null default true,

  owner         text not null,
  lead_source   text not null,
  remarks       text not null default '',

  spancop       spancop_stage not null default 'suspect',
  spancop_since timestamptz   not null default now(),
  lead_status   lead_status   not null default 'cold',
  next_follow_up timestamptz,

  -- Derived signals, kept on the row so lists stay fast.
  activity_count   integer     not null default 0,
  last_activity_at timestamptz,
  has_purchase_order boolean   not null default false,
  awaiting_payment   boolean   not null default false,
  has_ever_ordered   boolean   not null default false,
  last_order_at    timestamptz,
  lifetime_value   numeric(14,2) not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index companies_spancop_idx  on companies (spancop);
create index companies_owner_idx    on companies (owner);
create index companies_emirate_idx  on companies (emirate);


-- ============================================================
--  contacts — many per company
-- ============================================================
create table contacts (
  id          text primary key,
  company_id  text not null references companies(id) on delete cascade,
  name        text not null,
  role        text not null,
  email       text,
  phone       text not null,
  whatsapp_same_as_phone boolean not null default true,
  is_primary        boolean not null default false,
  is_decision_maker boolean not null default false,
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

create index contacts_company_idx on contacts (company_id);


-- ============================================================
--  deals — one per enquiry; products live in deal_lines
-- ============================================================
create table deals (
  id           text primary key,
  title        text not null,
  category     text not null,              -- mandatory, drives analysis
  company_id   text not null references companies(id) on delete cascade,
  company_name text not null,              -- denormalised for fast lists
  account_type text not null,

  -- Who sent the enquiry never changes; who we deal with now moves.
  enquiry_from_id    text references contacts(id) on delete set null,
  current_contact_id text references contacts(id) on delete set null,
  contact_trail      jsonb not null default '[]'::jsonb,

  -- Derived from deal_lines (sum of non-rejected lines).
  value        numeric(14,2) not null default 0,
  currency     text not null default 'AED',

  stage             deal_stage not null default 'lead',
  closed_from_stage deal_stage,
  probability       integer,
  on_hold           boolean not null default false,

  owner        text not null,
  city         text not null,
  priority     deal_priority not null default 'medium',
  tags         text[] not null default '{}',

  req_date            timestamptz,
  expected_close_date timestamptz,
  last_activity_at    timestamptz not null default now(),

  -- Required when stage = 'lost'; editable afterwards.
  lost_reason  text,
  lost_note    text,

  next_action  text not null default '',
  task         text not null default '',
  task_due_date timestamptz,
  task_done    boolean not null default false,
  remarks      text not null default '',

  -- Only meaningful from the Sampling stage onward.
  sample_sent_at     timestamptz,
  sample_feedback_at timestamptz,
  sample_feedback    text,

  -- Active work periods. Dormant time between lost and reopen is excluded
  -- from ageing, so [{openedAt, closedAt}] is stored rather than a count.
  periods      jsonb not null default '[]'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- A deal cannot sit in 'lost' without a recorded reason.
  constraint lost_needs_reason
    check (stage <> 'lost' or lost_reason is not null)
);

create index deals_company_idx on deals (company_id);
create index deals_stage_idx   on deals (stage);
create index deals_owner_idx   on deals (owner);


-- ============================================================
--  deal_lines — products on an enquiry
-- ============================================================
create table deal_lines (
  id          text primary key,
  deal_id     text not null references deals(id) on delete cascade,
  product     text not null,
  brand       text not null default '',
  quantity    numeric(12,2) not null default 0,
  unit        text not null default 'Pcs',
  unit_price  numeric(14,2) not null default 0,
  status      line_status not null default 'quoted',
  reject_reason text,
  position    integer not null default 0
);

create index deal_lines_deal_idx on deal_lines (deal_id);


-- ============================================================
--  stage_transitions — SPANCOP history
--  This is what makes period reports and "furthest reached" possible.
-- ============================================================
create table stage_transitions (
  id          text primary key,
  company_id  text not null references companies(id) on delete cascade,
  from_stage  spancop_stage,
  to_stage    spancop_stage not null,
  trigger     text not null,        -- manual | accepted-suggestion | seed
  reason      text not null default '',
  at          timestamptz not null default now(),
  by_user     text not null default ''
);

create index stage_transitions_company_idx on stage_transitions (company_id);
create index stage_transitions_at_idx      on stage_transitions (at);


-- ============================================================
--  activities — calls, visits, emails (used from Part 7)
-- ============================================================
create table activities (
  id          text primary key,
  company_id  text not null references companies(id) on delete cascade,
  contact_id  text references contacts(id) on delete set null,
  deal_id     text references deals(id) on delete set null,
  type        text not null,
  title       text not null,
  notes       text not null default '',
  due_at      timestamptz,
  done        boolean not null default false,
  owner       text not null default '',
  created_at  timestamptz not null default now()
);

create index activities_company_idx on activities (company_id);
create index activities_deal_idx    on activities (deal_id);


-- ============================================================
--  Row Level Security
--
--  RLS is ENABLED now so nothing is ever publicly writable, with a
--  permissive policy for this testing stage. Stage 4 replaces these
--  with per-user rules once login exists.
-- ============================================================
alter table companies         enable row level security;
alter table contacts          enable row level security;
alter table deals             enable row level security;
alter table deal_lines        enable row level security;
alter table stage_transitions enable row level security;
alter table activities        enable row level security;

create policy "stage2 open access" on companies         for all using (true) with check (true);
create policy "stage2 open access" on contacts          for all using (true) with check (true);
create policy "stage2 open access" on deals             for all using (true) with check (true);
create policy "stage2 open access" on deal_lines        for all using (true) with check (true);
create policy "stage2 open access" on stage_transitions for all using (true) with check (true);
create policy "stage2 open access" on activities        for all using (true) with check (true);


-- ============================================================
--  Done. Expect: "Success. No rows returned"
--  Check Table Editor — six tables should now exist.
-- ============================================================
