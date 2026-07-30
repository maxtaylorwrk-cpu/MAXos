# MAXos backup and recovery tooling

This directory contains the backup subsystem for MAXos. It is one part of the broader MAXos repository.

Key commands:

- Create: `./scripts/maxos-backup-cli.sh create --outdir DIR [--encrypt]`
- Verify: `./scripts/maxos-backup-cli.sh verify PATH`
- Test restore: `./scripts/maxos-backup-cli.sh restore-test PATH`
- Doctor: `./scripts/maxos-backup-cli.sh doctor`

`restore-test` is intentionally local/isolated only and refuses remote database targets.

See `docs/RECOVERY.md` for the owner runbook, encryption guidance, off-platform storage guidance, and the live-verification checklist.
