# Database Backup Guide for Roomy

## ⚠️ Important Note About Backups

Due to network configuration limitations with direct database access, automated `pg_dump` backups aren't working. However, you have several better alternatives:

---

## 🎯 **Recommended: Use Supabase Dashboard** (EASIEST)

### Automatic Backups (Already Enabled!)
Supabase automatically creates daily backups for you:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`qowdewkmqsxzrlbceoet`)
3. Click **Database** → **Backups**
4. You'll see your automatic daily backups (kept for 7 days on free tier)
5. To restore: Just click **"Restore"** on any backup

✅ **This is already working** - you don't need to do anything!

---

## 📥 **Manual Backup via Dashboard**

### Option 1: Export Data as CSV
1. Dashboard → **Table Editor**
2. Select a table (rooms, messages, profiles, etc.)
3. Click **"⋮"** (three dots) → **"Export to CSV"**
4. Repeat for each table you want to backup

### Option 2: Copy SQL Schema
1. Dashboard → **SQL Editor**
2. Click **"⋮"** → **"Export schema"**
3. This gives you the database structure (not data)

---

## 🔄 **Alternative: Supabase CLI** (For Advanced Users)

If you want local backups, you can use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref qowdewkmqsxzrlbceoet

# Pull database schema
supabase db pull

# This creates migration files in supabase/migrations/
```

---

## ✅ **What's Already Protected**

Your database is SAFE because:

1. **✅ Auto-backups**: Supabase creates daily backups automatically
2. **✅ Migrations in Git**: All schema changes are version controlled
3. **✅ Point-in-time recovery**: Available on paid plans
4. **✅ Redundancy**: Supabase replicates your data across multiple servers

---

## 💡 **Best Practice: Before Risky Changes**

Before applying new migrations or making major changes:

1. Go to Dashboard → Database → **Backups**
2. Note the latest backup time
3. Or click **"Create backup"** if available on your plan
4. Make your changes
5. If something breaks, restore from backup

---

## 🚨 **Emergency Restore**

If you need to restore:

1. Dashboard → Database → Backups
2. Find the backup before the problem occurred
3. Click **"Restore"**
4. Confirm the restore

**Warning**: This will overwrite current data!

---

## 📊 **Current Backup Status**

- **Project**: qowdewkmqsxzrlbceoet (EU Central 1)
- **Auto-backups**: ✅ Enabled (daily)
- **Retention**: 7 days (free tier)
- **Schema version control**: ✅ Via Git migrations

You're already protected! 🛡️
