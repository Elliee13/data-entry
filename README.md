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

1. Create a PostgreSQL database and set `DATABASE_URL`.
2. Set all runtime env vars in the Vercel project.
3. Ensure `CRON_SECRET` exists in Vercel so the cron request includes the bearer token expected by the route.
4. Configure a verified sender domain or sender address for Resend.
5. Run `npm run prisma:deploy` against production during deployment or as a pre-deploy step.
6. Run `npm run db:seed` once with the intended approved internal users.

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
