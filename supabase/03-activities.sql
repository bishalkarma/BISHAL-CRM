-- ============================================================
--  Bishal Sales CRM — activities
--  Stage 1 of Activities · run in Supabase → SQL Editor → Run
--
--  Only touches the `activities` table, which is currently empty.
--  Companies, contacts and deals are NOT affected.
-- ============================================================

drop table if exists activities cascade;
drop type if exists activity_type cascade;

-- The eight agreed types.
create type activity_type as enum (
  'site_visit',
  'call',
  'email',
  'meeting',
  'demo',
  'casual_follow_up',
  'whatsapp',
  'payment_follow_up'
);

create table activities (
  id          text primary key,

  -- Who it was with. Company is required; a deal link is deliberate.
  company_id  text not null references companies(id) on delete cascade,
  contact_id  text references contacts(id) on delete set null,
  deal_id     text references deals(id) on delete set null,

  type        activity_type not null,

  -- The type-aware report ("Call report", "Visit report", …).
  report      text not null default '',

  -- When the interaction happened. Separate from created_at so an activity
  -- can be back-dated after the fact.
  occurred_at timestamptz not null default now(),

  -- Optional follow-up, added through the inline reveal on the same form.
  task        text,
  task_due_at timestamptz,
  task_done   boolean not null default false,
  remind      boolean not null default false,

  owner       text not null default '',
  created_at  timestamptz not null default now(),

  -- A due date without a task, or a reminder without a task, is meaningless.
  constraint task_needs_text
    check (task is not null or (task_due_at is null and remind = false))
);

create index activities_company_idx  on activities (company_id);
create index activities_deal_idx     on activities (deal_id);
create index activities_occurred_idx on activities (occurred_at desc);
-- Drives the "open tasks" view and the reminder counts.
create index activities_open_task_idx
  on activities (task_due_at)
  where task is not null and task_done = false;

alter table activities enable row level security;
create policy "stage2 open access" on activities
  for all using (true) with check (true);

-- ============================================================
--  Expect: "Success. No rows returned"
-- ============================================================
