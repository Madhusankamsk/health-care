#!/bin/sh
set -e

# If a previous deploy failed mid-migration (e.g. P3018), Prisma blocks with P3009 until the row is cleared.
# This migration only used IF NOT EXISTS ALTERs and failed before the table existed, so marking rolled back is safe.
npx prisma migrate resolve --rolled-back "20260326102000_subscription_account_contact_fields" 2>/dev/null || true

npx prisma migrate deploy
npx prisma db seed
exec node dist/server.js
