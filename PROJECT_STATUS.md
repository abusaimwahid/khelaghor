# KhelaGhor Project Status

## Fully Functional With PostgreSQL

- Final UI polish pass completed on July 13, 2026: shared brand tokens, responsive header navigation, footer trust bar, consistent cart/checkout/account/admin cards, real empty states and improved mobile/table overflow behavior.
- Prisma schema generation, database push and seed data.
- Baseline Prisma migration exists at `prisma/migrations/20260713150000_initial_baseline/migration.sql`, with `db:migrate:dev` and `db:migrate:deploy` scripts.
- Production deployment field migration exists at `prisma/migrations/20260713162000_production_deployment_fields/migration.sql` for `DIRECT_URL`, first-login password change and courier tracking fields.
- Email/password registration with bcrypt hashing and database user creation.
- Login/logout sessions using secure HTTP-only cookies and the Prisma `Session` model.
- Production admin bootstrap command exists at `npm run admin:create`; bootstrap admins are forced through `/account/security` for password change.
- Server-side protected customer routes and admin permission checks.
- Storefront product, category, brand and search pages loading Prisma data.
- Product details loading real product data, images, variants and approved reviews.
- Guest and authenticated carts persisted in PostgreSQL with server-side stock/status validation. Guest cart cookies are created only from mutation contexts, not during page render.
- Guest cart merge after login.
- Checkout via `/api/checkout/place` with server-side validation, idempotency key, transaction-created orders, order items, address, payment row, coupon validation, stock reservation/reduction, cart clearing and order status history. Duplicate submissions with the same idempotency key return the existing order before cart-empty checks.
- Order confirmation loads the created order securely.
- Customer account dashboard, orders, addresses, wishlist, support tickets, profile edits and eligible return requests with ownership restrictions.
- Admin product create/update/archive, category CRUD, brand CRUD, inventory adjustment with `InventoryMovement`, order status updates with `OrderStatusHistory`, return status review/restock, support replies and homepage banner creation.
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
- Fine-grained admin UIs for every requested module, although core product/order/inventory/support/returns/banner workflows now work.
- CSV import/export, invoice/packing slip rendering and advanced reports.
- CMS-driven rendering for every homepage section/footer/legal copy; banner storage exists, but several public sections still use static presentation copy.
- Product review submission and admin moderation UI are partially modeled; approved reviews display, but full purchased-product review flow still needs UI wiring.
- Return/refund accounting beyond return request status and restock.
- Production distributed rate limiting, CSRF tokens for non-Server-Action forms, and full security review before launch.
- Real cart/wishlist notification badges in the header, connected to server-side state.
- Production launch should not use the seeded development admin credentials.
- S3/R2 storage providers are documented but not implemented; Cloudinary is the completed production storage adapter.
- Pathao/Steadfast/RedX/Paperfly live courier adapters still require provider-specific credential/API implementation beyond the shared interface.
- Sentry SDK is not installed; structured safe logs and `SENTRY_DSN` documentation are present.

## Verification Results

- `npm run db:generate`: passed.
- `npm run db:check`: passed.
- `npx prisma migrate resolve --applied 20260713150000_initial_baseline`: passed for local baseline reconciliation.
- `npm run db:migrate:deploy`: passed locally and applied `20260713162000_production_deployment_fields`.
- `npm run db:push`: previously passed against local PostgreSQL; do not use for production.
- `npm run db:seed`: passed. Admin: `admin@khelaghor.local` / `ChangeMe123!`.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 4 files / 14 tests.
- `npm run test:e2e`: passed, 4 Playwright tests.
- `npm run build`: passed, 36 generated/prerendered routes plus dynamic app routes.
- Last full verification was run on July 13, 2026 after the deployment/integration pass.

## Verified Workflows

- Customer browses a database-backed category and opens a product.
- Guest adds a product to cart, accepts checkout terms and completes COD checkout.
- Manual browser checkout created exactly one PostgreSQL `Order`, exactly one initial `OrderStatusHistory`, and duplicate submission with the same idempotency key returned the same order without reducing stock again.
- Customer registers and reaches the protected account dashboard.
- Admin logs in and reaches the protected admin dashboard.
- Product CRUD, inventory adjustment, order status update, support reply, return review and banner editing are implemented as Prisma-backed server actions/pages.
- SSLCommerz live payment, real courier booking, Resend delivery and Cloudinary upload are code-ready but not live-verified because credentials were not provided.

## Investigation Notes

- Repeated `/terms-and-conditions` requests were not reproduced in app code. Searches found no redirect, `router.push`, `router.refresh`, reload loop, interval or E2E navigation targeting that route. Current evidence points to external browser refresh/prefetch/noise rather than an application loop.
- `.env` had temporarily pointed to an unreachable Neon database host; local development was restored to `postgresql://postgres:postgres@localhost:5432/khelaghor?schema=public`.
- Seed data now resets demo product stock/reserved inventory so repeated checkout tests do not leave the storefront in a depleted state.
