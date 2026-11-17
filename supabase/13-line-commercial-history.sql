-- Add per-line loss details and an append-only commercial outcome history.
-- This is additive and preserves all existing deal-line data.
alter table deal_lines
  add column if not exists lost_reason_note text,
  add column if not exists commercial_history jsonb not null default '[]'::jsonb;

comment on column deal_lines.lost_reason_note is
  'Optional note for the current or most recent commercial loss on this product line.';
comment on column deal_lines.commercial_history is
  'Append-only commercial status history for this line, including loss reasons and reopenings.';
