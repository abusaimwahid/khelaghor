# KhelaGhor Live Test Plan

## Phase 4 evidence

- Record build SHA, environment, operator, timestamp and migration state.
- Exercise each staff role with allowed/denied pages and mutations; verify deactivation and session revocation.
- Verify cross-customer order, invoice, support, review, return, notification and private-file IDs disclose nothing.
- Test unsafe MIME/extension, oversized upload, traversal key, private delivery and production-local-storage rejection.
- Test invalid coupon, changed stock, duplicate checkout, failed providers and repeated callbacks.
- Export reconciliation before and after rehearsal and explain each finding.
- Restore the rehearsal backup in isolation and re-run health and reconciliation.

Run this plan on preview first, then production after DNS and SSL are active.

## Customer Tests

- Registration creates a customer account and sends the registration email.
- Login opens the customer dashboard.
- Browse home, category, brand and product pages.
- Search returns relevant products and empty states.
- Add to cart as a guest.
- Add to cart after login and confirm guest cart merge.
- Checkout with Cash on Delivery.
- Checkout with SSLCommerz sandbox online payment.
- Confirm failed SSLCommerz payment does not mark an order paid.
- Confirm duplicate SSLCommerz callback does not double-update the payment.
- Open order confirmation from the returned order number.
- Confirm order confirmation email delivery.
- Open customer dashboard order history.
- Submit a support ticket.
- Submit an eligible return request.

## Admin Tests

- Admin login with the bootstrapped production account.
- First-login password change is required and clears after update.
- Product creation with image upload.
- Brand logo upload.
- Category image upload.
- Inventory update creates an inventory movement.
- Order status update creates status history.
- Courier booking stores courier provider, courier order ID and tracking ID.
- Payment verification updates payment and order status only after server-side validation.
- Return handling updates return status and restocks when selected.
- Support reply creates a customer notification/email.
- Homepage banner update works.

## Infrastructure Tests

- `/api/health` returns database connected.
- Temporarily invalid database credentials make health return degraded in a safe way.
- Upload failure returns a safe validation error.
- Email provider failure does not expose provider secrets.
- Rate limit triggers on repeated login/checkout attempts.
- 404 page renders.
- 500 error page renders without sensitive stack traces.
- Mobile layout works for home, product, cart, checkout, account and admin.
- Security headers are present.
- Analytics scripts load only when public IDs are configured.
- Logs include `x-request-id` and do not include passwords, auth tokens or payment secrets.
