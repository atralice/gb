#!/bin/bash

set -e

ENV=$1
shift

if [[ "$ENV" != "production" && "$ENV" != "staging" ]]; then
  echo "Unknown environment: $ENV"
  exit 1
fi

# Load env file for the target environment so PRODUCTION_* / STAGING_* vars are set
ENV_FILE=".env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

if [[ "$ENV" == "production" ]]; then
  ENCRYPTION_SECRET=$PRODUCTION_ENCRYPTION_SECRET
  DATABASE_URL=$PRODUCTION_DATABASE_URL
  NEXT_PUBLIC_APP_ENV=production
  REQUIRED_VARS=( "PRODUCTION_DATABASE_URL")
  CONFIRM_MSG="Are you sure you want to run this script in *production*? (yes/no)"
elif [[ "$ENV" == "staging" ]]; then
  ENCRYPTION_SECRET=$STAGING_ENCRYPTION_SECRET
  DATABASE_URL=$STAGING_DATABASE_URL
  NEXT_PUBLIC_APP_ENV=staging
  REQUIRED_VARS=("STAGING_ENCRYPTION_SECRET" "STAGING_DATABASE_URL" "HUBSPOT_API_KEY")
fi

for VAR in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!VAR}" ]]; then
    echo "Error: $VAR is not set"
    exit 1
  fi
done

if [[ "$ENV" == "production" ]]; then
  read -p "$CONFIRM_MSG " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

ENCRYPTION_SECRET=$ENCRYPTION_SECRET DATABASE_URL=$DATABASE_URL HUBSPOT_API_KEY=$HUBSPOT_API_KEY SLACK_TOKEN=$SLACK_TOKEN NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV bun "$@"