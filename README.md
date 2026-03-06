# B&C / FRECKLES EVENTS TRACKER

Private internal web application for weekly event entry, archived reporting, user management, audit logging, and Vercel-based weekly report automation.

## Verified Stack

- Next.js `16.1.6`
- React `19.2.4`
- TypeScript `5.9.3`
- Tailwind CSS `4.2.1`
- Prisma ORM `7.4.2`
- PostgreSQL with `pg` `8.20.0`
- NextAuth / Auth.js for Next.js `4.24.13`
- Zod `4.3.6`
- Resend `6.9.3`
- CSV export via `csv-stringify` `6.6.0`
- XLSX export via `exceljs` `4.4.0`

## Important Choices

- Auth is implemented with stable `next-auth@4` credentials sessions instead of Auth.js v5 beta.
- Route protection is enforced server-side in layouts, route handlers, and services instead of relying on middleware/proxy coupling.
- `xlsx` was intentionally not used in the final implementation because the current stable npm package has unresolved high-severity advisories. `exceljs` is used for XLSX generation instead.
- The weekly job is scheduled daily in UTC via Vercel Cron and only executes the report flow when the request lands on Monday in `America/New_York`. This avoids DST bugs from hard-coding a single UTC week rollover.

## Architecture Summary

- `src/app/(public)` contains the formal login surface.
- `src/app/(app)` contains protected dashboard, archive, entry detail/edit, and admin pages.
- `src/app/api` contains auth, entry CRUD, admin operations, and cron endpoints.
- `src/lib` contains auth setup, Prisma access, timezone logic, validation, audit logging, entry services, report services, and user services.
- `prisma` contains the schema, generated initial migration SQL, Prisma config, and seed script.

## Environment Variables

Use [.env.example](/c:/Users/ellie/Downloads/newWeb/.env.example) as the source of truth.

Required at runtime:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`
- `REPORT_TO_EMAIL`
- `APP_TIMEZONE`

Required for seeding:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_PASSWORD`

Optional extra seeded user:

- `SEED_USER_EMAIL`
- `SEED_USER_NAME`
- `SEED_USER_PASSWORD`

## Local Launch

1. Copy `.env.example` to `.env` and fill in real values.
2. Ensure PostgreSQL is available and `DATABASE_URL` points to it.
3. Apply the migration:

```bash
npm run prisma:deploy
```

4. Seed the initial approved users:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

## Database

- Prisma schema: [prisma/schema.prisma](/c:/Users/ellie/Downloads/newWeb/prisma/schema.prisma)
- Initial migration SQL: [migration.sql](/c:/Users/ellie/Downloads/newWeb/prisma/migrations/202603070001_init/migration.sql)
- Migration lock: [migration_lock.toml](/c:/Users/ellie/Downloads/newWeb/prisma/migrations/migration_lock.toml)

## Weekly Automation

- Cron path: `/api/cron/weekly-report`
- Vercel config: [vercel.json](/c:/Users/ellie/Downloads/newWeb/vercel.json)
- Schedule: `15 9 * * *`

Operational behavior:

- Vercel hits the cron endpoint daily.
- The handler only runs the report flow when the request occurs on Monday in `America/New_York`.
- The generated report targets the previous closed business week.
- On email success, the report is marked `SENT` and that week’s entries are archived.
- On email failure, the report is marked `FAILED`, entries are not archived, and admins can retry from the report history page.

## Deployment Notes For Vercel

### Recommended Production Flow

1. Push to GitHub.
2. In Vercel, click `Add New Project` and import this repository.
3. Let Vercel detect `Next.js` automatically.
4. Leave the framework preset and default build command in place.
5. Add the required environment variables in the Vercel project before the first production deployment.
6. Redeploy after saving the environment variables.
7. Apply database migrations to production.
8. Seed the initial approved users once.

### Required Vercel Environment Variables

Production:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`
- `EMAIL_MODE`
- `REPORT_TO_EMAIL`
- `APP_TIMEZONE`

Only required when `EMAIL_MODE="resend"`:

- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`

Seed values can stay out of Vercel after first-time setup if you seed manually from a secure local shell:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_PASSWORD`
- `SEED_USER_EMAIL`
- `SEED_USER_NAME`
- `SEED_USER_PASSWORD`

Recommended production values:

- `NEXTAUTH_URL="https://<your-production-domain>"`
- `APP_TIMEZONE="America/New_York"`
- `EMAIL_MODE="disabled"` until a verified Resend sender domain is ready

### Preview Deployment Guidance

- Do not point Preview deployments at the production database if you expect schema changes.
- Vercel Preview environments should use a separate preview/staging `DATABASE_URL`.
- If you do not need preview report delivery, keep `EMAIL_MODE="disabled"` for Preview.
- Add branch-specific Preview environment variables in Vercel when needed.

### Database Migrations

This repository now includes a GitHub Actions workflow at [.github/workflows/prisma-migrate-production.yml](/c:/Users/ellie/Downloads/newWeb/.github/workflows/prisma-migrate-production.yml).

What it does:

- runs on pushes to `main`
- only runs when `prisma/migrations/**` or `prisma/schema.prisma` changes
- executes `npx prisma migrate deploy` against the `DATABASE_URL` GitHub secret

Required GitHub repository secret:

- `DATABASE_URL`

This keeps schema deployment separate from Vercel Preview builds, which is safer than running migrations during every Vercel build.

### First-Time Production Setup Checklist

1. Import the GitHub repo into Vercel.
2. Add Production environment variables in Vercel.
3. Set `CRON_SECRET` in Vercel so cron requests automatically include the `Bearer` authorization header.
4. Trigger the first Production deployment.
5. Add the `DATABASE_URL` secret to GitHub Actions.
6. If migrations already exist, run `npm run prisma:deploy` once against production or push a commit that includes the migration files.
7. Seed the first admin user:

```bash
npm run db:seed
```

8. Sign in to the deployed app and verify:
   - login works
   - dashboard loads
   - entry creation works
   - admin report history loads
   - cron route is protected

### Vercel Cron

- Cron config lives in [vercel.json](/c:/Users/ellie/Downloads/newWeb/vercel.json).
- Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the project.
- The app still performs its own `America/New_York` due-check before generating a weekly report.

### Email Delivery

- The safest deployment path right now is `EMAIL_MODE="disabled"`.
- In that mode, admins can generate and download CSV/XLSX manually from the report history page.
- Switch to `EMAIL_MODE="resend"` only after `RESEND_API_KEY` and a verified `REPORT_FROM_EMAIL` domain are ready.

## Manual Test Checklist

- Login with valid admin credentials.
- Login failure is rejected with invalid credentials.
- Standard user can create a current-week entry.
- Review modal appears and summarizes all form values before save.
- Current-week list updates after save.
- Standard user can view archived entries and entry detail pages.
- Admin can edit an active entry.
- Admin can delete an active entry.
- Admin can create a new approved user.
- Admin can change a user role and activation state.
- Admin can trigger a manual weekly report for a closed week.
- Failed report attempts remain unarchived and show a retry action.
- Successful report attempts mark the report as sent and archive the week.
- Theme toggle persists between navigations.
- Audit logs are created for auth, entry mutations, user changes, and report actions.

## Verification Commands

```bash
npm run typecheck
npm run lint
```

## Residual Notes

- `npm audit` currently reports unresolved advisories in Prisma CLI transitive dependencies. Those findings are in Prisma’s dev tooling chain, not in the application’s chosen XLSX export path. No direct production dependency with a known unpatched high-severity issue is intentionally left in place.
