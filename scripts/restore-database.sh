#!/bin/bash

# Supabase Database Restore Script
# This script restores your Supabase database from a backup file

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"

# Database connection details
DB_HOST="aws-0-eu-central-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.qowdewkmqsxzrlbceoet"

echo -e "${YELLOW}🔄 Supabase Database Restore${NC}"

# Check if pg_dump is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql is not installed!${NC}"
    echo -e "Install it with: ${YELLOW}sudo apt install postgresql-client${NC}"
    exit 1
fi

# List available backups
echo -e "\n${YELLOW}📋 Available backups:${NC}"
ls -lh "$BACKUP_DIR"/roomy_backup_*.sql 2>/dev/null | awk '{print NR". "$9" ("$5")"}'

# Check if any backups exist
if [ $(ls "$BACKUP_DIR"/roomy_backup_*.sql 2>/dev/null | wc -l) -eq 0 ]; then
    echo -e "${RED}❌ No backups found in $BACKUP_DIR${NC}"
    exit 1
fi

# Prompt for backup file selection
echo -e "\n${YELLOW}Enter backup number to restore (or full path):${NC}"
read -r BACKUP_CHOICE

# If number, convert to filename
if [[ "$BACKUP_CHOICE" =~ ^[0-9]+$ ]]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/roomy_backup_*.sql | sed -n "${BACKUP_CHOICE}p")
else
    BACKUP_FILE="$BACKUP_CHOICE"
fi

# Verify file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will REPLACE all data in your database!${NC}"
echo -e "Backup file: $BACKUP_FILE"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Restore cancelled${NC}"
    exit 0
fi

# Prompt for password if not set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}💡 Set SUPABASE_DB_PASSWORD environment variable to avoid this prompt${NC}"
    read -sp "Enter your Supabase database password: " DB_PASSWORD
    echo
else
    DB_PASSWORD="$SUPABASE_DB_PASSWORD"
fi

# Perform restore
echo -e "${YELLOW}🔄 Restoring database...${NC}"

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$BACKUP_FILE"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi
