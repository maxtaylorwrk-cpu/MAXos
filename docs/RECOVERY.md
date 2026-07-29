# RECOVERY.md

# Max OS Backup & Recovery (Beginner-friendly)

This document describes how to create, verify, and test-restore backups for Max OS.
Follow these steps locally — do NOT commit any secrets or credentials.

1) Prerequisites (local machine)
   - Install required CLI tools: psql, pg_dump, pg_restore (Postgres client), gpg, tar, jq, docker (for test restores).
   - Run the doctor:
     ./scripts/maxos-backup-cli.sh doctor

2) Dry run (no DB access)
   ./scripts/backup/maxos-backup.sh --outdir /tmp/maxos-backups --dry-run

3) Create a real backup (owner only)
   - Export your DB URL locally (do NOT commit):
     export BACKUP_DB_URL='postgres://user:password@host:5432/postgres'
   - Create an encrypted backup and write to an outdir:
     ./scripts/maxos-backup-cli.sh create --outdir "$HOME/maxos-backups" --encrypt
   - The script will produce:
     - A timestamped backup directory: $OUTDIR/maxos-<TS>/
     - manifest.json (contains metadata and file list)
     - manifest.sha256 (plaintext checksums)
     - A compressed archive: maxos-<TS>.tar.gz (or .tar.gz.gpg when encrypted)

4) Verify the backup (local)
   ./scripts/maxos-backup-cli.sh verify /path/to/maxos-<TS>.tar.gz[.gpg]

5) Test restore (isolated)
   - By default, test restore uses Docker to start an isolated Postgres and restores INTO IT.
     ./scripts/maxos-backup-cli.sh restore-test /path/to/maxos-<TS>.tar.gz[.gpg]
   - To target an existing local Postgres (for testing only):
     ./scripts/restore/maxos-restore-test.sh /path/to/archive --no-docker --target-postgres "postgres://user:pass@host:5432/postgres"
   - The restore scripts refuse production-like targets by default. Use scripts/restore/confirm-production.sh to explicitly confirm if you need to restore into production (not recommended unless you know what you're doing).

6) Where to store backups
   - Upload encrypted archives to an off-platform, secure storage (S3 with server-side encryption, Backblaze B2, an encrypted external drive, or similar).
   - Always keep at least two independent copies (different providers or provider + offline physical copy).

7) Encryption & passphrase
   - Encryption uses GPG symmetric AES256. You will be prompted for a passphrase when encrypting.
   - Store the passphrase in a password manager and keep a secure offline physical copy. Losing the passphrase makes backups unrecoverable.

Owner live-verification checklist (run locally, do not commit credentials)
  - Run doctor and ensure tools are available
  - Create an encrypted backup with the real BACKUP_DB_URL
  - Run verify on the produced archive
  - Run restore-test locally and confirm row counts and sample Unicode/multiline content
  - Upload encrypted archive to your chosen off-platform storage and confirm upload success

Notes
  - The manifest.json includes metadata fields: maxos_repo, maxos_commit (best-effort), tool_version, table row counts, and file entries with size + sha256.
  - manifest.sha256 is a plaintext checksum file for quick verification.

