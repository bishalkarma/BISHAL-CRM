# Bishal Sales CRM - Quick Reference Guide

## 🚀 Quick Start

### **For Developers:**
```bash
# Clone and setup
git clone <repo>
cd BISHAL-CRM
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (in order)
# Use Supabase SQL Editor

# Start development
npm run dev
```

### **For Users:**
1. Login with your credentials
2. Navigate using left sidebar
3. Use top search bar (Ctrl+K) for quick access
4. Check notification bell for updates

---

## ️ Key Commands

### **Git Commands:**
```bash
# Pull latest changes
git pull origin feature/multi-user-phase1

# Check status
git status

# View branches
git branch -a
```

### **Database Commands:**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Analyze tables (update statistics)
ANALYZE companies;
ANALYZE deals;
ANALYZE contacts;

-- Check notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Check transfer history
SELECT * FROM transfer_history ORDER BY transferred_at DESC LIMIT 10;
```

---

## 👥 Role Capabilities Matrix

| Feature | Admin | Manager | Sales Rep | Viewer |
|---------|-------|---------|-----------|--------|
| View All Companies | ✅ | ❌ |  | ❌ |
| View Team Companies | ✅ | ✅ | ❌ | ❌ |
| View Own Companies | ✅ | ✅ | ✅ | ✅ |
| Create Company | ✅ | ✅ | ✅ | ❌ |
| Edit Company | ✅ | ✅ | ✅ | ❌ |
| Delete Company | ✅ | ❌ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ |  | ❌ | ❌ |
| Assign Managers | ✅ | ❌ | ❌ | ❌ |
| View All Reports | ✅ | ❌ |  | ❌ |
| View Team Reports | ✅ | ✅ | ❌ | ❌ |
| View Own Reports | ✅ | ✅ | ✅ |  |
| Export Data | ✅ | ✅ | ❌ | ❌ |

---

##  Notification Types

### **Transfer Notifications:**
- **transfer_in:** Customer assigned to you
- **transfer_out:** Customer transferred away
- **system:** System announcements

### **Notification Behavior:**
- Poll every 10 seconds
- Toast popup on new notification
- Bell badge shows unread count
- Click to mark as read

---

##  Report Types

### **1. Sales Performance**
- Team Revenue
- Team Deals Won
- Lost Value
- Team Win Rate
- Monthly Revenue Chart
- Team Leaderboard

### **2. Pipeline Health**
- Deal Stages Funnel
- Stage Velocity
- Open Deals Count
- Pipeline Value

### **3. Customer Revenue**
- Total Customers
- Active Customers
- Repeat Rate
- Top Customers Table
- Revenue by Rep
- Going Cold Alerts

---

##  SPANCOP Stages

**Customer Lifecycle:**
1. **Suspect** - Potential customer identified
2. **Prospect** - Initial contact made
3. **Approach** - Active engagement
4. **Negotiate** - Discussing terms
5. **Close** - Finalizing deal
6. **Order** - PO received
7. **Payment** - Payment received

---

## 🎯 Deal Stages

**Sales Pipeline:**
1. **Lead** - New enquiry
2. **Qualified** - Budget/need confirmed
3. **Quotation** - Pricing sent
4. **Negotiation** - Terms discussion
5. **Sampling** - Product samples
6. **Won** - Deal closed ✅
7. **Lost** - Deal lost 

---

## 🔧 Troubleshooting Quick Fixes

### **Issue: "Offline data" warning**
```bash
# Fix: Check .env.local
cat .env.local

# Fix: Restart server
npm run dev
```

### **Issue: Notifications not showing**
```sql
-- Check if table exists
SELECT * FROM notifications LIMIT 1;

-- Check user notifications
SELECT * FROM notifications 
WHERE user_id = 'your-user-uuid' 
ORDER BY created_at DESC;
```

### **Issue: Slow performance**
```sql
-- Update statistics
ANALYZE companies;
ANALYZE deals;

-- Check missing indexes
SELECT * FROM pg_stat_user_tables 
WHERE idx_scan = 0 AND n_live_tup > 1000;
```

---

##  Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Optional
NODE_ENV=development
```

---

## 📁 Important Files

### **Configuration:**
- `.env.local` - Environment variables
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

### **Database:**
- `supabase/01-schema.sql` - Main schema
- `supabase/06-performance-indexes.sql` - Performance indexes
- `supabase/07-role-based-features.sql` - Role features

### **Components:**
- `src/components/providers/data-provider.tsx` - Main data logic
- `src/components/reports/` - Report components
- `src/components/layout/` - Layout components

### **API:**
- `src/app/api/auth/` - Authentication
- `src/app/api/team/` - Team management
- `src/app/api/notifications/` - Notifications

---

## 🎨 UI Components

### **Form Components:**
- OwnerCombobox - User selection dropdown
- CompanyPicker - Company selection
- ContactPicker - Contact selection

### **Display Components:**
- NotificationBell - Notification indicator
- NotificationToast - Popup notifications
- Pagination - Page navigation
- Charts - Recharts visualizations

---

##  Security Notes

### **Row Level Security (RLS):**
- Currently DISABLED on all tables
- Recommended for production
- Use policies to restrict access

### **API Security:**
- All routes require authentication
- Service role key for server-side only
- Anon key for client-side

### **Best Practices:**
- Never commit `.env.local`
- Rotate keys regularly
- Enable RLS in production
- Use HTTPS only

---

## 📈 Performance Benchmarks

### **Target Metrics:**
- Dashboard Load: < 1.5s
- Reports Load: < 2s
- API Response: < 150ms
- Database Query: < 100ms

### **Current Performance:**
- Dashboard: ~1s ✅
- Reports: ~1.5s ✅
- API: ~100ms ✅
- Queries: ~75ms ✅

---

## 🔄 Merge to Main Branch

### **Steps:**
```bash
# 1. Checkout main branch
git checkout main

# 2. Pull latest
git pull origin main

# 3. Merge feature branch
git merge feature/multi-user-phase1

# 4. Resolve conflicts if any
# 5. Test thoroughly
# 6. Push to main
git push origin main
```

### **Alternative (Force Push):**
```bash
# WARNING: This overwrites main branch
git checkout feature/multi-user-phase1
git push origin feature/multi-user-phase1:main --force
```

---

##  Support Checklist

### **Before Asking for Help:**
- [ ] Checked console for errors
- [ ] Verified Supabase connection
- [ ] Checked database tables exist
- [ ] Verified environment variables
- [ ] Restarted development server
- [ ] Cleared browser cache

### **Information to Provide:**
- Error message from console
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Node.js version

---

## 🎓 Learning Resources

### **Documentation:**
- [Complete CRM Documentation](./COMPLETE_CRM_DOCUMENTATION.md)
- [Performance Optimizations](./PERFORMANCE_OPTIMIZATIONS.md)
- [Performance Audit Complete](./PERFORMANCE_AUDIT_COMPLETE.md)

### **External Resources:**
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev

---

**Last Updated:** August 29, 2026
**Maintained By:** Development Team
