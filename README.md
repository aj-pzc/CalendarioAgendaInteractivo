# CCR Meeting Room Reservation System

A multi-tenant reservation platform for managing shared meeting rooms and offices, with role-based access for `MASTER`, `ADMIN`, and `USER` accounts.

## Stack

- Next.js App Router, React, and TypeScript
- MySQL with Prisma ORM
- Vercel for the application and Railway for the database

## Local development

Requirements: Node.js 20.9 or later and npm.

```powershell
npm ci
npx prisma generate
npm run dev
```

Set `DATABASE_URL` and a randomly generated `SESSION_SECRET` in `.env` before running Prisma commands or the application.

## Deploying to Vercel with Railway

1. Import this repository into Vercel and set the project root to the repository root.
2. Add `DATABASE_URL` and `SESSION_SECRET` to the Vercel environments that need access to the application. Use a Railway connection URL reachable from Vercel, and keep both values out of source control. `SESSION_SECRET` must be a randomly generated secret with at least 32 characters.

Generate a session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

3. Vercel can use the default Next.js build command, `npm run build`. This script generates the Prisma client explicitly before building the application.
4. The Railway database for this project was created with `prisma db push`. Its existing `Company`, `User`, and `Reservation` tables match the current Prisma schema. The baseline migration must be marked as applied once; do not run it against this existing database as a create-table migration.

For the existing Railway database, set `DATABASE_URL` locally to the Railway URL and run this once from the repository root:

```powershell
npx prisma migrate resolve --applied 20261105160000_baseline_mysql
```

This records the baseline in Prisma's migration history and does not recreate or alter the existing tables. For a new empty database, use `npx prisma migrate deploy` instead to create the tables from the baseline.

Existing sessions will need to sign in again after deployment because session cookies are now signed with `SESSION_SECRET`.

For future schema changes, create and review a migration locally with `npx prisma migrate dev`, commit the migration files, and apply them to Railway with `npx prisma migrate deploy` before sending application traffic that depends on the new schema. Do not run `migrate deploy` against the existing Railway database until the baseline has been marked as applied.

The monthly hours balance adds the `Company.horasPeriodo` column. On the existing Railway database, first mark the baseline as applied if that has not been done, then run `npx prisma migrate deploy` to apply the new migration before deploying code that reads this field.

Hours are shared by all users in a company. The displayed balance is the assigned monthly bag minus hours used. Reservations consume hours when created, edits adjust the difference, and cancellations return the charged hours. MASTER can also adjust usage for meetings managed outside the app; both usage and manual adjustments apply only to the current month in `America/Mexico_City`.

## Optional master-account seed

The seed creates a master account only when the configured email and username do not already exist. It does not reset an existing account's password. Configure these environment variables before running `npx prisma db seed`:

- `SEED_MASTER_EMAIL`
- `SEED_MASTER_USERNAME`
- `SEED_MASTER_NAME`
- `SEED_MASTER_PASSWORD`
- `SEED_MASTER_COMPANY` (optional; defaults to `CCR Business`)
- `SEED_MASTER_DEPARTMENT` (optional; defaults to `Dirección`)

Do not run the seed against Railway if the master account is already present.

Password recovery requires the user's registered email and username. After changing the password, the account is marked as pending approval; the user cannot sign in or perform authenticated actions until a `MASTER` approves the account again.
