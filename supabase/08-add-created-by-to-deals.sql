-- Add created_by column to deals table (if it doesn't exist)
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Backfill created_by with owner_id for existing deals (since old deals
-- were created by whoever owned them)
UPDATE deals
SET created_by = owner_id
WHERE created_by IS NULL AND owner_id IS NOT NULL;
