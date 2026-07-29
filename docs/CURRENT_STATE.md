# CURRENT_STATE.md

This branch implements off-platform backup and verification tooling for Max OS. The repository contains:

- scripts/backup/* - backup, verify, encrypt helpers
- scripts/restore/* - safe test restore and production confirmation guard
- scripts/doctor/* - local health check
- scripts/maxos-backup-cli.sh - a small CLI wrapper
- tests/* - synthetic fixtures and integration tests
- .github/workflows/backup-validate.yml - CI validation workflow (runs on this branch)

The owner must run the live verification steps locally against the real Supabase/Postgres DB: see docs/RECOVERY.md
