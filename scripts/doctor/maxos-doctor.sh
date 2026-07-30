#!/usr/bin/env bash
set -euo pipefail

# scripts/doctor/maxos-doctor.sh
# Beginner-friendly health check for Max OS backup tooling.

echo "Max OS doctor: checking local backup/recovery environment"

MISSING=()
for cmd in pg_dump pg_restore psql gpg jq tar; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    MISSING+=("$cmd")
  fi
done

if ! command -v sha256sum >/dev/null 2>&1 && ! command -v shasum >/dev/null 2>&1; then
  MISSING+=("sha256sum-or-shasum")
fi

if [[ ${#MISSING[@]} -ne 0 ]]; then
  echo "WARNING: Missing required backup tools: ${MISSING[*]}"
  echo "  -> macOS: Homebrew packages commonly include postgresql, gnupg, jq; tar/shasum are normally available."
  echo "  -> Debian/Ubuntu: install postgresql-client, gnupg, jq; tar/sha256sum are normally available."
else
  echo "All required backup/verification CLI tools appear to be installed."
fi

if [[ -z "${BACKUP_DB_URL-}" ]]; then
  echo "NOTE: BACKUP_DB_URL is not set. That is fine for doctor/dry-run; it is required for a real backup."
else
  echo "BACKUP_DB_URL is set (value intentionally not displayed)."
fi

if [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE-}" ]]; then
  echo "BACKUP_ENCRYPTION_PASSPHRASE is set (value intentionally not displayed). Unset it after use."
else
  echo "Encryption passphrase env var is not set; GPG will prompt securely when encryption/decryption needs a passphrase."
fi

OUTDIR_DEFAULT="$HOME/maxos-backups"
if [[ -d "$OUTDIR_DEFAULT" ]]; then
  avail=$(df -h "$OUTDIR_DEFAULT" | awk 'NR==2{print $4}')
  echo "Available disk space at $OUTDIR_DEFAULT: $avail"
else
  echo "No default backup directory at $OUTDIR_DEFAULT yet (this is fine)."
fi

# Docker is preferred for isolated restore testing but is not required for backup creation/verification.
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    echo "Docker is available and running for disposable isolated restore tests."
  else
    echo "WARNING: Docker is installed but not running or inaccessible. Use a local-only --no-docker target if needed."
  fi
else
  echo "NOTE: Docker is not installed. Backup creation/verification can still work; restore-test needs Docker or an existing localhost Postgres target."
fi

cat <<EOF
Encryption guidance:
  - GPG symmetric AES256 is used for encrypted archives.
  - Store the passphrase in a password manager plus a secure offline recovery location.
  - Losing the passphrase makes encrypted backups unrecoverable.

Safety:
  - restore-test accepts only local/loopback database targets.
  - Never put production credentials into CI or commit them to Git.

Next step:
  ./scripts/backup/maxos-backup.sh --outdir /tmp/maxos-backups --dry-run
EOF

if [[ ${#MISSING[@]} -ne 0 ]]; then
  exit 1
fi
exit 0
