# Staging Execution Log

## Run 2026-07-18 — local password-flow repair

- Reproduced the forced-password workflow against localhost PostgreSQL, not Neon.
- Confirmed the bootstrap/password-policy mismatch and generic error mapping in source.
- Added unit coverage for every complexity rule, confirmation mismatch, incorrect current password, password reuse, inactive account, invalid session, persistence, audit and session rotation.
- Added a Playwright forced-admin flow that verifies redirect, update, `forcePasswordChange=false`, exactly one replacement session, old-password rejection, new-password acceptance and `/admin` access.
- Local gate: lint PASS; typecheck PASS; Vitest 62/62 PASS; Playwright 5/5 PASS; build PASS.
- No staging variable, database row, deployment, alias, domain or production project was changed. Staging verification remains BLOCKED pending confirmed credential rotation; the administrator credential visible in user-provided evidence must also be replaced.

## Run 2026-07-18 — continuation retry

- Preflight: branch `staging`, committed HEAD `23cb745`, staging-only local Vercel link, and no tracked environment file: **PASS**.
- Neon installation check: `vercel integration installations` returned no installations: **BLOCKED**.
- Neon installation retry: Vercel again returned `integration_terms_acceptance_required` for the `abusaimwahids-projects` scope: **BLOCKED**.
- Database provisioning, Vercel database variables, migrations, synthetic seed, admin bootstrap, deployment, health, customer/admin smoke tests, role rehearsal and provider flows were not attempted after the prerequisite failure.
- Production project settings, variables, deployments and domains were not targeted. No staging push was performed, avoiding another automatic database-less deployment.

Required human evidence before continuation: the Neon installation must appear in `vercel integration installations` under `abusaimwahids-projects`. A statement that terms were accepted is not sufficient while the Vercel API continues to return the opposite state.

## Run 2026-07-18 — first genuine staging deployment attempt

Environment: protected Vercel project `khelaghor-staging`; branch `staging`; commit `23cb745`; tester: Codex. Production project `khelaghor` was not targeted.

| Action                          | Expected                                                  | Actual                                                                                                                                                                         | Status       | Safe evidence                                        |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ---------------------------------------------------- |
| Verify Git/project              | Clean complete staging commit and staging-only local link | Clean branch at `23cb745`; `.vercel/project.json` names `khelaghor-staging` project ID `prj_aZH8…`                                                                             | PASS         | Git/Vercel CLI output                                |
| Secret hygiene                  | No tracked environment files                              | `.env*` and `.vercel` ignored; no environment file returned by `git ls-files`                                                                                                  | PASS         | `git check-ignore`, `git ls-files`                   |
| Automatic Vercel deployment     | Build committed staging branch                            | Deployment `dpl_Ftq7Jq5bkAMtPT52dCc2YaXTEGtJ` cloned branch/commit correctly, compiled and typechecked, then failed during static generation because `DATABASE_URL` was absent | FAIL         | Redacted Vercel build log                            |
| Deployment URL                  | Ready protected staging hostname                          | `https://khelaghor-staging-i4jd4ic09-abusaimwahids-projects.vercel.app` exists as an ERROR deployment, not a usable staging URL                                                | FAIL         | `vercel inspect`                                     |
| Neon integration                | Terms accepted and integration installed                  | Vercel returned `integration_terms_acceptance_required` twice and reports no Marketplace installation                                                                          | BLOCKED      | Vercel integration response                          |
| Staging database/migrations     | Separate Neon database; 12 migrations current             | No resource or DATABASE_URL/DIRECT_URL exists; no migration command was pointed at staging                                                                                     | BLOCKED      | Environment-variable names and integration list      |
| Explicit staging storage policy | No ephemeral hosted writes without credentials            | Added `STORAGE_DRIVER=disabled`; upload/delete routes return honest HTTP 503; production rejects disabled/local modes                                                          | PASS locally | Environment tests and route implementation           |
| Explicit staging email policy   | Database logger only by explicit staging opt-in           | Added `EMAIL_PROVIDER=logger` plus `STAGING_ALLOW_EMAIL_LOGGER=true`; production/non-opt-in reject logger; no console email body in logger mode                                | PASS locally | Environment tests and notifier implementation        |
| Staging Vercel mock variables   | Applied only to staging project                           | Updated encrypted variable names for disabled storage/logger and added opt-in; values not printed                                                                              | PASS         | `vercel env ls production` on linked staging project |
| Admin/health/seed/smoke/roles   | Real deployed workflows                                   | Cannot run without database and READY deployment                                                                                                                               | BLOCKED      | Failed prerequisite                                  |

The failed deployment is useful negative evidence: hosted compilation works, but the application refuses to pretend it is operational without a database. It is not counted as a staging build, health, or provider pass.

### Production-project safety observation

The existing `khelaghor` Production deployment remains the same 2-day-old Ready deployment and no production environment variable/domain was targeted. However, final read-only inspection revealed that Vercel automatically created an ERROR **Preview** deployment on the `khelaghor` project from the same `staging` branch push. This occurred because both Vercel projects are connected to the repository. No command in this run targeted, removed or reconfigured that project. Preventing future cross-project preview builds requires an owner-approved production-project Git deployment setting change; it is recorded as BLOCKED because the task forbids modifying that project.

### Remaining unblock

The Vercel account still has not registered Neon Marketplace terms acceptance despite the task context saying it was accepted. The owner must complete the acceptance while signed into the same `abusaimwahids-projects` scope and confirm the installation appears in Vercel. The agent cannot accept third-party legal terms. Then retry the integration, create/connect a staging-only resource, verify non-local hosts without printing values, deploy migrations, and redeploy.

### Local verification after staging-policy change

| Command                     | Result                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run db:check`          | PASS on local development database only                                                     |
| `npm run db:generate`       | PASS — Prisma Client 6.19.3                                                                 |
| `npx prisma migrate status` | PASS locally — 12 migrations current; staging BLOCKED                                       |
| `npm run lint`              | PASS                                                                                        |
| `npm run typecheck`         | PASS                                                                                        |
| `npm run test`              | PASS — 13 files / 48 tests                                                                  |
| `npm run test:e2e`          | PASS — 4 local Chromium workflows                                                           |
| `npm run build`             | PASS locally — 5.1s compile, 4.2s TypeScript, 46 generated static pages plus dynamic routes |

## Run 2026-07-18 — Phase 8 private staging provisioning

| Action                                | Expected                                            | Actual                                                                                                                  | Status  | Safe evidence                                           |
| ------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------- |
| Preserve production project           | No changes/deployments to `khelaghor`               | Existing production deployment remains the same 2-day-old deployment; no production command targeted it                 | PASS    | `vercel ls khelaghor`                                   |
| Create staging branch                 | Separate `staging` branch on origin                 | Created locally and pushed tracking `origin/staging` at `d01c11b`                                                       | PASS    | Git branch/push output                                  |
| Create separate Vercel project        | Project named `khelaghor-staging`                   | Created project `prj_aZH8ovXYMfdIU964YiEszFpLIL12`                                                                      | PASS    | `vercel project inspect khelaghor-staging`              |
| Connect repository                    | Same GitHub repository, separate project            | Connected `abusaimwahid/khelaghor` to staging project                                                                   | PASS    | Vercel Git connection response                          |
| Link local directory                  | `.vercel/project.json` names staging only           | Project name is `khelaghor-staging`; production project ID differs                                                      | PASS    | Redacted project metadata inspection                    |
| Configure framework                   | Next.js automatic settings                          | Framework Next.js; build/install/output auto-detected                                                                   | PASS    | Vercel project inspection                               |
| Protect staging                       | Private access; no public custom domain             | SSO protects all non-custom-domain deployments; Git fork protection enabled; no custom domain/deployment                | PASS    | `vercel project protection khelaghor-staging`           |
| Create ignored staging env file       | No secrets committed                                | `.env.staging.local` created and confirmed ignored by `.env*` rule                                                      | PASS    | `git check-ignore -v`                                   |
| Add safe staging Vercel configuration | Add only to staging project without printing values | APP/site URLs, provider modes and a generated 48-byte AUTH secret added to the staging project's Production environment | PASS    | `vercel env ls production` names only                   |
| Provision managed PostgreSQL          | Separate SSL staging database                       | Neon install stopped at marketplace terms acceptance; no database/resource created                                      | BLOCKED | Vercel `integration_terms_acceptance_required` response |
| Deploy staging                        | Protected staging-project deployment                | Not attempted because DATABASE_URL/DIRECT_URL, Cloudinary and Resend prerequisites are absent                           | BLOCKED | `vercel ls khelaghor-staging` reports no deployments    |
| Staging URL                           | Active protected HTTPS hostname                     | Planned hostname `https://khelaghor-staging.vercel.app` is not active yet                                               | BLOCKED | No deployments found                                    |
| Apply 12 migrations                   | Current schema on non-local staging database        | Not attempted; no staging database                                                                                      | BLOCKED | No database URL/resource                                |
| Bootstrap admin/password rotation     | Staging-only account and rotated session            | Not attempted; no staging database/deployment or controlled email supplied                                              | BLOCKED | Prerequisite failure                                    |
| Health endpoint                       | Healthy app/database without secret leakage         | Not tested; no deployment                                                                                               | BLOCKED | Prerequisite failure                                    |
| Synthetic seed and smoke tests        | Synthetic staging workflows                         | Not tested; no staging database/deployment                                                                              | BLOCKED | Prerequisite failure                                    |

The remote `staging` branch currently points to committed HEAD `d01c11b`. Existing Phase 1–8 workspace changes remain uncommitted and were not silently committed or pushed. A later Git-triggered deployment must first use an explicitly reviewed commit; a CLI deployment was not used to bypass this state.

### Required human action

The project owner must review and accept Neon marketplace terms at the verification URL returned by Vercel, or choose/provide another managed PostgreSQL provider. This is a third-party legal agreement and cannot be accepted by the agent. After acceptance, retry `vercel integration add neon`, create/connect a staging-only resource, and verify generated variables target `khelaghor-staging` only.

### Phase 8 local automated gate

| Command                     | Actual result                                                                    | Status                        |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------- |
| `npm run db:check`          | Local development PostgreSQL connected                                           | PASS locally                  |
| `npm run db:generate`       | Prisma Client 6.19.3 generated                                                   | PASS                          |
| `npx prisma migrate status` | 12 migrations current on local `khelaghor`                                       | PASS locally; staging BLOCKED |
| `npm run lint`              | No errors                                                                        | PASS                          |
| `npm run typecheck`         | No errors                                                                        | PASS                          |
| `npm run test`              | 13 files / 47 tests                                                              | PASS                          |
| `npm run test:e2e`          | 4 Chromium workflows                                                             | PASS locally                  |
| `npm run build`             | Compiled in 4.7s; TypeScript 4.1s; 46 generated static pages plus dynamic routes | PASS locally                  |

These results validate the local workspace only. They are not evidence of staging database, URL, health or provider success.

## Run 2026-07-18 — environment discovery and local release gate

| Field                      | Evidence                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Date/time zone             | 2026-07-18, Asia/Dhaka                                                                         |
| Commit                     | `d01c11b55f7b1616ad3f8674644e2fccb580288b`                                                     |
| Branch                     | `main`                                                                                         |
| Tester                     | Codex local execution on the project owner's workstation                                       |
| Staging URL                | **BLOCKED** — no private staging/preview deployment exists                                     |
| Vercel access              | Authenticated as the project owner; only the existing `khelaghor` production project was found |
| Deployment action          | None. The existing production project was not linked, changed, or deployed                     |
| Database                   | Local development database `khelaghor`; not staging and contains development fixtures          |
| Staging database           | **BLOCKED** — no separate connection string supplied or discoverable                           |
| Storage                    | Local development storage; Cloudinary credentials are unset                                    |
| Payment                    | Mock; SSLCommerz sandbox credentials are unset                                                 |
| Courier                    | Mock; courier sandbox credentials are unset                                                    |
| Email                      | Development logger; Resend key/verified staging sender are unset                               |
| Monitoring                 | **NOT TESTED** — no staging Sentry project/DSN                                                 |
| Analytics                  | **NOT TESTED** — no separate staging property IDs                                              |
| Migration status           | **PASS locally** — all 12 migrations current; **BLOCKED on staging**                           |
| Admin bootstrap            | **NOT TESTED on staging** — no staging database                                                |
| Forced password change     | **PASS in local automated coverage; BLOCKED on staging**                                       |
| Health endpoint            | **PASS in local Playwright application boot; BLOCKED on staging URL**                          |
| Evidence links/screenshots | Local command output and repository documents only; no remote evidence URL exists              |

### Safe discovery performed

- Inspected environment variable presence without printing values.
- Confirmed the Vercel CLI is authenticated and enumerated project names/deployment environments.
- Confirmed there is no `.env.staging`, `.env.local`, or local Vercel project link.
- Did not create or reuse provider credentials, import production data, expose secrets, or deploy to a public domain.

### Required unblock package

The project owner must provide or create a private staging Vercel project, a synthetic-data PostgreSQL database, staging-only Cloudinary/SSLCommerz/courier/Resend/Sentry/analytics configurations, and a protected HTTPS staging hostname. Secrets must be entered in the provider/Vercel secret stores, not this file or chat.

Once those resources exist, follow `STAGING_SETUP.md`, run `npm ci`, `npm run db:migrate:deploy`, `npm run db:generate`, `npm run db:check`, `npm run admin:create`, and attach redacted command output and provider dashboard evidence to this log.

### Local automated gate results

| Command                     | Result                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `npm install`               | PASS — dependencies already current                                                     |
| `npm run db:check`          | PASS — local database connection healthy                                                |
| `npm run db:generate`       | PASS — Prisma Client 6.19.3 generated                                                   |
| `npx prisma migrate status` | PASS locally — 12 migrations, schema current                                            |
| `npm run lint`              | PASS                                                                                    |
| `npm run typecheck`         | PASS                                                                                    |
| `npm run test`              | PASS — 13 files, 47 tests                                                               |
| `npm run test:e2e`          | PASS — 4 Chromium workflows                                                             |
| `npm run build`             | PASS — compiled in 4.8s, TypeScript 4.3s, 46 generated static pages plus dynamic routes |

`npm audit` reports two moderate findings caused by Next.js's nested PostCSS version. The offered automatic remediation is a breaking/invalid downgrade to Next.js 9.3.3, so it was not applied. There are zero high or critical findings. This needs upstream-compatible dependency remediation before launch, not a forced downgrade.
