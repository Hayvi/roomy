# Database Backup & Restore Scripts

## 📦 Backup Database

Creates a timestamped backup of your Supabase database.

### Quick Start

```bash
# Set your password once (optional but recommended)
export SUPABASE_DB_PASSWORD="your_database_password"

# Run backup
./scripts/backup-database.sh
```

**What it does:**
- Creates backup in `backups/roomy_backup_YYYYMMDD_HHMMSS.sql`
- Automatically keeps only the last 7 backups
- Shows backup size and location

### Find Your Password

1. Go to Supabase Dashboard → Settings → Database
2. Look for "Database Password" or reset it
3. Copy the password

---

## 🔄 Restore Database

Restores your database from a backup file.

### Quick Start

```bash
# Set your password
export SUPABASE_DB_PASSWORD="your_database_password"

# Run restore (it will show you available backups)
./scripts/restore-database.sh
```

**What it does:**
- Lists available backups
- Asks you to choose which one to restore
- Confirms before overwriting data
- Restores the selected backup

---

## 🔒 Security Tips

1. **Never commit backups to Git** (they're in `.gitignore`)
2. **Store password securely** - don't hardcode it in scripts
3. **Test restore** on a test database first
4. **Backup before risky changes** (like migrations)

---

## ⏰ Automated Backups (Optional)

Add to your crontab for weekly backups:

```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 cd /home/supa/supabase-check-and-go-main && ./scripts/backup-database.sh
```

---

## 📋 Backup Best Practices

1. **Before migrations**: Always backup before running new migrations
2. **Weekly schedule**: Set up automated weekly backups
3. **Before deployment**: Backup before major deployments
4. **Keep offsite**: Copy important backups to cloud storage (Google Drive, etc.)
