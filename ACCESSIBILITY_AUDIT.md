# Accessibility Audit Evidence

Date: 2026-07-18. Scope: structured code and automated-flow review of core storefront/admin routes; no claim of a complete assistive-technology certification.

## Fixed/verified

- Global `:focus-visible` treatment and reduced-motion override exist.
- Forms use visible labels or ARIA labels; icon-only header/admin controls have accessible names.
- Product images use descriptive alt text; decorative images use empty alt.
- Dense admin data uses table headings and horizontal containers rather than page overflow.
- Permission and empty states use headings, text and icons rather than colour alone.
- Mobile controls use approximately 40–48px targets; Bangla font and line-height are explicitly configured.
- Staff pages provide semantic headings, labelled fields and status text.

## Serious remaining review

- Admin mobile navigation uses native `details`, not a trapped modal drawer; verify focus order/return with VoiceOver, NVDA and TalkBack.
- Server-action validation redirects do not consistently connect field errors with `aria-describedby` or announce an error summary.
- Carousel announcements, mega-menu keyboard traversal, checkout cascading selects and upload progress require manual screen-reader testing.
- Colour contrast must be measured for every CMS-configurable background/text combination.
- Bangla clipping and reflow need the full 320–1440px device matrix.

## Critical issues found

No critical issue was proven by the code audit or four automated browser workflows. This is not equivalent to a WCAG conformance claim.

## Phase 7 execution matrix

| Method | Route scope | Status | Evidence |
| --- | --- | --- | --- |
| Automated browser assertions | Existing browse/product/cart/checkout/login/admin flows | PASSED locally | Four Playwright workflows |
| Keyboard only | Search, product, cart, checkout, login, orders, returns, support, admin navigation/product/staff forms | BLOCKED | No staging target/manual tester record |
| VoiceOver | Same required route set | BLOCKED | No staging target/manual session |
| 200% zoom | Same required route set | BLOCKED | No staging target/manual session |
| Reduced motion | Global CSS/code path | PASSED by code inspection; BLOCKED manually | Media query exists; no staging observation |
| High contrast | Same required route set | NOT TESTED | No measured/manual evidence |

Automated and code-inspection results are intentionally separate from assistive-technology results.
