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

## Continuation review — 2026-07-21

- Admin dashboard queries execute concurrently and use aggregate/count queries plus bounded six-row recent-order retrieval. Stock thresholds require a minimal three-field product projection and are calculated without loading full product relations.
- Products, inventory, and orders remain server-rendered and paginated. Dense relations are scoped to the visible page; inventory movement history remains bounded to 20 rows.
- No additional client component boundary, chart library, polling loop, or image-priority hint was introduced.
- Production build passed. No Lighthouse, Web Vitals, bundle-size, network-payload, or staging database latency metric was collected, so none is invented here.
- Manual layout-shift and responsive image observation remain blocked by unavailable browser access; authenticated staging performance remains blocked by credentials and provider readiness.

### Operational-page continuation

- Review-list queries intentionally avoid loading evidence/replies until the bounded detail route; detail loads only one review.
- Return history is bounded to three entries on the list; support tickets and refund/order selectors remain explicitly capped.
- Homepage CMS selectors use narrow projections and bounded result counts rather than full product/category/review payloads.
- No new client-side data fetching, polling, chart rendering, or unbounded relation query was introduced.
- Real staging query timing, browser payload size, layout shift, and interaction metrics remain unmeasured and therefore BLOCKED.
