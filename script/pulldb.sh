#!/bin/bash

set -e

# Check if the environment argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

ENV=$1

# Set URLs based on the provided environment
if [ "$ENV" == "staging" ]; then
  if [ -z "$STAGING_DATABASE_URL" ] || [ -z "$DATABASE_URL" ]; then
    echo "Both STAGING_DATABASE_URL and DATABASE_URL must be set"
    exit 1
  fi
  SOURCE_DATABASE_URL=$STAGING_DATABASE_URL
elif [ "$ENV" == "production" ]; then
  if [ -z "$PRODUCTION_DATABASE_URL" ] || [ -z "$DATABASE_URL" ]; then
    echo "Both PRODUCTION_DATABASE_URL and DATABASE_URL must be set"
    exit 1
  fi
  SOURCE_DATABASE_URL=$PRODUCTION_DATABASE_URL
else
  echo "Invalid environment: $ENV. Use 'staging' or 'production'."
  exit 1
fi

# Check if DATABASE_URL points to localhost
if [[ "$DATABASE_URL" != *"localhost"* ]]; then
  echo "DATABASE_URL must point to localhost"
  exit 1
fi

DB_NAME=$(basename "$DATABASE_URL")
SYSTEM_DB_URL="${DATABASE_URL/$DB_NAME/postgres}"

# Check if ENCRYPTION_SECRET is set
if [ -z "$ENCRYPTION_SECRET" ]; then
  echo "ENCRYPTION_SECRET must be set"
  exit 1
fi

# Generate encrypted mock values
echo "Generating encrypted mock values..."
ENCRYPTED_SSN=$(bun run ./script/db/encryptArgs.ts "123456789")
ENCRYPTED_EIN=$(bun run ./script/db/encryptArgs.ts "987654321")
EXCHANGE_BANK_ACCOUNT_NUMBER='111111111111'

# Clean up dumps older than 1 week
find tmp -name "${ENV}-*.sql" -type f -mtime +7 -delete 2>/dev/null || true

# Set the date format for the dump file
DUMP_DATE=$(date +"%Y%m%d-%H%M%S")
DUMP_FILE="tmp/${ENV}-${DUMP_DATE}.sql"

# Check for existing dumps before making any database changes
LATEST_DUMP=$(ls -t tmp/${ENV}-*.sql 2>/dev/null | head -n1)
if [ ! -z "$LATEST_DUMP" ]; then
  # Remove any older dumps
  find tmp -name "${ENV}-*.sql" ! -name "$(basename $LATEST_DUMP)" -delete 2>/dev/null || true
  
  echo "Found existing dump from $(basename $LATEST_DUMP | sed "s/${ENV}-\([0-9]\{8\}-[0-9]\{6\}\).*/\1/")"
  read -p "Would you like to use this dump? (y/n) " USE_EXISTING
  if [[ $USE_EXISTING =~ ^[Yy]$ ]]; then
    SELECTED_DUMP=$LATEST_DUMP
    echo "Using most recent dump: $SELECTED_DUMP"
  fi
fi

# Disconnect any active connections to the local database
psql "$SYSTEM_DB_URL" -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate the local database
psql "$SYSTEM_DB_URL" -c "DROP DATABASE IF EXISTS $DB_NAME"
psql "$SYSTEM_DB_URL" -c "CREATE DATABASE $DB_NAME"

if [ ! -z "$SELECTED_DUMP" ]; then
  # Use the selected dump
  cat "$SELECTED_DUMP" | psql "$DATABASE_URL"
  echo "Local database overwritten with existing sanitized $ENV dump."
  exit 0
fi

# If we get here, we're not using an existing dump
echo "Importing from $ENV database..."
pg_dump --no-owner --clean --if-exists --no-acl "$SOURCE_DATABASE_URL" | psql "$DATABASE_URL"

echo "Local database overwritten with $ENV database."

# Remove encrypted data and replace with fake encrypted values
echo "Removing sensitive encrypted data..."
psql "$DATABASE_URL" <<EOF
-- Remove existing encrypted data
UPDATE "User" SET "encryptedSsn" = '$ENCRYPTED_SSN' WHERE "encryptedSsn" IS NOT NULL;
UPDATE "Exchange" SET "encryptedEntityEin" = '$ENCRYPTED_EIN' WHERE "encryptedEntityEin" IS NOT NULL;
UPDATE "ExchangeBankAccount" SET "accountNumber" = '$EXCHANGE_BANK_ACCOUNT_NUMBER' WHERE "accountNumber" IS NOT NULL;
UPDATE "Event" SET "encryptedData" = NULL WHERE "encryptedData" IS NOT NULL;
EOF

# Create sanitized dump
echo "Creating sanitized database dump file..."
pg_dump --no-owner --clean --if-exists --no-acl "$DATABASE_URL" > "$DUMP_FILE"
echo "Sanitized database dump saved to $DUMP_FILE"

echo "Local database overwritten with $ENV database and sensitive data replaced."
