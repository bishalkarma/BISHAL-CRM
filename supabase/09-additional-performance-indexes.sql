-- ============================================================
-- Phase 2: Additional performance optimizations
-- ============================================================

-- Companies: composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_companies_owner_spancop ON companies(owner_id, spancop);
CREATE INDEX IF NOT EXISTS idx_companies_owner_created ON companies(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_spancop_created ON companies(spancop, created_at DESC);

-- Deals: composite indexes for reports
CREATE INDEX IF NOT EXISTS idx_deals_owner_stage ON deals(owner_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_owner_created ON deals(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_stage_created ON deals(stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_company_stage ON deals(company_id, stage);

-- Contacts: composite indexes
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);

-- Activities: composite indexes for timeline
CREATE INDEX IF NOT EXISTS idx_activities_owner_date ON activities(owner_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_company_date ON activities(company_id, occurred_at DESC);

-- Notifications: indexes for unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Transfer history: indexes
CREATE INDEX IF NOT EXISTS idx_transfer_history_customer ON transfer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_from ON transfer_history(from_owner_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_to ON transfer_history(to_owner_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_date ON transfer_history(transferred_at DESC);

-- Profiles: manager relationship
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON profiles(manager_id);
