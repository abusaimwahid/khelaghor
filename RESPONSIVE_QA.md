# Responsive QA Evidence

Date: 2026-07-21. Target: local isolated Playwright application unless otherwise stated.

## Implemented protections

- Shared admin tables remain inside horizontal overflow containers; page-level overflow is avoided.
- Admin actions reflow at tablet/mobile widths, pagination becomes a two-button grid, and sticky CMS/settings actions use bounded responsive containers.
- Admin mobile navigation uses `100dvh`, overscroll containment, and an internally scrollable panel.
- Review evidence, support attachments, and long message content use bounded widths, truncation, or break-safe text.
- Public information/state pages use the shared responsive container, fluid headings, wrapped actions, and minimum 44px controls.
- Global reduced-motion handling and Bangla font/line-height rules remain active.

## Automated evidence

- Seven Chromium workflows pass against a freshly started server using the isolated Playwright database.
- Covered routes include login, forced-password security, storefront/category/product, cart, checkout, registration/account, and admin dashboard.
- Production build renders the complete route manifest without compilation or static-generation errors.

## Width matrix

| Width | Code/layout review | Manual screenshot/overflow observation |
| --- | --- | --- |
| 320 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 360 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 375 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 390 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 412 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 430 | Responsive CSS rules present | BLOCKED — in-app browser unavailable |
| 768 | Tablet action/table rules present | BLOCKED — in-app browser unavailable |
| 1024 | Desktop sidebar breakpoint reviewed | BLOCKED — in-app browser unavailable |
| 1280 | Dense-table containment reviewed | BLOCKED — in-app browser unavailable |
| 1440 | Admin max-width/container reviewed | BLOCKED — in-app browser unavailable |

## Unresolved

Authenticated route-by-route screenshots, real touch-device behavior, modal/drawer focus and overflow, Bangla content clipping, sticky overlap, and 200% zoom remain manual staging blockers. No visual PASS is claimed without direct observation.
