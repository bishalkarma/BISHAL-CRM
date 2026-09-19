-- ============================================================
-- Phase 3: Comprehensive Performance Optimizations
-- Run this AFTER 06-performance-indexes.sql and 09-additional-performance-indexes.sql
-- ============================================================

-- 1. Add partial indexes for active/open records (smaller, faster indexes)
-- Note: SPANCOP stages are: suspect, prospect, approach, negotiate, close, order, payment
-- Note: Deal stages are: lead, qualified, quotation, negotiation, sampling, won, lost
CREATE INDEX IF NOT EXISTS idx_deals_open ON deals(id) WHERE stage NOT IN ('won', 'lost');
-- For companies, we index all records since SPANCOP doesn't have closed states
-- (All SPANCOP stages are active: suspect → prospect → approach → negotiate → close → order → payment)

-- 2. Add covering indexes (include frequently accessed columns)
-- This allows index-only scans without hitting the heap
CREATE INDEX IF NOT EXISTS idx_deals_owner_stage_value 
  ON deals(owner_id, stage) 
  INCLUDE (value, created_at);

CREATE INDEX IF NOT EXISTS idx_companies_owner_spancop_value 
  ON companies(owner_id, spancop) 
  INCLUDE (name, created_at);

-- 3. Expression indexes for date grouping
-- Note: Removed DATE_TRUNC indexes due to IMMUTABLE constraint issues
-- Alternative: Use application-level date grouping or add a generated column

-- 4. Add indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id) 
  WHERE is_read = false;

-- 5. Add indexes for transfer history
CREATE INDEX IF NOT EXISTS idx_transfer_history_customer_date 
  ON transfer_history(customer_id, transferred_at DESC);

-- 6. Optimize profiles table
-- Add index for manager-team lookups
CREATE INDEX IF NOT EXISTS idx_profiles_manager_team 
  ON profiles(manager_id) 
  WHERE manager_id IS NOT NULL;

-- 7. Add composite index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_manager 
  ON profiles(role_id, manager_id);

-- 8. Add index for username lookups (login)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower 
  ON profiles(LOWER(username));

-- 9. Add indexes for deal line items
CREATE INDEX IF NOT EXISTS idx_deal_lines_deal_id 
  ON deal_lines(deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_lines_status 
  ON deal_lines(status);

-- 10. Add partial index for approved line items (common query)
CREATE INDEX IF NOT EXISTS idx_deal_lines_approved 
  ON deal_lines(deal_id) 
  WHERE status = 'approved';

-- ============================================================
-- Maintenance: Update statistics for query planner
-- ============================================================
ANALYZE companies;
ANALYZE deals;
ANALYZE contacts;
ANALYZE activities;
ANALYZE stage_transitions;
ANALYZE profiles;
ANALYZE notifications;
ANALYZE transfer_history;
ANALYZE deal_lines;

-- ============================================================
-- Verify indexes are working
-- ============================================================
-- Run this query to see index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;
