# Device and Browser QA Evidence

Run date: 2026-07-18. Target routes: homepage, shop, product, cart, checkout, login, account, order, review, return, support, tracking, admin dashboard, products, orders, staff, CMS and settings.

| Device/browser | Viewport | Route scope | Status | Issue / severity / fix / retest |
| --- | --- | --- | --- | --- |
| Playwright Chromium desktop | 1280-class automated default | browse, category, product, cart, checkout, registration, admin login | PASSED locally | No failing automated assertion; staging retest BLOCKED |
| Chrome desktop | 1440 × 900 | Full target route set | BLOCKED | No staging URL; no issue claim or retest |
| Safari desktop | 1440 × 900 | Full target route set | BLOCKED | No staging URL; no issue claim or retest |
| Firefox desktop | 1440 × 900 | Full target route set | BLOCKED | No staging URL; no issue claim or retest |
| Edge desktop | 1440 × 900 | Full target route set | BLOCKED | No staging URL; no issue claim or retest |
| Chrome Android | 360 × 800 and 412 × 915 | Full target route set | BLOCKED | No staging URL/device run; no issue claim or retest |
| Safari iPhone | 375 × 812 and 390 × 844 | Full target route set | BLOCKED | No staging URL/device run; no issue claim or retest |
| Safari iPad | 768 × 1024 and 1024 × 1366 | Full target route set | BLOCKED | No staging URL/device run; no issue claim or retest |

Additional 320, 430 and 1280 widths remain **NOT TESTED**. For every future issue, record route, reproduction steps, severity, fix commit, browser/device and retest result as a new row; do not overwrite failed evidence.
