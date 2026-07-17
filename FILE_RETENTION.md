# File Retention and Cleanup

`npm run files:cleanup` is always a dry run. It scans only `.protected-uploads`; repository brand assets and legacy/public catalog uploads are never candidates. Review output, then use `npm run files:cleanup -- --execute --older-than-hours=168` for an explicit local deletion.

- Unattached protected uploads: retain at least seven days so in-progress forms are safe.
- Review images: retain while pending/approved; soft-delete first. Rejected/deleted images may be purged after the configured operational/legal retention period.
- Return evidence: retain through dispute, refund, chargeback and statutory record periods. Never purge an active dispute.
- Support and internal-note attachments: retain through ticket closure plus the approved support retention period. Internal notes remain staff-only.
- Deactivation does not remove evidence or staff-authorized access; authorization remains permission-based.
- Closed-ticket customer access follows existing ownership rules until a separately approved retention job soft-deletes the asset.
- Every destructive run must be logged. Place assets under legal hold outside cleanup eligibility.
- Cloudinary cleanup supports staging-prefix enumeration, reference comparison, retention filtering, dry-run reporting and explicit paced deletion. Never infer deletion from public repository assets.

## Phase 7 Cloudinary cleanup execution — 2026-07-18

Status: **BLOCKED**. Cloudinary credential variables are unset and no staging-only folder exists. Neither dry-run nor execute mode was called against Cloudinary, no known orphan was created, and no remote asset was deleted. Local cleanup remains dry-run safe. Required evidence is the redacted staging prefix, retention cutoff, referenced/orphan counts, asset IDs (never secrets), reviewed dry-run report, explicit execute report and proof that referenced/protected/unrelated assets survived.
