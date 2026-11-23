#!/bin/sh
set -e

echo "[Importal] Running Prisma migrations..."
npx prisma migrate deploy

if [ "${AUTO_SEED}" = "true" ]; then
  echo "[Importal] Running idempotent Master Data & Sample seed..."
  npx tsx prisma/seed/index.ts
fi

echo "[Importal] Starting Next.js standalone server on 0.0.0.0:${PORT:-3000}..."
exec node server.js
