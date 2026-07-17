# Restricted-Role Rehearsal

Run date: 2026-07-18. Target: private staging. Result vocabulary is limited to **PASSED**, **FAILED**, **BLOCKED**, and **NOT TESTED**.

No staging URL/database exists, so no staging account was created and no interactive scenario is marked passed. Passwords and secrets must never be recorded here.

Phase 8 update: the protected `khelaghor-staging` Vercel project now exists, but it has no deployment or database. All interactive role and final-admin staging scenarios therefore remain BLOCKED; no code-inspection result was relabelled as a staging pass.

## Role-by-role staging matrix

Each cell is **BLOCKED**: the required staging account and deployment do not exist.

| Scenario | Store Manager | Product Manager | Order Manager | Warehouse Staff | Customer Support | Content Manager | Accountant |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Log in | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Allowed navigation visible | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Denied navigation hidden | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| One permitted action | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Forbidden page by direct URL | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Forbidden Server Action | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Forbidden CSV export | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Forbidden attachment | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Deactivate and invalidate session | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Reactivate account | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| Force password change | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

The seeded permission matrix and server guards provide automated local evidence, but they are not a substitute for the browser and direct-request rehearsal above.

## Final Super Admin guardrails

| Scenario | Local automated result | Staging result | Evidence |
| --- | --- | --- | --- |
| Simultaneous deactivation attempts | PASSED | BLOCKED | Serializable transaction concurrency test preserves at least one active Super Admin |
| Simultaneous role removals | NOT TESTED | BLOCKED | Requires a dedicated scenario and staging database |
| Self-deactivation | PASSED | BLOCKED | Server guard test |
| Remove final admin authority | PASSED | BLOCKED | Server guard test |
| Duplicate stale form submissions | NOT TESTED | BLOCKED | Requires captured staging requests |
| Blocked attempt audit record | PASSED for tested local guards | BLOCKED | Automated audit assertion; staging audit row not captured |
| Safe error returned | PASSED for tested local guards | BLOCKED | Automated error assertion; staging response not captured |
| Session state remains consistent | PASSED for tested local guards | BLOCKED | Local database/session assertions only |

Exact staging evidence must include account identifier, request ID, timestamp, response status, resulting active-Super-Admin count, audit-log ID, and session result. Do not include passwords, cookies, tokens, or raw personal data.
