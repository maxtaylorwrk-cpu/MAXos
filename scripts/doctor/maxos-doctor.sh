#!/usr/bin/env bash
set -euo pipefail

# scripts/doctor/maxos-doctor.sh
# Simple health-check (doctor) for Max OS backup tools.

SCRIPTDIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/..
source "$SCRIPTDIR/common/env-validate.sh" || true

echo "Max OS doctor: checking local environment"

# Check required commands
MISSING=()
for cmd in pg_dump pg_restore psql gpg jq tar sha256sum shasum docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    MISSING+=("$cmd")
  fi
done

if [[ ${#MISSING[@]} -ne 0 ]]; then
  echo "WARNING: Missing commands: ${MISSING[*]}"
  echo "  -> On macOS: install with Homebrew, e.g. 'brew install postgresql gpg jq docker'"
  echo "  -> On Debian/Ubuntu: apt-get install postgresql-client gnupg jq docker.io" 
else
  echo "All required CLI tools appear to be installed"
fi

# Check BACKUP_DB_URL presence (do not print it)
if [[ -z "${BACKUP_DB_URL-}" ]]; then
  echo "NOTE: BACKUP_DB_URL is not set. You must export BACKUP_DB_URL for real backups. Use --dry-run to test without a DB. See .env.example"
else
  echo "BACKUP_DB_URL is set (not displayed for security)."
fi

# Check disk space for default outdir ($HOME/maxos-backups)
OUTDIR_DEFAULT="$HOME/maxos-backups"
if [[ -d "$OUTDIR_DEFAULT" ]]; then
  avail=$(df -h "$OUTDIR_DEFAULT" | awk 'NR==2{print $4}')
  echo "Available disk space at $OUTDIR_DEFAULT: $avail"
else
  echo "No default backup directory at $OUTDIR_DEFAULT (this is fine). To create backups, choose an outdir with enough space and pass --outdir to the create command."
fi

# Check Docker availability
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    echo "Docker appears available and running (used for isolated test-restore)."
  else
    echo "Docker is installed but not running or the current user cannot access it. The test-restore will fail unless Docker is fixed or --no-docker + --target-postgres is used."
  fi
else
  echo "Docker not installed. Test restore will require an existing Postgres instance and --no-docker + --target-postgres." 
fi

# Recommend encryption passphrase storage
cat <<EOF
Encryption guidance:
 - Default symmetric encryption uses GPG (AES256). When encrypting, store the passphrase in a password manager and keep an offline physical copy in a safe.
 - Losing the passphrase makes backups unrecoverable.

Next steps:
 - Run a dry run: ./scripts/backup/maxos-backup.sh --outdir /tmp/maxos-backups --dry-run
 - Run the doctor again after installing any missing tools.
EOF

exit 0
