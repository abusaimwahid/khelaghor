# KhelaGhor Project Status

## Staging provisioning continuation retry (July 18, 2026)

- Reconfirmed branch `staging` at preflight commit `23cb745`, staging-only local Vercel link and secret-file hygiene.
- Vercel still lists no Marketplace installation and again returned `integration_terms_acceptance_required` for Neon under `abusaimwahids-projects`.
- Stopped before database creation, variables, migrations, seed, admin bootstrap, push or deployment, as required. No production-project command was issued.
- Safe staging-policy/evidence changes were locally validated and may be committed locally, but will not be pushed until Neon is visibly installed; pushing would trigger another known-failing deployment.
- Decision remains **NO-GO**.

## First real staging attempt (July 18, 2026)

- Verified a clean `staging` branch at `23cb745`, staging-only Vercel link, ignored/untracked environment files and unchanged production project targeting.
- Captured the first real staging deployment attempt: Vercel cloned the correct branch/commit and completed compilation and TypeScript, but static generation failed because `DATABASE_URL` is absent. Deployment `dpl_Ftq7…` is ERROR and is not presented as a working staging URL.
- Retried Neon installation twice. Vercel still returns `integration_terms_acceptance_required` and lists no Marketplace installation, so no database, migration, admin, health, seed or smoke workflow was attempted.
- Implemented an explicit secure staging-mock policy. `STORAGE_DRIVER=disabled` causes honest HTTP 503 upload/delete responses and never writes to ephemeral disk. `EMAIL_PROVIDER=logger` is permitted only for `APP_ENV=staging` with explicit `STAGING_ALLOW_EMAIL_LOGGER=true`, persists previews in the existing database log and avoids console email bodies. Production continues to reject local/disabled storage and logger/dev email.
- Updated only the staging project's encrypted storage/email mode variables. Cloudinary and Resend remain unverified and BLOCKED; no external provider was relabelled as passed.
- Go-live remains **NO-GO**. Exact next action: complete Neon Marketplace acceptance in the same Vercel team scope, then install/connect the database and run migrations before redeploying.
- Post-change local verification passed: local database check, Prisma generation, 12 migrations current, ESLint, TypeScript, 13 Vitest files / 48 tests, 4/4 Playwright workflows and production build (5.1-second compile, 46 generated static pages plus dynamic routes).
- Final read-only Vercel inspection found that the existing `khelaghor` project automatically created an ERROR Preview deployment from the shared repository's `staging` branch. Its 2-day-old Production deployment remains unchanged and Ready, and no command here targeted its settings, variables, domain or deployments. Preventing future production-project preview builds needs a separately authorized Git deployment-setting change on that project.

## Phase 8 private staging provisioning (July 18, 2026)

- Confirmed the Vercel identity, existing projects, dirty working tree and committed HEAD before mutation. The existing production project `khelaghor` retains its prior deployment and was not linked, configured or redeployed.
- Created and pushed a separate `staging` Git branch at committed HEAD `d01c11b`. Existing workspace changes remain uncommitted and were not silently included in the branch push.
- Created the separate Vercel project `khelaghor-staging` (`prj_aZH8ovXYMfdIU964YiEszFpLIL12`), connected it to the existing GitHub repository, linked the local directory only to that project, set the Next.js preset and confirmed its project ID differs from production.
- Confirmed staging deployment protection: SSO applies to all non-custom-domain deployments and Git fork protection is enabled. No custom domain or deployment exists.
- Created ignored `.env.staging.local` placeholders using the application's actual environment names. Added safe staging URL/mode variables and a newly generated strong AUTH secret only to the staging project's Production environment; values were not printed or documented.
- Managed PostgreSQL provisioning stopped safely because the Neon marketplace requires the project owner to accept third-party terms. No database was created and no billing/legal agreement was accepted on the owner's behalf.
- Deployment, migrations, admin bootstrap, health, synthetic seeding, smoke testing and role/provider rehearsal remain BLOCKED because DATABASE_URL/DIRECT_URL, Cloudinary and Resend prerequisites are absent. Environment validation was not weakened to force an invalid deployment.
- Go-live remains **NO-GO**. Exact next action: the owner accepts Neon marketplace terms (or supplies another staging database), after which the staging-only database resource can be connected and migrations can run.
- Phase 8 local verification passed: database connectivity, Prisma generation, 12 local migrations current, ESLint, TypeScript, 13 Vitest files / 47 tests, 4/4 Playwright workflows and production build (4.7-second compile, 46 generated static pages plus dynamic routes). These are explicitly not recorded as remote staging passes.

## Phase 7 evidence execution (July 18, 2026)

- Performed a secrets-safe environment and Vercel discovery. The CLI is authenticated, but only the existing production `khelaghor` project exists; there is no separate private staging project, staging database, `.env.staging`, or local staging link. The production project was not linked, changed, or deployed.
- Confirmed Cloudinary, SSLCommerz, courier, Resend, Sentry and staging analytics access is unavailable in the workspace. No provider request, remote deletion, sandbox transaction or delivery/monitoring claim was fabricated.
- Added `STAGING_EXECUTION_LOG.md` with the exact commit, tester, environment/provider modes, safe discovery evidence, blocked migration/bootstrap/health state and the concrete provisioning package needed to proceed.
- Converted role rehearsal, Super Admin concurrency, provider, storage cleanup, backup, launch rehearsal, device, accessibility, performance, content/product-quality and legal evidence into explicit PASSED/FAILED/BLOCKED/NOT TESTED matrices.
- The existing local Super Admin concurrent-deactivation test remains passed. Staging simultaneous role removal and stale-form submission evidence remains blocked and is not inferred from local coverage.
- Corrected duplicate courier keys in `.env.example`; no runtime secret or provider mode was changed.
- Go-live remains **NO-GO**. The exact next action is to provision a protected staging project plus synthetic PostgreSQL database and add staging-only provider secrets through platform secret stores, then execute the migration/admin/health gate before provider workflows.
- Local Phase 7 verification passed: dependency install, database check, Prisma generation, all 12 migrations current, ESLint, TypeScript, 13 Vitest files / 47 tests, 4/4 Playwright workflows and the production build (4.8-second compile, 46 generated static pages plus dynamic routes). `npm audit` reports two moderate Next.js-nested PostCSS findings and no high/critical findings; its proposed breaking downgrade was not applied.

## Phase 6 staging readiness and launch rehearsal (July 18, 2026)

- Added hosted-environment validation for public HTTPS URLs, remote file storage, non-development email, and required SSLCommerz, courier, Resend and Cloudinary credentials. Secret values are never included in validation errors.
- Strengthened staff role/status writes with serializable transactions and added a concurrent final-Super-Admin deactivation test. The automated guardrail passed; complete browser rehearsal for every staff role still requires a deployed staging environment.
- Expanded reconciliation with payment amount/currency, gateway/order-state, callback/IPN, validation and stale-pending checks. Added documented courier status mapping, including safe no-op handling for unknown and returned-to-origin events.
- Added admin content-quality reporting and CSV export for missing Bangla copy, taxonomy, images/alt text, safety/age/material/delivery data, SEO, pricing and stock issues.
- Added a legal-policy review register and migration for reviewer, version, effective date, review date, status and notes. This records workflow evidence only; qualified Bangladesh legal approval is still absent.
- Added a dry-run-default Cloudinary orphan scanner/deleter restricted to the staging prefix, with reference checks, age limits, batching, explicit execution and paced deletion. It was not run because staging credentials were unavailable, so upload/delete/cleanup/backup remain unverified.
- Added purchase-event deduplication by order ID plus staging-readiness tests for environment rules, courier mappings, content warnings and analytics deduplication.
- Added staging, role, legal, device, courier and go-live runbooks. `GO_LIVE_DECISION.md` remains **NO-GO** because provider sandboxes, production content/media, legal approval, monitoring, consent analytics, full device/accessibility testing, staging performance measurements and complete role rehearsal need external staging evidence.
- Local verification passed: cleanup dry run with zero deletions, database connectivity, Prisma generation, all 12 migrations current, ESLint, TypeScript, 13 Vitest files / 47 tests, 4/4 Playwright workflows and a production build (5.3-second compile, 46 generated static pages plus dynamic routes).

## Phase 5 staff, uploads and rehearsal (July 18, 2026)

- Implemented `/admin/staff`, create, detail and edit screens with search/role/status filters, pagination, inherited roles, direct allow/deny overrides, activation, forced password change, internal notes, audit activity and individual/all-session revocation.
- Staff creation requires strong temporary passwords, safe duplicate-email errors, `staff.manage` server permission and password-free audit metadata. Role/security edits revoke sessions.
- Transactional guardrails block self-deactivation/demotion and final-active-Super-Admin deactivation/demotion, audit blocked attempts, and preserve state when rejected. Complete interactive concurrent-transaction stress testing remains future hardening.
- Added staff login failure counters and configurable temporary lockout (`STAFF_LOGIN_MAX_ATTEMPTS`, `STAFF_LOGIN_LOCK_MINUTES`); successful login clears lock state.
- Uploads now validate byte signatures for JPEG/PNG/WebP/GIF/PDF/ICO, reject MIME mismatches, empty/executable/HTML/SVG content, enforce dimensions/pixel caps where parsers are available, retain size/purpose restrictions and keep SVG uploads disallowed.
- Added dry-run-default protected-file cleanup, explicit execute flag, minimum retention window and `FILE_RETENTION.md`. Cloudinary enumeration/deletion remains provider-verification work.
- Added legal-review labels to policy pages plus content, accessibility, performance and provider evidence documents. These are audits, not legal/WCAG/performance certifications.
- Local backup/restore passed into separate `khelaghor_restore_phase5`: source/restored counts matched (Users 99, Orders 128, Products 245, AuditLogs 121), all 11 migrations were current, and an order/admin record was readable.
- The launch rehearsal is partial. Local commerce automation, cleanup dry run and backup restore passed; external providers, complete role-by-role manual UI rehearsal, legal review, assistive-technology/device testing and measured staging Web Vitals remain deployment blockers.
- Phase 5 verification passed after restarting a stale pre-migration Next.js test process: database check, Prisma generation, all 11 migrations current, ESLint, TypeScript, 12 Vitest files / 41 tests, 4/4 Playwright workflows, cleanup dry run with zero deletions, and the production build with 44 generated routes. The development CSP still logs React's expected `unsafe-eval` debugging warning; production does not use that development path.

## Phase 4 launch-readiness audit (July 17, 2026)

- Added a seeded permission catalog and role matrix for Super Admin, Store Manager, Product Manager, Order Manager, Warehouse Staff, Customer Support, Content Manager and Accountant. Existing admin mutations remain server-protected; exhaustive per-action role tests and complete staff-management screens remain blockers.
- Hardened authentication with generic duplicate-registration feedback, inactive-account rejection, audited failed staff login attempts, 12-character mixed-complexity passwords, session revocation/rotation after password change and a permission-denied page.
- Ownership review confirmed customer order/invoice, review, return, support, notification, address and wishlist access is user-scoped. Protected files use indistinguishable not-found responses for missing and forbidden resources.
- Upload review confirmed authorization, MIME allow-list, size caps, generated keys, traversal rejection, private storage, `nosniff`, no-store delivery and production local-storage blocking. Byte-signature/dimension validation and automated orphan cleanup remain.
- Added read-only `/admin/reports/reconciliation` checks and CSV export for totals, payments, initial history, refunds, duplicate references, inventory risks and return routing. It never auto-fixes data.
- Added migration `20260717235500_launch_readiness_indexes` for active users, phone lookup, reverse product-category lookup, customer/payment order queries, payment references and audit-resource/action queries.
- Placeholder audit found Unsplash media and local credentials only in the explicitly seeded development catalog, seed/E2E tests and documentation. Replace media and rotate credentials before launch. No Lorem Ipsum, generic example email, TODO/FIXME or coming-soon production copy was found.
- Added `BACKUP_RESTORE.md` and `LAUNCH_REHEARSAL.md`; expanded deployment/live-test gates. Legal pages still require Bangladesh legal review and real business values.
- SSLCommerz, courier, production email, monitoring and provider backup verification require external credentials. Full responsive/accessibility/performance measurement and manual rehearsal remain blockers.

## Phase 3 — Premium Admin Operations UI (July 17, 2026)

- Redesigned the shared admin shell into a restrained commerce-operations workspace with a fixed grouped desktop sidebar, sticky command header, mobile navigation drawer, active-route treatment, global product search, storefront shortcut and quick-create action.
- Added reusable admin primitives for page headers, stat cards and section cards, plus centralized compact table, form, button, focus, surface and responsive-overflow styling.
- Applied the system across the database-backed dashboard and all existing product, category, brand, inventory, order, delivery-zone, coupon, review, return, refund, support, homepage CMS, settings and development-email screens through their shared shell and common CSS surface.
- Improved accessibility with labelled navigation, `aria-current` active links, labelled icon controls, high-contrast focus treatments, touch-sized mobile controls and preserved reduced-motion behavior.
- Improved responsive behavior for dense tables, filter toolbars, wrapping page actions and mobile navigation without changing RBAC, Prisma, server actions or workflow rules.
- Verification results for this pass are recorded below after the full command suite. Remaining visual limitation: advanced modal/drawer interactions continue to use the existing page/details patterns where no backend workflow currently requires a client-side dialog, and chart visualizations remain deferred rather than showing fabricated or incomplete analytics.
- Phase 3 verification passed: database connectivity check, Prisma client generation, TypeScript, ESLint, 10 Vitest files / 35 tests, 4 Playwright end-to-end workflows, and the production Next.js build with 41 generated static pages plus dynamic routes.

## July 17, 2026 — Bilingual/Branding/Upload Foundation

- Added server-rendered English/Bangla locale detection using the Next.js proxy. English remains at `/`; Bangla is available under `/bn` and nested `/bn/*` URLs without duplicating route implementations.
- Added structured `src/messages/en.json` and `src/messages/bn.json`, locale helpers, Bangla number/date/BDT formatting, a header language switcher, persisted locale cookie, server-set `<html lang>`, Noto Sans Bengali through Next font optimisation, and locale-aware root metadata/hreflang.
- Sitemap now emits English and Bangla entries with `en`, `bn`, and `x-default` alternates. Core header cart/wishlist/notification links retain locale.
- Added optional manual Bangla fields for products, categories, brands, delivery zones, blog posts, banners and page content. Admin product/category/brand forms clearly expose Bangla inputs; English remains required and helper-level fallback is covered by tests.
- Added Bangla store name/tagline/description settings and representative Bangla category/product seed content.
- Added an original editable SVG KhelaGhor horizontal logo, light version, icon mark and monochrome mark under `public/brand`. Existing component mark remains compatible with uploaded branding.
- Expanded branding settings for main/compact/dark/light/footer logos, favicon, Open Graph, product/category placeholders, email logo and invoice logo; branding image fields use the existing direct upload control and built-in SVGs remain available as fallbacks.
- Replaced URL-only customer review, return-evidence and support-attachment inputs with a reusable multiple-file drag/drop uploader with picker, progress, preview, remove, mobile-safe layout, file-count limits, size/MIME errors, image validation and PDF support only for returns/support.
- Hardened SSLCommerz callbacks to compare provider-validated amount and BDT currency, reject reused provider references across orders, record session/validation/callback/IPN/failure fields, and retain transaction-level duplicate handling. No real sandbox claim was made because credentials/public callback verification were not available.
- Created and applied migration `20260717150000_bilingual_branding_payment_courier` using `prisma migrate dev`; no `db push` was used.
- Verification: database check/generate/seed passed; lint and typecheck passed; Vitest passed (10 files / 35 tests); Playwright passed (4/4); production build passed (41 static/generated pages plus dynamic routes).

### Honest remaining scope for this phase

- Translation dictionaries currently establish the architecture and core shared labels, but most page bodies still contain English literals. Product/category data selection must be wired through `localize()` across every storefront query/render surface, and all internal links/forms should use locale helpers.
- The proxy rewrite means `/bn/*` works server-side, but authenticated redirects and every page-level canonical are not yet exhaustively locale-aware.
- Uploaded development files use the existing public `/uploads` adapter. Return/support evidence therefore needs a protected download route and persisted storage keys before it can be considered production-private; internal-note attachment modelling is also pending.
- Branding uploads are configurable, but all email/invoice/category/product renderers do not yet consume every new fallback field.
- SSLCommerz sandbox remains unverified without credentials. A local callback harness/tunnel guide, admin recheck action, and dedicated callback regression suite remain pending.
- Courier remains mock/structural. Atomic duplicate booking prevention, shipment history, full admin workflow, guest-safe tracking verification, provider webhook authentication and one documented real sandbox adapter remain pending.
- The requested 320–768 px route matrix, Bangla accessibility audit and performance profiling have not been completed. Existing E2E tests cover the baseline desktop flows only.

**Exact next localhost priority:** finish locale-aware catalog rendering and links on homepage/shop/product/cart/checkout, then add protected attachment delivery before expanding payment/courier admin workflows.

## Fully Functional With PostgreSQL

- Final UI polish pass completed on July 13, 2026: shared brand tokens, responsive header navigation, footer trust bar, consistent cart/checkout/account/admin cards, real empty states and improved mobile/table overflow behavior.
- Prisma schema generation, database push and seed data.
- Baseline Prisma migration exists at `prisma/migrations/20260713150000_initial_baseline/migration.sql`, with `db:migrate:dev` and `db:migrate:deploy` scripts.
- Production deployment field migration exists at `prisma/migrations/20260713162000_production_deployment_fields/migration.sql` for `DIRECT_URL`, first-login password change and courier tracking fields.
- Bangladesh delivery-zone migration exists at `prisma/migrations/20260716193000_bangladesh_delivery_zones/migration.sql`.
- Customer trust workflow migration exists at `prisma/migrations/20260716203000_customer_trust_workflows/migration.sql` for coupons, review moderation, returns, refunds, support attachments/internal notes, notifications and development email logs.
- Email/password registration with bcrypt hashing and database user creation.
- Login/logout sessions using secure HTTP-only cookies and the Prisma `Session` model.
- Production admin bootstrap command exists at `npm run admin:create`; bootstrap admins are forced through `/account/security` for password change.
- Server-side protected customer routes and admin permission checks.
- Storefront product, category, brand and search pages loading Prisma data.
- Marketplace storefront redesign pass completed on July 16, 2026: homepage now uses a dense marketplace structure with database-backed hero slides, category shortcuts, service strip, flash sale, promotional banners, trending products, age discovery, best sellers, new arrivals, featured brands, deal highlight, interest collections, recommendations, approved-review area, blog guides and newsletter signup.
- Header now has a marketplace search bar, database category selector/mega menu, rotating database/settings announcement messages, and real server-rendered cart/wishlist counts for guest/authenticated shoppers.
- Shop and category pages have marketplace-style breadcrumbs, shortcut rows, URL-backed filters, result counts, richer category landing content and responsive product grids.
- Product cards were redesigned into a shared marketplace card with complete image rendering, badges, discount, stock state, variant indicator and quick add.
- Product details loading real product data, images, variants and approved reviews.
- Guest and authenticated carts persisted in PostgreSQL with server-side stock/status validation. Guest cart cookies are created only from mutation contexts, not during page render.
- Guest cart merge after login.
- Checkout via `/api/checkout/place` with server-side validation, idempotency key, transaction-created orders, order items, address, payment row, coupon validation, stock reservation/reduction, inventory movement logging, cart clearing and order status history. Duplicate submissions with the same idempotency key return the existing order before cart-empty checks.
- Bangladesh checkout delivery now uses address IDs, server-side delivery quotes, deterministic zone/rule matching, COD/express/pickup eligibility and final fee recalculation. Orders store delivery zone/rule snapshots, estimates and COD eligibility.
- Authoritative coupon engine now recalculates cart products from PostgreSQL, supports percent/fixed/free-delivery/product/category/brand/first-order/customer/payment-method eligibility, validates usage limits, records usage transactionally with order creation and prevents duplicate usage for idempotent checkout retries. Coupon discounts apply after delivery quote calculation; free-delivery coupons discount the delivery quote.
- Order confirmation loads the created order securely.
- Customer account dashboard, orders, addresses, wishlist, support tickets, profile edits and eligible return requests with ownership restrictions.
- Customer review workflow supports delivered-order eligibility, one active review per customer/product, verified-purchase reviews, edit/delete, moderation status and approved-only public aggregates.
- Customer return workflow uses central eligibility checks, persistent public timelines and inspection-based inventory routing for resellable versus damaged items.
- Customer support workflow supports priority, image/PDF attachment references, customer replies and ownership-protected ticket detail pages.
- Customer notification centre supports unread count, mark-one-read and mark-all-read; the header shows real unread notifications for authenticated users only.
- Admin product create/update/archive, professional category/brand CRUD, inventory dashboard and stock adjustment with typed `InventoryMovement`, order list/detail/status workflow, order notes, invoice and packing slip routes, return status review/restock, support replies and homepage banner creation.
- Admin delivery-zone management supports create/edit/archive/delete/duplicate/reorder, rule priority management, one active fallback guard rail and audit logging.
- Admin coupon management supports list/search/filter/pagination/CSV, create/edit/detail, duplicate, enable/disable, archive, safe delete and audit logs.
- Admin review moderation supports approve/reject/hide/restore/feature/suspicious flags and public replies with audit logs.
- Admin returns support status transitions, public/private notes and explicit resellable/damaged inspection; damaged returns increment damaged inventory only.
- Admin refund workflow supports manual partial refunds, over-refund prevention, idempotency keys, approval/completion audit logs and safe customer notifications. SSLCommerz refund adapter remains structural/future.
- Admin support workflow supports assignment, priority/status changes, public replies, private internal notes and audit logs. Development email logs render at `/admin/development/emails` outside production.
- Newsletter subscriber API persists to PostgreSQL with rate limiting.
- `/api/health` checks database connectivity and returns 503 when disconnected.
- Product cards/details now include `sizes` for `fill` images and eager/high-priority loading for above-the-fold grid/detail images.
- Header no longer shows fake static wishlist/cart counts. Counts should be reintroduced only when backed by authenticated/guest cart data.
- Upload API validates auth, MIME type and size, supports local development storage and a Cloudinary production adapter.
- In-app notification records for order, return and support events where a user exists. Email notifications use a development logger or Resend when configured.
- Audit logs for registration/login and important admin product/order actions.
- SSLCommerz architecture exists for sandbox/live session creation, success/failure/cancel/IPN callbacks, server-side validation, duplicate-safe payment updates and safe callback logging. Live success remains unverified without credentials.
- Courier provider interface exists with mock default, shipment creation/status/cancel contracts, webhook-ready status mapping and tracking fields on orders.
- Security headers, practical CSP and request correlation IDs are configured.
- Analytics placeholders exist for Google Analytics, Google Tag Manager and Meta Pixel and load only when public IDs are configured.
- Dynamic canonical URL, sitemap, robots, Open Graph URL, organisation schema and product JSON-LD use `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`.

## Development-Only

- Custom lightweight session auth is used instead of full Auth.js provider wiring.
- Rate limiting is in-memory, suitable for local/single-process development only.
- SMS/WhatsApp providers are adapter interfaces with mock logging until a provider is selected.
- Local upload storage is development-only and blocked in production.
- PostgreSQL was started locally from `/opt/homebrew/var/postgresql@16`; `.env` expects `postgres:postgres`.
- Existing local databases created with `db:push` may need reset/recreate or careful Prisma baseline reconciliation before using `db:migrate:deploy`. New production/staging databases can use the committed baseline migration directly.
- Local database was reconciled by marking the initial baseline as applied and running `npm run db:migrate:deploy` for the production deployment fields migration.

## Requires Third-Party Credentials

- bKash, Nagad, Rocket and card payment gateway callbacks/verification.
- SSLCommerz sandbox/live store credentials for verified online payment testing.
- Courier provider credentials for Pathao, Steadfast, RedX, Paperfly or another provider.
- Observability/marketing credentials such as Sentry, Google Analytics, Google Tag Manager and Meta Pixel if those services are required.
- Resend email credentials or another email provider adapter implementation.
- SMS provider and WhatsApp Business provider credentials.
- Cloudinary production object storage credentials.
- Google/Facebook OAuth credentials.

## Not Yet Implemented / Needs Further Hardening

- Full Auth.js OAuth integration and email verification/OTP reset flows.
- Fine-grained admin UIs for advanced reports, review analytics and full customer-service dashboards still need a future pass; core product/category/brand/order/inventory/delivery-zone/coupon/review/support/return/refund/banner workflows now work.
- CSV import/export is present for products, inventory and orders. CSV import, advanced reports and richer accounting exports still need future work.
- CMS-driven rendering now covers the major homepage sections through a structured JSON setting with Zod validation: announcements, scheduled hero slides, promo cards, navigation/category selections, service benefits, flash sale settings, trending/best/new/recommended product controls, age groups, brand picks, deal of the day, interest collections, reviews, blog and newsletter copy. Footer/legal copy still needs a future CMS pass.
- Homepage CMS intentionally remains structured rather than a generic page builder. Saved-state preview is available by opening the storefront; draft-token preview and drag-and-drop reorder are not implemented yet.
- Homepage media controls support local upload/preview/remove through the existing upload API. A full reusable media library picker with existing-file search, dimensions and aspect-ratio validation remains future work.
- Admin selectors use capped lists and multi-select controls for local management. Rich searchable/paginated selector modals should be added before very large catalogs.
- Review image upload currently accepts image URLs; a polished direct uploader in the review form remains future work.
- Return evidence upload currently accepts evidence URLs; direct multi-file upload UX remains future work.
- Refund gateway execution is manual/local only. SSLCommerz refund-ready structure exists, but live provider refund calls require credentials and provider-specific implementation.
- Coupon checkout preview is helpful but final checkout remains the authority; richer live revalidation tied to every cart/address/payment change can be made more polished.
- Customer saved-address forms and admin order-address editing still use older address surfaces; production checkout now uses cascading Bangladesh address IDs and server-side delivery quotes.
- Production distributed rate limiting, CSRF tokens for non-Server-Action forms, and full security review before launch.
- Real cart/wishlist notification badges in the header, connected to server-side state.
- Production launch should not use the seeded development admin credentials.
- S3/R2 storage providers are documented but not implemented; Cloudinary is the completed production storage adapter.
- Pathao/Steadfast/RedX/Paperfly live courier adapters still require provider-specific credential/API implementation beyond the shared interface.
- Sentry SDK is not installed; structured safe logs and `SENTRY_DSN` documentation are present.

## Verification Results

- `npm run db:generate`: passed.
- `npm run db:check`: passed.
- `npm run db:migrate:dev -- --name core_commerce_operations`: passed and applied `20260716185000_core_commerce_operations`.
- `npm run db:migrate:dev -- --name bangladesh_delivery_zones`: passed and applied `20260716193000_bangladesh_delivery_zones`.
- `npm run db:migrate:dev -- --name customer_trust_workflows`: passed and applied `20260716203000_customer_trust_workflows`.
- `npx prisma migrate resolve --applied 20260713150000_initial_baseline`: passed for local baseline reconciliation.
- `npm run db:migrate:deploy`: passed locally and applied `20260713162000_production_deployment_fields`.
- `npm run db:push`: previously passed against local PostgreSQL; do not use for production.
- `npm run db:seed`: passed. Admin: `admin@khelaghor.local` / `ChangeMe123!`.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 9 files / 32 tests.
- `npm run test:e2e`: passed, 4 Playwright tests.
- `npm run build`: passed, 41 generated/prerendered routes plus dynamic app routes.
- Authenticated local smoke check for `/admin/homepage`: passed; 17 grouped CMS panels rendered with save and hero controls visible.
- Authenticated local commerce-ops smoke: created category, created brand, adjusted inventory and saw movement history, opened order detail, opened admin invoice and packing slip, cancelled a pending order and verified one `RESERVATION_RELEASE` inventory movement was created.
- Authenticated local delivery-zone smoke: created a throwaway delivery zone through `/admin/delivery-zones/new`, verified one persisted rule and one `delivery-zone.create` audit log, then removed the smoke zone.
- Direct delivery quote smoke: Dhaka standard fee 60, outside Dhaka fee 130, Dhaka express fee 120, store pickup fee 0, and remote Bandarban COD blocked with `COD_UNAVAILABLE`.
- Customer trust smoke: verified admin coupon/review/return/refund/support/dev-email pages render, `FREEDELIVERY` coupon usage was recorded once from checkout, admin review approval changed DB status to `APPROVED`, resellable return inspection increased sellable inventory by one, and customer support detail did not show a private internal note.
- Last full verification was run on July 16, 2026 after the customer trust workflows pass.

## Verified Workflows

- Customer browses a database-backed category and opens a product.
- Guest adds a product to cart, accepts checkout terms and completes COD checkout.
- Checkout recalculates delivery server-side from Bangladesh address IDs; Playwright covers Dhaka fee, outside-Dhaka fee and successful COD order placement.
- Playwright checkout covers expired coupon rejection and valid free-delivery coupon application before order placement.
- Coupon engine tests cover expired coupons, free delivery discount and duplicate checkout usage prevention.
- Review tests cover delivered-order eligibility, duplicate review prevention and approved-only aggregate ratings.
- Return tests cover no stock change at request, product-received transition and damaged-stock routing.
- Refund tests cover over-refund prevention; support tests cover private internal note separation.
- Delivery engine matches exact area over district/division/fallback rules, supports pickup-only matching, blocks unavailable express/COD combinations and applies zone free-delivery thresholds before coupon discount.
- Manual browser checkout created exactly one PostgreSQL `Order`, exactly one initial `OrderStatusHistory`, and duplicate submission with the same idempotency key returned the same order without reducing stock again.
- Checkout stock reservation now writes `SALE` inventory movements; cancellation from pending writes `RESERVATION_RELEASE` movement and restores sellable stock.
- Admin category and brand create/edit/archive/delete guard rails are implemented; delete is blocked for categories with children/products and brands assigned to products.
- Admin inventory dashboard shows summary cards, product/variant rows, filters, movement history and CSV export.
- Admin orders list supports filters, CSV export, detail page, internal notes, status transitions, invoice and packing slip routes.
- Customer order list links to ownership-protected printable invoices.
- Customer registers and reaches the protected account dashboard.
- Admin logs in and reaches the protected admin dashboard.
- Product CRUD, inventory adjustment, order status update, support reply, return review and banner editing are implemented as Prisma-backed server actions/pages.
- SSLCommerz live payment, real courier booking, Resend delivery and Cloudinary upload are code-ready but not live-verified because credentials were not provided.

## Investigation Notes

- Repeated `/terms-and-conditions` requests were not reproduced in app code. Searches found no redirect, `router.push`, `router.refresh`, reload loop, interval or E2E navigation targeting that route. Current evidence points to external browser refresh/prefetch/noise rather than an application loop.
- `.env` had temporarily pointed to an unreachable Neon database host; local development was restored to `postgresql://postgres:postgres@localhost:5432/khelaghor?schema=public`.
- Seed data now resets demo product stock/reserved inventory so repeated checkout tests do not leave the storefront in a depleted state.
