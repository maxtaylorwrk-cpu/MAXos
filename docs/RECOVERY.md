# Max OS Backup & Recovery

This document describes how to create, verify, and test-restore backups for Max OS.
Follow these steps locally. Do **not** commit credentials, passphrases, or backup data.

## 1. Prerequisites

Install:

- `psql`, `pg_dump`, `pg_restore` (Postgres client tools)
- `gpg`
- `tar`
- `jq`
- Docker (for the safest isolated restore test)

Run the doctor:

```bash
./scripts/maxos-backup-cli.sh doctor
```

## 2. Dry run

No database access is performed:

```bash
./scripts/backup/maxos-backup.sh --outdir /tmp/maxos-backups --dry-run
```

## 3. Create a real encrypted backup — owner only

Set the real database URL only in your local shell/session:

```bash
export BACKUP_DB_URL='postgres://user:password@host:5432/postgres'
./scripts/maxos-backup-cli.sh create --outdir "$HOME/maxos-backups" --encrypt
```

By default, GPG prompts securely for the encryption passphrase.

For controlled non-interactive use, `BACKUP_ENCRYPTION_PASSPHRASE` is supported. Do not commit or log its value, and unset it after use:

```bash
export BACKUP_ENCRYPTION_PASSPHRASE='your-passphrase-from-a-password-manager'
# run create / verify / restore-test
unset BACKUP_ENCRYPTION_PASSPHRASE
```

The backup contains:

- a timestamped backup directory
- a Postgres custom-format dump
- per-table CSV exports
- `manifest.json` with metadata, row counts, and payload-file metadata
- `manifest.sha256` for integrity verification
- a compressed archive (`.tar.gz`) or encrypted archive (`.tar.gz.gpg`)

## 4. Verify the backup

```bash
./scripts/maxos-backup-cli.sh verify /path/to/maxos-<TS>.tar.gz.gpg
```

Verification checks archive extraction safety, manifest validity, SHA-256 checksums, and whether `pg_restore` can read the dump.

## 5. Test restore — isolated/local only

Preferred: let the tool create a disposable local Postgres container:

```bash
./scripts/maxos-backup-cli.sh restore-test /path/to/maxos-<TS>.tar.gz.gpg
```

Or restore into an existing **local-only** Postgres instance:

```bash
./scripts/restore/maxos-restore-test.sh /path/to/archive.tar.gz.gpg \
  --no-docker \
  --target-postgres 'postgres://user:pass@localhost:5432/postgres'
```

`restore-test` intentionally refuses remote targets. It is not a production-restore command.

## 6. Store verified copies off-platform

After verification:

- Keep only encrypted archives in off-platform storage.
- Maintain at least two independent copies, such as two providers or one provider plus an encrypted offline drive.
- Store the GPG passphrase separately in a password manager and a secure offline recovery location.
- Losing the passphrase makes the encrypted backup unrecoverable.

## Owner live-verification checklist

The automated CI uses only synthetic data. To close the real continuity gap, the owner must locally:

- Run the doctor.
- Create an encrypted backup using the real `BACKUP_DB_URL`.
- Verify the encrypted archive.
- Restore it into an isolated/local test Postgres instance.
- Confirm the five application-table row counts and sample Unicode/multiline content.
- Store at least two verified encrypted copies off-platform.
- Record the verification date without storing credentials or private account identifiers in documentation.

## Safety notes

- CI must never receive production database credentials.
- `restore-test` must remain local/test-only.
- Do not commit backup archives, database URLs, passphrases, or exported personal data.
- The live Supabase database remains the source of truth until a backup is created; backups are recovery copies, not the live datastore.
