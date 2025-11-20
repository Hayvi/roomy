#!/bin/bash

# Supabase Database Backup Script
# This script creates a backup of your Supabase database

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/roomy_backup_$DATE.sql"

# Database connection details
DB_HOST="aws-0-eu-central-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.qowdewkmqsxzrlbceoet"

echo -e "${YELLOW}🔄 Starting Supabase Database Backup...${NC}"

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump is not installed!${NC}"
    echo -e "Install it with: ${YELLOW}sudo apt install postgresql-client${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Prompt for password if not set
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}💡 Set SUPABASE_DB_PASSWORD environment variable to avoid this prompt${NC}"
    read -sp "Enter your Supabase database password: " DB_PASSWORD
    echo
else
    DB_PASSWORD="$SUPABASE_DB_PASSWORD"
fi

# Perform backup
echo -e "${YELLOW}📦 Creating backup: $BACKUP_FILE${NC}"

PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "📄 File: $BACKUP_FILE"
    echo -e "📊 Size: $BACKUP_SIZE"
    
    # Keep only last 7 backups
    echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 7)...${NC}"
    ls -t "$BACKUP_DIR"/roomy_backup_*.sql | tail -n +8 | xargs -r rm
    echo -e "${GREEN}✅ Done!${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
