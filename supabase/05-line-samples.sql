-- ============================================================
--  Bishal Sales CRM — samples, per line item
--  Run in Supabase → SQL Editor → Run
--
--  SAFE BY DESIGN. This file only ADDS columns.
--    · no DROP, no DELETE, no UPDATE of existing rows
--    · no change to any existing column
--    · every new column is nullable, so existing lines simply
--      get empty boxes and behave exactly as they do today
--
--  Re-running it is harmless — every statement uses IF NOT EXISTS.
-- ============================================================

-- ------------------------------------------------------------
--  Why these live on `deal_lines` and not on `deals`
--
--  A customer asks for one product out of a package of eight. A single
--  sample record on the deal could only say "a sample was sent" — not
--  which item, not when, and not what the answer was. Per line, each
--  product carries its own sent date, its own ageing clock and its own
--  verdict.
--
--  The older deal-level columns (sample_sent_at on `deals`) are left
--  untouched, so deals sampled before this change keep their history.
-- ------------------------------------------------------------

alter table deal_lines
  -- When this specific item went out. Stamped by the app, never typed.
  add column if not exists sample_sent_at timestamptz,

  -- When the customer came back. Null means still waiting.
  add column if not exists sample_feedback_at timestamptz,

  -- What they actually said, in their words.
  add column if not exists sample_feedback text;

-- The dashboard scans for sampled-but-unanswered lines on every load,
-- so give it an index rather than a full table scan.
create index if not exists deal_lines_sample_idx
  on deal_lines (sample_sent_at, sample_feedback_at);

-- ------------------------------------------------------------
--  Check it worked — should return three rows.
-- ------------------------------------------------------------
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'deal_lines'
  and column_name in (
    'sample_sent_at',
    'sample_feedback_at',
    'sample_feedback'
  )
order by column_name;
