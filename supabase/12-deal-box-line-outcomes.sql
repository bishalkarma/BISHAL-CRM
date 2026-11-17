-- BUILD 18.19: separate deal lifecycle, commercial line outcomes, and sample verdicts.
-- Strictly additive: existing stage/status values and all user rows are retained.
-- Legacy rows are interpreted by the app mapper until the user reviews them.

alter table deals
  add column if not exists lifecycle_status text
    check (lifecycle_status in ('open', 'closed')),
  add column if not exists closed_at timestamptz;

alter table deal_lines
  add column if not exists commercial_status text
    check (commercial_status in ('potential', 'won', 'lost')),
  add column if not exists sample_verdict text
    check (sample_verdict in ('approved', 'rejected'));

comment on column deals.lifecycle_status is
  'Neutral open/closed lifecycle; Won/Lost are stored per deal line.';
comment on column deals.closed_at is
  'Timestamp the deal box became closed after every line reached Won or Lost.';
comment on column deal_lines.commercial_status is
  'Per-line commercial outcome, independent from sample feedback.';
comment on column deal_lines.sample_verdict is
  'Per-line sample evaluation only; does not affect commercial outcome or value.';

-- Per-line loss context and append-only decision history, independent from sample feedback.
alter table deal_lines
  add column if not exists lost_reason_note text,
  add column if not exists commercial_history jsonb not null default '[]'::jsonb;

comment on column deal_lines.lost_reason_note is
  'Optional note for the current or most recent commercial loss on this product line.';
comment on column deal_lines.commercial_history is
  'Append-only commercial status history for this line, including loss reasons and reopenings.';
