# KhelaGhor Backup and Restore Runbook

## PostgreSQL

Create a timestamped custom-format dump with a restricted operator account:

```bash
pg_dump --format=custom --no-owner --no-acl --file=khelaghor-YYYYMMDD-HHMM.dump "$DATABASE_URL"
pg_restore --list khelaghor-YYYYMMDD-HHMM.dump > khelaghor-YYYYMMDD-HHMM.manifest
```

Encrypt and store the dump outside the application host, record its checksum, and never commit dumps or environment files.

## Restore rehearsal

1. Create an empty isolated PostgreSQL database using the production major version.
2. Run `pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" backup.dump`.
3. Point a non-production application instance at it.
4. Run `npm run db:check`, `npx prisma migrate status`, and `/admin/reports/reconciliation`.
5. Verify orders, inventory, users, uploads, audit logs, and `/api/health`; then destroy rehearsal credentials.

## Uploads and environment

- Enable Cloudinary backup/versioning and retain an asset-key inventory; database dumps do not contain file bytes.
- Back up development `public/uploads` and `.protected-uploads` with permissions intact. Local storage is blocked in production.
- Keep environment configuration in an encrypted secret manager. Back up recovery procedures, not plaintext secrets.

## Migration and rollback

- Back up before `prisma migrate deploy`; never use `db push` in production.
- Treat applied migrations as immutable. Correct with a reviewed forward migration or Prisma `migrate resolve` after verifying database state.
- Roll back application artifacts independently. Database rollback requires a reviewed reverse migration or point-in-time restore.

## Data-loss incident

Freeze writes; preserve logs and current data; record request IDs and operator actions; restore into isolation; validate with health and reconciliation; rotate exposed secrets and sessions; document customer impact, notification duties, and prevention work.

## Local restore evidence — 2026-07-18

- Source: local `khelaghor`; destination: separate `khelaghor_restore_phase5`. The working database was not overwritten.
- Created a custom-format `pg_dump`, restored it with `pg_restore --no-owner --no-acl`, and ran Prisma migration status against the restored database.
- Source counts: Users 99, Orders 128, Products 245, AuditLogs 121.
- Restored counts: Users 99, Orders 128, Products 245, AuditLogs 121.
- Prisma reported all 11 migrations applied. A restored order number and staff/admin record were successfully read.
- Result: pass for local PostgreSQL dump/restore integrity. Upload-provider backup and managed PostgreSQL point-in-time recovery remain external verification items.

## Phase 7 staging result — 2026-07-18

**BLOCKED.** No staging database or Cloudinary environment exists. Therefore no Phase 7 staging dump, row-count snapshot, isolated restore, admin login, product/order/payment/shipment/audit/file-metadata verification, or provider-file restore was executed. The earlier local restore is retained as local evidence only and is not promoted to a staging PASS.
