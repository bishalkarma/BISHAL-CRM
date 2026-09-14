-- ============================================================
-- Phase 2: Schema for role-based features
-- ============================================================

-- 1. Add manager_id to profiles (for team assignment)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES profiles(id);

-- 2. Transfer history table (separate from activities)
CREATE TABLE IF NOT EXISTS transfer_history (
  id TEXT PRIMARY KEY DEFAULT ('TH-' || gen_random_uuid()::text),
  customer_id TEXT NOT NULL REFERENCES companies(id),
  from_owner_id UUID REFERENCES profiles(id),
  to_owner_id UUID REFERENCES profiles(id),
  transferred_by UUID REFERENCES profiles(id),
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_transfer_history_customer ON transfer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_to_owner ON transfer_history(to_owner_id);

-- 3. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('N-' || gen_random_uuid()::text),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'transfer_in', 'transfer_out', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  customer_id TEXT REFERENCES companies(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 4. Add transfer_count to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS transfer_count INTEGER DEFAULT 0;

-- 5. Fix Bishal's display name
UPDATE profiles 
SET display_name = 'Bishal Karma' 
WHERE id = 'e38d1922-a7ce-4e31-9f66-a291afae5163';

-- 6. Fix all owner fields (replace UUIDs with display names)
UPDATE companies 
SET owner = 'Sanu' 
WHERE owner_id = 'f521f657-1d44-4605-8f02-b00d1deacd1d' 
  AND owner != 'Sanu';

UPDATE companies 
SET owner = 'Sales1' 
WHERE owner_id = 'd0b4957e-6e25-4097-8fe5-fa26c96e6f7a' 
  AND owner != 'Sales1';

UPDATE companies 
SET owner = 'Bishal Karma' 
WHERE owner_id = 'e38d1922-a7ce-4e31-9f66-a291afae5163' 
  AND owner != 'Bishal Karma';

UPDATE companies 
SET owner = 'manager' 
WHERE owner_id = 'fe4f0186-cc4b-49b6-aca6-e22f490e3138' 
  AND owner != 'manager';

UPDATE companies 
SET owner = 'TEST' 
WHERE owner_id = '1362d54d-0cb2-494e-bc4a-7d911d53b9e1' 
  AND owner != 'TEST';

-- 7. Fix the C-607736 record (UUID in owner field, NULL owner_id)
UPDATE companies 
SET owner = 'Sanu',
    owner_id = 'f521f657-1d44-4605-8f02-b00d1deacd1d'
WHERE id = 'C-607736';

-- 8. Fix all NULL owner_id records
UPDATE companies 
SET owner_id = 'fe4f0186-cc4b-49b6-aca6-e22f490e3138',
    created_by = 'fe4f0186-cc4b-49b6-aca6-e22f490e3138'
WHERE id = 'C-161504';

UPDATE companies 
SET owner_id = 'e38d1922-a7ce-4e31-9f66-a291afae5163',
    created_by = 'e38d1922-a7ce-4e31-9f66-a291afae5163'
WHERE id = 'C-283165';

UPDATE companies 
SET owner_id = 'e38d1922-a7ce-4e31-9f66-a291afae5163',
    created_by = 'e38d1922-a7ce-4e31-9f66-a291afae5163'
WHERE id = 'C-585956';

UPDATE companies 
SET owner_id = 'f521f657-1d44-4605-8f02-b00d1deacd1d',
    created_by = 'f521f657-1d44-4605-8f02-b00d1deacd1d'
WHERE id = 'C-359131';
