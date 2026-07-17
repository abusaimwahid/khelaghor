# Dedicated Staging Setup

Use a separate Vercel project or protected staging project—not the public production domain.

1. Create a separate PostgreSQL database with no production customer data and separate backup/PITR policy.
2. Set `APP_ENV=staging`, unique `AUTH_SECRET`, staging `DATABASE_URL`/`DIRECT_URL`, and an HTTPS `NEXT_PUBLIC_SITE_URL`.
3. Configure Cloudinary with staging-only credentials/folders. Never reuse production asset folders. Local storage is rejected in staging.
4. Configure `SSLCOMMERZ_MODE=sandbox` plus sandbox store credentials. Register HTTPS success/failure/cancel/IPN URLs under `/api/payments/sslcommerz/*`.
5. Select one courier and provide staging API credentials plus a unique webhook secret; webhook URL is `/api/courier/webhook`.
6. Configure `EMAIL_PROVIDER=resend`, a verified test sender/domain and staging-only recipients. Configure Sentry environment/release and staging analytics properties if consent requirements are satisfied.
7. Run `npm ci`, `npm run db:migrate:deploy`, `npm run db:check`, `npm run db:generate`, and `npm run admin:create` with a unique staging administrator. Never enable development seed credentials.
8. Create synthetic customers and seven restricted-role test accounts. Do not import production orders, files, addresses or credentials.
9. Protect staging with Vercel access controls, robots noindex, limited operator access and provider IP/signature verification where supported.
10. After testing, export evidence, run cleanup in dry-run mode, remove synthetic provider assets/orders, revoke test sessions/credentials and retain audit/backup evidence per policy.

Required variables are listed in `.env.example`. Environment validation fails without HTTPS, remote storage, non-development email and credentials for selected sandbox providers; error messages never include secret values.
