# Importal — House Brand Import & Packaging Workflow System

Full-stack web application for managing Central Retail / CHG House Brand imports end-to-end across 5 stages (`Sourcing` → `PI & Packaging` → `Purchase Order` → `Production` → `Inspection & Logistic` → `Closed`), styled in **Theme 4: Corporate Sidebar (Green)**.

## Local Development

1. Start local infrastructure (PostgreSQL `:5442`, MinIO `:9010/:9011`, Mailpit `:1025/:8025`):
   ```bash
   docker compose up -d
   ```
2. Install dependencies, run migrations, and seed Master Data + Sample Cases:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 (Dev Role Switcher enabled in top-right bar). Check captured emails at Mailpit http://localhost:8025.

## Verification Commands

- Unit tests (Vitest): `npm test`
- Type check: `npm run typecheck`
- Production build: `npm run build`
- E2E tests (Playwright): `npx playwright install chromium && npm run test:e2e`
- Manual Daily 08:00 Overdue Digest run: `npm run job:overdue-digest`

## Production Deployment (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Schedule the daily 08:00 (`Asia/Bangkok`) overdue digest via cron or Kubernetes CronJob calling:
```bash
curl -X POST https://<host>/api/jobs/overdue-digest -H "x-cron-secret: $CRON_SECRET"
```
