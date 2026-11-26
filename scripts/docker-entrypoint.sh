#!/bin/sh
set -e

echo "[AW Packaging Tracker] Checking database schema compatibility..."
set +e
npx tsx scripts/ensure-aw-schema.ts
SCHEMA_CODE=$?
set -e

if [ "$SCHEMA_CODE" = "10" ]; then
  echo "[AW Packaging Tracker] Legacy ImportCase schema detected — upgrading to AW Packaging Tracker schema..."
  npx prisma migrate reset --force --skip-seed
else
  echo "[AW Packaging Tracker] Running Prisma migrations..."
  npx prisma migrate deploy
fi

if [ "${AUTO_SEED}" = "true" ]; then
  echo "[AW Packaging Tracker] Running idempotent Master Directory & Demo seed..."
  npx tsx prisma/seed/index.ts
fi

echo "[AW Packaging Tracker] Starting Next.js standalone server on 0.0.0.0:${PORT:-3000}..."
exec node server.js
