# KhelaGhor Deployment Checklist

## Phase 4 launch gates

- [ ] Staff role boundaries and restricted mutations verified.
- [ ] Admin credentials rotated; final active Super Admin protected.
- [ ] Bangladesh legal content and update dates reviewed by qualified counsel.
- [ ] Real contact details, product data, stock, delivery fees and COD rules verified.
- [ ] Email sender, SSLCommerz sandbox and courier sandbox verified.
- [ ] Encrypted database/upload backup restored successfully in isolation.
- [ ] Monitoring, domain, TLS, canonical URLs, robots, sitemap and SEO verified.
- [ ] Accessibility, Bangla clipping, responsive matrix and mobile performance measured.
- [ ] Reconciliation has no unexplained high-severity findings.

## Before Deploy

- [ ] Production PostgreSQL database created.
- [ ] `DATABASE_URL` configured for runtime connections.
- [ ] `DIRECT_URL` configured for direct migrations when using pooled connections.
- [ ] Database backups enabled and restore tested.
- [ ] `npm run db:migrate:deploy` completed successfully.
- [ ] Production admin created with `npm run admin:create`.
- [ ] Seeded/default passwords removed from production.
- [ ] Cloudinary production storage configured.
- [ ] SSLCommerz sandbox credentials tested.
- [ ] SSLCommerz live credentials configured after sandbox approval.
- [ ] Courier provider credentials configured or mock mode explicitly accepted for launch rehearsal.
- [ ] Email provider configured with verified sender domain.
- [ ] SMS/WhatsApp provider credentials configured if those channels are enabled.
- [ ] Sentry project configured if production error monitoring is required.
- [ ] Google Analytics, GTM and Meta Pixel IDs configured if tracking is required.

## Domain And Security

- [ ] Preferred canonical domain chosen.
- [ ] Vercel domain connected.
- [ ] DNS records added.
- [ ] SSL certificate active.
- [ ] WWW redirect configured.
- [ ] `NEXT_PUBLIC_SITE_URL` points to the canonical HTTPS domain.
- [ ] Legal pages reviewed by the business.
- [ ] Secure `AUTH_SECRET` generated and stored only in the deployment platform.
- [ ] Payment/courier/email secrets stored only as server-side environment variables.

## Content And Operations

- [ ] Real products uploaded.
- [ ] Product images, brand logos, category images, blog images and review/return evidence uploads tested.
- [ ] Shipping rates and delivery text reviewed.
- [ ] Refund policy and cancellation policy reviewed.
- [ ] Test order completed with COD.
- [ ] Test order completed with SSLCommerz sandbox.
- [ ] Failed payment flow tested.
- [ ] Duplicate payment callback tested.
- [ ] Refund flow tested.
- [ ] Courier booking tested.
- [ ] Support reply email tested.
- [ ] Backup and rollback procedure verified.

## Final Gate

- [ ] `npm run db:generate`
- [ ] `npm run db:check`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`
