-- ============================================================
--  Bishal Sales CRM — order fulfilment (C · O · P)
--  Run in Supabase → SQL Editor → Run
--
--  SAFE BY DESIGN. This file only ADDS columns.
--    · no DROP, no DELETE, no UPDATE of existing rows
--    · no change to any existing column
--    · every new column is nullable, so existing deals simply
--      get empty boxes and behave exactly as they do today
--
--  Re-running it is harmless — every statement uses IF NOT EXISTS.
-- ============================================================

-- ------------------------------------------------------------
--  Why these live on `deals` and not on `companies`
--
--  A customer can have several orders running at once. The purchase
--  order, the delivery and the money all belong to ONE deal, so they
--  are stored per deal. The company-level flags (has_purchase_order,
--  awaiting_payment) stay as a fast summary the SPANCOP ladder reads.
-- ------------------------------------------------------------

alter table deals
  -- The customer's own PO reference, e.g. "PO-2026-0184".
  add column if not exists po_number text,

  -- When the PO arrived. Stamped by the app, never typed.
  add column if not exists po_date timestamptz,

  -- When the goods went out. This is where the ageing clock starts.
  add column if not exists delivered_at timestamptz,

  -- True when only part of the order shipped. Full delivery leaves
  -- this false; the pending detail is a free-text note.
  add column if not exists partial_delivery boolean not null default false,
  add column if not exists delivery_note text,

  -- When the balance was settled in full. Null means money is owed.
  add column if not exists paid_at timestamptz,

  -- Running total actually received, in the deal's own currency.
  -- Part payments add to this; it is what "Cash to collect" subtracts
  -- from the deal value, so the tile never overstates the balance.
  add column if not exists amount_received numeric(14,2) not null default 0;

-- Cash to collect scans for delivered-but-unpaid deals on every
-- dashboard load, so give it an index rather than a full scan.
create index if not exists deals_fulfilment_idx
  on deals (delivered_at, paid_at);

-- ------------------------------------------------------------
--  Check it worked — should return seven rows.
-- ------------------------------------------------------------
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'deals'
  and column_name in (
    'po_number',
    'po_date',
    'delivered_at',
    'partial_delivery',
    'delivery_note',
    'paid_at',
    'amount_received'
  )
order by column_name;
