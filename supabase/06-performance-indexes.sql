-- ============================================================
-- Phase 1: Performance indexes + created_by column
-- ============================================================

-- Add created_by column if missing (links to auth user who created the record)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Backfill created_by from owner_id for existing records
UPDATE companies
SET created_by = owner_id
WHERE created_by IS NULL AND owner_id IS NOT NULL;

-- ============================================================
-- Performance indexes — make search/filter instant
-- ============================================================

-- Companies: by owner, stage, creation date, name search
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_spancop ON companies(spancop);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- Deals: by owner, stage, company, creation date
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);

-- Contacts: by company, name search
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops);

-- Activities: by company, deal, owner, date
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON activities(occurred_at DESC);

-- Stage transitions: by company, date
CREATE INDEX IF NOT EXISTS idx_transitions_company_id ON stage_transitions(company_id);
CREATE INDEX IF NOT EXISTS idx_transitions_at ON stage_transitions(at DESC);

-- Profiles: by username (login lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
