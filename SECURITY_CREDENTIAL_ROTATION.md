# Neon Credential Rotation Checklist

Date opened: 2026-07-18  
Overall status: **BLOCKED — manual Neon role password reset required**

No database connection, migration, seed, admin bootstrap, or deployment may use
the currently stored Neon credentials. Treat every URL for the endpoints below
as compromised until the old credentials are confirmed rejected.

## Affected endpoints

| Environment/source | Endpoint hostname | Database | Connection type | Status |
| --- | --- | --- | --- | --- |
| Legacy local `.env` | `ep-wild-queen-ao7kb7rf-pooler.c-2.ap-southeast-1.aws.neon.tech` | `neondb` | Pooled | Compromised; project identity must be confirmed |
| Legacy local `.env.local` | `ep-broad-glitter-awunhv57-pooler.c-12.us-east-1.aws.neon.tech` | `neondb` | Pooled | Compromised; likely staging, confirm in Neon |
| Legacy local `.env.local` | `ep-broad-glitter-awunhv57.c-12.us-east-1.aws.neon.tech` | `neondb` | Unpooled | Compromised; same endpoint family as the preceding row |

## Required manual rotation

- [ ] Open the Neon dashboard and identify the project and branch for each
      endpoint family above.
- [ ] Reset the password for every database role embedded in the affected URLs.
- [ ] Do not reuse either old password.
- [ ] Update `DATABASE_URL` in the **Production environment of the
      `khelaghor-staging` Vercel project only** with the new pooled URL.
- [ ] Update `DATABASE_URL_UNPOOLED` and `POSTGRES_URL_NON_POOLING` in that same
      staging environment with the new unpooled URL.
- [ ] Update staging `DIRECT_URL` if it is separately configured.
- [ ] Confirm all staging database URLs belong to the same Neon project/branch,
      use database `neondb`, and differ only as expected for pooled/unpooled
      endpoints.
- [ ] Confirm the old credentials no longer connect.
- [ ] Record rotation completion date: `YYYY-MM-DD HH:MM TZ`.
- [ ] Record verifier (name/initials): `____________`.

## Local cleanup after rotation confirmation

- [ ] Back up `.env` to `.env.remote.backup` and `.env.local` to
      `.env.local.remote.backup` without printing their contents.
- [ ] Replace local `DATABASE_URL` and `DIRECT_URL` with localhost PostgreSQL
      URLs for database `khelaghor`.
- [ ] Remove all live Neon URLs from `.env` and `.env.local`.
- [ ] Keep `.env*`, backup environment files, and `.vercel` ignored and
      untracked.
- [ ] Pull fresh staging variables into ignored `.env.staging.runtime` only
      after rotation is confirmed.

## Safe verification commands

These checks must report only presence and endpoint metadata; they must never
print complete URLs, usernames, passwords, tokens, or secrets.

- [ ] Run `npm run env:audit` after that script is added.
- [ ] Verify local `DATABASE_URL` and `DIRECT_URL` hosts are `localhost`.
- [ ] Verify staging `DATABASE_URL` is remote and pooled.
- [ ] Verify staging has a matching remote unpooled URL.
- [ ] Run `npx prisma migrate status` with the ignored staging runtime file.
- [ ] Run the staging-safe seed twice with `APP_ENV=staging` and compare row
      counts.
- [ ] Confirm staging contains no `admin@khelaghor.local` user.

## Vercel variables requiring review

Project scope: **`khelaghor-staging` only**

| Variable | Current presence | Required action |
| --- | --- | --- |
| `DATABASE_URL` | Present, encrypted | Replace with rotated pooled URL |
| `DATABASE_URL_UNPOOLED` | Present, encrypted | Replace with rotated unpooled URL |
| `POSTGRES_URL_NON_POOLING` | Present, encrypted | Replace with rotated unpooled URL |
| `DIRECT_URL` | Present, encrypted | Replace if it contains the compromised credential |

Production project `khelaghor` is out of scope and must remain untouched.
