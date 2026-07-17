# Performance Audit Evidence

Date: 2026-07-18. Measurements are limited to local build/test evidence; no Lighthouse score is invented.

- Next.js production compilation, route generation and TypeScript timings are recorded in the Phase 5 command output/`PROJECT_STATUS.md`.
- Commerce/account/admin pages are dynamic where prices, stock, sessions or operations require freshness. Static routes remain limited to robots/sitemap and framework-safe content.
- Homepage performs parallel database queries; product/category/brand lists use bounded `take`; shop/admin tables paginate; order detail relations are loaded in explicit bounded queries.
- Images use Next Image with `sizes`, lazy loading for non-LCP images and priority only above the fold. Unsplash seed payloads remain a launch concern until replaced with owned optimised media.
- Main client boundaries include hero/newsletter/nav/admin-shell/forms. Staff lists and reconciliation remain server-rendered.
- No charting was added to critical routes; the existing `recharts` dependency should be bundle-checked if analytics charts are enabled later.

Remaining measurements: Lighthouse/Web Vitals on representative mobile hardware for homepage/shop/product/cart/checkout; browser CLS observation; production-like PostgreSQL slow-query logging and query counts for homepage/admin dashboard/products/orders; image byte budgets; JS chunk analysis. These require a running staging-like target and are launch blockers, not passed items.

## Phase 7 staging measurements

| Route | LCP | CLS | INP | TTFB | JS/image payload | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Homepage | — | — | — | — | — | BLOCKED |
| Shop | — | — | — | — | — | BLOCKED |
| Product | — | — | — | — | — | BLOCKED |
| Cart | — | — | — | — | — | BLOCKED |
| Checkout | — | — | — | — | — | BLOCKED |
| Admin dashboard | — | — | — | — | — | BLOCKED |

No private staging URL exists, so Lighthouse, field Web Vitals, browser performance traces, slow-request data and production-like Prisma query timings were not collected. No performance change was made without measurements.
