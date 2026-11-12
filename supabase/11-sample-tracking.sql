-- ============================================================
--  Bishal Sales CRM — BUILD 18.14 Sample Custody & Standalone Samples
--  SAFE & ADDITIVE BY DESIGN:
--    · Only ADDS nullable columns to `deal_lines`
--    · Creates additive `customer_samples` table for standalone
--      samples given directly to a customer without a deal
--    · Zero DROP, zero DELETE, zero destructive changes
--    · Existing 29+ deal_lines samples continue working seamlessly
-- ============================================================

-- 1. Additive physical custody columns on `deal_lines`
alter table deal_lines
  add column if not exists sample_qty numeric,
  add column if not exists sample_returned_at timestamptz,
  add column if not exists sample_return_status text,
  add column if not exists sample_recipient text,
  add column if not exists sample_handover_note text,
  add column if not exists sample_return_note text,
  add column if not exists sample_followup_activity_id text;

create index if not exists deal_lines_sample_custody_idx
  on deal_lines (sample_sent_at, sample_returned_at, sample_return_status);

-- 2. Standalone customer samples (samples given without a Deal)
create table if not exists customer_samples (
  id                    text primary key,
  company_id            text not null references companies(id) on delete cascade,
  contact_id            text references contacts(id) on delete set null,
  product               text not null,
  brand                 text not null default '',
  sample_qty            numeric not null default 1,
  unit                  text not null default 'Pcs',
  sent_at               timestamptz not null default now(),
  returned_at           timestamptz,
  return_status         text not null default 'out',
  verdict               text,
  recipient_name        text not null default '',
  handover_note         text not null default '',
  return_note           text not null default '',
  followup_activity_id  text,
  owner                 text not null default '',
  owner_id              uuid,
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists customer_samples_company_idx
  on customer_samples (company_id);

create index if not exists customer_samples_status_idx
  on customer_samples (return_status, sent_at desc);

create index if not exists customer_samples_owner_idx
  on customer_samples (owner_id);

alter table customer_samples enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_samples'
      and policyname = 'stage2 open access'
  ) then
    create policy "stage2 open access" on customer_samples
      for all using (true) with check (true);
  end if;
end $$;
