# External Provider Verification

No provider below is claimed verified in production.

| Provider           | Required configuration                                  | Callback/webhook                                                      | Verification criteria                                                                                              |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SSLCommerz         | store ID/password, sandbox flag, public app URL         | success, failure, cancel, IPN routes under `/api/payments/sslcommerz` | provider validation succeeds; BDT amount/order match; duplicate callbacks are idempotent; failures never mark paid |
| Courier            | provider base URL, credentials, webhook secret          | `/api/courier/webhook` over HTTPS                                     | create/status/cancel in sandbox; authenticated webhook; duplicate events safe; tracking/status mapping correct     |
| Resend             | API key and verified from address/domain                | provider delivery events if enabled                                   | registration/order/support email delivered; safe failure logging; no request transaction corruption                |
| SMS/WhatsApp       | approved sender/template and API secrets                | provider delivery/status webhook                                      | opt-in/template compliance, delivery/failure evidence, secrets redacted                                            |
| Sentry             | DSN, environment, release                               | source-map upload/event intake                                        | test exception and request ID visible; PII/secrets scrubbed; alert routing confirmed                               |
| Analytics          | consent-approved GA/GTM/Meta IDs                        | vendor endpoints                                                      | scripts only load when configured/consented; checkout/customer data is not exposed                                 |
| Managed PostgreSQL | runtime/direct URLs, TLS, backups/PITR                  | n/a                                                                   | migration deploy, connection limits, restore rehearsal, monitoring and failover evidence                           |
| Production storage | Cloudinary credentials or reviewed S3/R2 implementation | provider-specific                                                     | signature upload/delete, private delivery, backup, retention and dry-run cleanup verified                          |

Local tests use mocks/development logging. Staging verification requires sandbox credentials, HTTPS callbacks, synthetic data, failure injection and attached evidence.

## Phase 7 execution status — 2026-07-18

| Provider | Status | Execution evidence |
| --- | --- | --- |
| Cloudinary | BLOCKED | Credential variables are unset; no staging folder, upload, delete, orphan or backup operation was attempted |
| SSLCommerz | BLOCKED | Sandbox credentials and public staging callback URL are absent; no provider response was received |
| Courier | BLOCKED | Application remains in mock mode; no provider/test account or webhook endpoint was exercised |
| Resend | BLOCKED | Application remains in development-email mode; no verified staging sender/key or delivery event exists |
| Sentry | NOT TESTED | No staging DSN/project/release configuration exists |
| Analytics | NOT TESTED | No separate staging property IDs or consent execution target exists |
| Managed PostgreSQL | BLOCKED | Only the local development database is configured; no staging backup/restore target exists |

No secret value was printed or written to documentation. Local mocks and unit tests are not counted as real-provider evidence.

## Phase 8 provisioning update

The protected `khelaghor-staging` project exists, but provider statuses remain unchanged. Neon managed PostgreSQL is **BLOCKED** pending owner acceptance of marketplace terms. Cloudinary, Resend, SSLCommerz, courier, Sentry and analytics credentials/resources remain unavailable. No external workflow was simulated or promoted to PASS.

## First staging attempt update

| Provider/mode | Status | Actual result |
| --- | --- | --- |
| Neon | BLOCKED | Vercel still returns terms acceptance required; no installation/resource/connection exists |
| Disabled staging storage | PASS locally | Explicit mode rejects hosted uploads/deletes with HTTP 503 and performs no filesystem persistence |
| Database email logger | PASS locally | Explicit staging-only opt-in validated; no deployed database exists to test a real log row |
| Cloudinary | BLOCKED | No credentials or real response |
| Resend | BLOCKED | No credentials or real response |
| SSLCommerz | BLOCKED | Mock remains selected; no sandbox response |
| Courier | BLOCKED | Mock remains selected; no real provider response |
| Monitoring/analytics | NOT TESTED | No staging resources/properties |
