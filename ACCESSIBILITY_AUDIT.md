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

## Continuation evidence — 2026-07-21

Automated/code evidence:

- Added a consistent three-pixel `:focus-visible` ring for admin links, buttons, inputs, selects, textareas, and navigation summaries.
- Added semantic pagination navigation, table empty rows with correct `colSpan`, labelled icon controls, reduced-motion preservation, and mobile action reflow.
- FAQ uses native `details`/`summary`; dense operational data remains inside horizontal table containers rather than causing page overflow.
- TypeScript, ESLint, 66 unit tests, and six non-blocked Playwright workflows passed.

Keyboard/manual evidence:

- **BLOCKED:** the in-app browser connection was unavailable. No keyboard-only, focus-return, Escape, VoiceOver/NVDA/TalkBack, 200% zoom, contrast-measurement, or complete 320–1440px device claim is made.
- **BLOCKED:** authenticated staging account/admin routes still require authorized credentials.
- Admin mobile navigation continues to use native `details`; focus containment and return require manual verification.

Unresolved items remain launch blockers; this update is not a WCAG conformance claim.

## Operational-page continuation — 2026-07-21

- Coupon, review, return, refund, support, and delivery-zone actions now use consistent focusable controls and semantic status text rather than colour alone.
- Support explicitly labels public messages, private messages, and internal notes; attachment links have visible filenames and bounded layouts.
- Review evidence has descriptive alternative text; state-page errors use `role="alert"`; pagination and table headings retain native semantics.
- Forced-password browser assertions now pass, including visible requirements and password-visibility control names.
- Manual keyboard order, focus return, Escape behavior, screen-reader announcements, contrast measurement, 200% zoom, and touch testing remain BLOCKED and are not inferred from automation.
