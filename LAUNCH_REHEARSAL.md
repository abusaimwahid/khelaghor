# KhelaGhor Launch Rehearsal

Use an isolated staging environment, sandbox credentials, and synthetic customer data.

1. Run `npm ci`, configure secrets, create a fresh database, then run `npm run db:migrate:deploy`, `npm run db:check`, and `npm run db:generate`.
2. Run `npm run admin:create`; sign in, complete the forced password change, and confirm old sessions fail.
3. Configure staging contact details, branding, SEO, email, payment sandbox, courier sandbox/mock, and Bangladesh delivery zones.
4. Create category, brand, draft product, safe images, variants, prices, SEO and stock; publish and verify storefront/search.
5. Create a limited coupon. Register a customer and test login, search, filters, variant, wishlist, cart merge, coupon, delivery quote, COD checkout, confirmation, order and invoice.
6. Repeat the checkout idempotency key and verify one order, stock change, coupon usage, payment record, and initial history.
7. Test SSLCommerz sandbox success/failure/cancel/IPN and duplicate callbacks using a reachable callback URL. Never substitute live credentials.
8. Create a mock courier shipment and progress it through delivery; verify tracking and notifications.
9. Submit/moderate a review; submit and inspect a return; create a bounded refund; verify inventory, timelines and audit logs.
10. Create support with a protected attachment; verify private notes and another customer's IDs/files are inaccessible.
11. Update CMS/settings; check Bangla foundations, keyboard access, screen reader names and the responsive route matrix.
12. Run and export `/admin/reports/reconciliation`; investigate every high-severity finding without silent fixes.
13. Back up and restore using `BACKUP_RESTORE.md`; verify health, monitoring, rollback and the full command suite.

The rehearsal is incomplete until payment/courier/email sandboxes, backup restore, legal review, accessibility review, performance measurement, and reconciliation have documented evidence.

## Evidence record — 2026-07-18

- Environment: local macOS, PostgreSQL 16, local development providers; tester: Codex; commit hash: unavailable because the shared worktree contains uncommitted user work.
- Pass: migrations and generation; seeded eight-role matrix; admin login; customer registration; browse/category/product; cart; Bangladesh quote/COD checkout; order confirmation; duplicate-safe checkout coverage; account access; local audit records; reconciliation route build; cleanup dry run; database backup and separate-database restore; migration status; restored key counts/order/admin record.
- Pass by automated domain tests: coupon idempotency, inventory movement behavior, review eligibility/moderation aggregates, return inspection routing, refund limits, support-note privacy, delivery matching, checkout correctness, validation and security headers.
- Partial/manual UI evidence: staff create/edit/detail pages and guardrail services compile and have lifecycle integration tests; full interactive role-by-role login/deactivate/reactivate rehearsal was not completed in the browser.
- Not tested and therefore not passed: SSLCommerz sandbox callbacks, real courier sandbox, Resend delivery, SMS, WhatsApp, Sentry, analytics consent, managed PostgreSQL, Cloudinary backup/cleanup, qualified legal review, full screen-reader/device matrix, and measured staging Web Vitals.
- Result: local rehearsal partially passed; production-readiness remains blocked by the untested external and manual items above.

## Phase 7 staging rehearsal status — 2026-07-18

| Rehearsal item | Status |
| --- | --- |
| Admin bootstrap and forced password change | BLOCKED |
| Seven restricted staff roles | BLOCKED |
| Branding and CMS with approved content | BLOCKED |
| Product creation and inventory | BLOCKED |
| Coupon and delivery quote | BLOCKED |
| COD order and duplicate checkout | BLOCKED |
| SSLCommerz success/failure/cancel/IPN | BLOCKED |
| Courier shipment and status update | BLOCKED |
| Invoice and packing slip | BLOCKED |
| Review, return, refund and support | BLOCKED |
| Notifications and provider email | BLOCKED |
| Reconciliation and audit log | BLOCKED |
| Staging backup and restore | BLOCKED |
| Staging health and monitoring | BLOCKED |

Reason: no private staging URL/database/provider configuration exists. Local automated results remain recorded above but do not change these staging statuses.
