# KhelaGhor

KhelaGhor is a Bangladesh-first children’s eCommerce platform built with Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL and Prisma. It sells toys, books, kids’ clothing, newborn products, baby care, school supplies, gifts, outdoor products and room accessories in BDT.

## Features

- Premium responsive storefront with home, shop, filters, categories, brands, products, search, cart and checkout.
- Customer account area for orders, wishlist, addresses, reviews, returns, support, profile and security.
- Admin panel for dashboard, catalog, inventory, orders, customers, returns, refunds, content, coupons, promotions, reports, staff, roles, permissions, integrations and settings.
- Prisma schema for auth, RBAC, catalog, inventory, cart, checkout, orders, payments, coupons, returns, support, notifications, blog/CMS, newsletter and audit logs.
- Seed data for roles, permissions, dev admin, categories, brands, products, coupons and settings.
- SEO: metadata, sitemap, robots, clean slugs and private route noindex/disallow foundations.
- Tests: Vitest commerce-unit tests and Playwright smoke tests.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- PostgreSQL, Prisma ORM
- Auth.js-ready architecture
- Zod, React Hook Form-ready forms
- Lucide React, Recharts-ready admin analytics
- bcryptjs for password hashing
- Vitest and Playwright

## Folder Structure

- `src/app`: App Router pages, route handlers, SEO routes
- `src/components`: reusable UI and page sections
- `src/data`: demo catalog data used by storefront surfaces
- `src/lib`: commerce calculations, formatting and helpers
- `prisma`: database schema and seed script
- `tests`: unit tests
- `e2e`: Playwright tests

## Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Configure at minimum:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_URL` when using pooled database connections

Server-only provider secrets must stay out of `NEXT_PUBLIC_*` variables. Public analytics/domain variables use the `NEXT_PUBLIC_` prefix; payment, courier, storage, email and admin bootstrap credentials are server-only.

Optional integration variables are documented in `.env.example` for OAuth, Cloudinary/S3/R2, payment gateways, courier, email, SMS and WhatsApp.

## PostgreSQL

This project is currently configured for local Homebrew PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/khelaghor?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/khelaghor?schema=public
```

Start PostgreSQL on this machine:

```bash
pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/khelaghor-postgres.log start
```

If the `postgres` role does not exist in a Homebrew cluster that uses your macOS username, create the development role:

```bash
psql -d postgres -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD 'postgres';"
```

Create a local database:

```bash
createdb khelaghor
```

Then run:

```bash
npm run db:check
npm run db:migrate:dev
npm run db:seed
```

For quick local prototyping only, `npm run db:push` is still available. For shared, staging or production databases, use reviewed Prisma migrations.

## Admin Login

The seed script creates a development Super Admin from:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Do not use the example password in production.

For production, create the first admin explicitly after migrations:

```bash
ADMIN_BOOTSTRAP_EMAIL=owner@example.com \
ADMIN_BOOTSTRAP_PASSWORD='replace-with-a-strong-unique-password' \
ADMIN_BOOTSTRAP_NAME='Store Owner' \
npm run admin:create
```

The bootstrap admin is marked `forcePasswordChange=true` and is redirected to `/account/security` on first login.

## Commands

- `npm run dev`: start local development
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: ESLint
- `npm run typecheck`: strict TypeScript
- `npm run format`: Prettier write
- `npm run format:check`: Prettier check
- `npm run test`: Vitest unit tests
- `npm run test:e2e`: Playwright tests
- `npm run admin:create`: create or rotate the first production admin from explicit environment variables
- `npm run db:check`: verify Prisma can connect to the configured database
- `npm run db:generate`: Prisma client generation
- `npm run db:migrate`: Prisma dev migration
- `npm run db:migrate:dev`: create/apply development migrations
- `npm run db:migrate:deploy`: apply committed migrations in staging/production
- `npm run db:push`: push schema
- `npm run db:seed`: seed demo data
- `npm run db:studio`: Prisma Studio

## Deployment

Vercel is the primary target:

1. Push the repository to GitHub.
2. Create a Vercel project.
3. Add production environment variables.
4. Connect managed PostgreSQL.
5. Run `npm run db:migrate:deploy` safely through CI or a controlled release step.
6. Configure storage, payment, courier and notification credentials.

The repository includes a baseline Prisma migration at `prisma/migrations/20260713150000_initial_baseline/migration.sql`. Use it for new staging/production databases. Existing local databases that were created with `db:push` should be reset/recreated for development, or baselined carefully before using `migrate deploy`.

Recommended Vercel build settings:

- Build command: `npm run build`
- Install command: `npm install`
- Production migration command: `npm run db:migrate:deploy` in CI or a controlled release step before traffic is switched.
- Runtime database URL: `DATABASE_URL`.
- Direct migration URL: `DIRECT_URL`.

No `vercel.json` is required currently.

## Production Database

Use managed PostgreSQL such as Neon, Supabase or another compatible provider.

1. Create the database and enable SSL.
2. Add pooled runtime `DATABASE_URL` if your provider recommends pooling for serverless.
3. Add non-pooled `DIRECT_URL` for Prisma migrations.
4. Run `npm run db:migrate:deploy`.
5. Do not run `prisma db push` in production.
6. Seed only static reference/catalog data after reviewing the seed policy; production admin creation should use `npm run admin:create`.
7. Enable automated backups and test restore before launch.
8. Roll back by restoring the latest backup and redeploying the previous app version. Do not hand-edit production schema during incidents.

## Integration Notes

- Storage uses local files in development and Cloudinary in production when `STORAGE_DRIVER=cloudinary`.
- SSLCommerz supports mock, sandbox and live modes through `SSLCOMMERZ_MODE`.
- SSLCommerz success/IPN callbacks verify server-side before marking payments paid.
- Courier integration uses a provider interface with mock default and tracking fields on orders.
- Email uses a development logger by default and Resend when `EMAIL_PROVIDER=resend`.
- SMS/WhatsApp use provider-neutral interfaces with mock fallback until credentials are supplied.
- Analytics scripts load only when public Google/Meta IDs are configured.

## Domain And SEO

Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain, for example `https://www.khelaghor.com.bd`.

On Vercel:

1. Add the apex and `www` domains.
2. Add the Vercel DNS records requested in the dashboard.
3. Wait for SSL verification.
4. Choose the canonical domain and configure redirects in the domain settings.
5. Confirm `/sitemap.xml`, `/robots.txt`, Open Graph URLs and email links use the canonical domain.

## Secret Rotation

- Rotate `AUTH_SECRET` only with a planned forced logout window.
- Rotate payment, courier, storage and email secrets in the provider dashboard first, then update Vercel environment variables.
- Redeploy after secret changes.
- Never expose server-only secrets through `NEXT_PUBLIC_*`.

## Production Checklist

- Use strong `AUTH_SECRET`.
- Create production admin with `npm run admin:create`; do not seed default credentials.
- Enable real Auth.js credential/OAuth callbacks.
- Configure HTTPS-only secure cookies.
- Review RBAC permissions per staff role.
- Configure payment callback verification.
- Add real legal copy and courier/payment policies.
- Run `npm run db:check`, `npm run db:migrate:deploy`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` and `npm run build`.
