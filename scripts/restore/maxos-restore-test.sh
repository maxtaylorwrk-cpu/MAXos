#!/usr/bin/env bash
set -euo pipefail

# scripts/restore/maxos-restore-test.sh
# Safe test restore for Max OS backups.
# Default: restore into an isolated local Postgres container (Docker) for verification.
# Usage: ./maxos-restore-test.sh /path/to/maxos-YYYYmmddTHHMMSSZ.tar.gz[.gpg] [--no-docker]

PROG="maxos-restore-test"

usage(){
  cat <<EOF
Usage: $PROG /path/to/backup.tar.gz[.gpg] [--no-docker] [--target-postgres POSTGRES_URL]

By default this script will create a disposable local Postgres via Docker and restore the backup into it for verification.
Use --no-docker and --target-postgres to restore into an existing local Postgres (recommended only for testing).

This script will NOT target production unless you explicitly confirm using scripts/restore/confirm-production.sh.
EOF
}

if [[ ${1-} == "" ]]; then
  usage; exit 2
fi
BACKUP_ARCHIVE="$1"
shift || true
USE_DOCKER="true"
TARGET_POSTGRES=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-docker)
      USE_DOCKER="false"; shift;;
    --target-postgres)
      TARGET_POSTGRES="$2"; shift 2;;
    --help)
      usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

if [[ ! -f "$BACKUP_ARCHIVE" ]]; then
  echo "ERROR: Backup archive not found: $BACKUP_ARCHIVE" >&2
  exit 2
fi

# Prevent accidental production target
if [[ -n "$TARGET_POSTGRES" ]]; then
  # naive check for supabase-like host patterns
  if echo "$TARGET_POSTGRES" | grep -Ei "supabase.co|:5432" >/dev/null 2>&1; then
    echo "The target Postgres URL looks like production. To proceed, run: scripts/restore/confirm-production.sh" >&2
    exit 2
  fi
fi

# Validate environment
SCRIPTDIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$SCRIPTDIR/../common/env-validate.sh"

# Determine sha command
if command -v sha256sum >/dev/null 2>&1; then
  SHA_CMD=(sha256sum)
elif command -v shasum >/dev/null 2>&1; then
  SHA_CMD=(shasum -a 256)
else
  echo "ERROR: No sha256sum or shasum available" >&2
  exit 2
fi

# Create temporary workspace
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# If encrypted, decrypt
TMP_ARCHIVE="$WORKDIR/archive.tar.gz"
if [[ "$BACKUP_ARCHIVE" == *.gpg ]]; then
  echo "Decrypting backup archive to temporary location..."
  gpg --batch --yes --output "$TMP_ARCHIVE" --decrypt "$BACKUP_ARCHIVE" || { echo "ERROR: GPG decryption failed" >&2; exit 2; }
else
  cp "$BACKUP_ARCHIVE" "$TMP_ARCHIVE"
fi

# Extract
tar -C "$WORKDIR" -xzf "$TMP_ARCHIVE"
BACKUP_DIR=$(find "$WORKDIR" -mindepth 1 -maxdepth 1 -type d | head -n1)
if [[ -z "$BACKUP_DIR" ]]; then
  echo "ERROR: could not locate extracted backup directory" >&2
  exit 2
fi

# Verify checksums (manifest.sha256 expected at top level)
if [[ ! -f "$BACKUP_DIR/manifest.sha256" ]]; then
  echo "ERROR: manifest.sha256 missing in backup" >&2
  exit 2
fi

pushd "$BACKUP_DIR" >/dev/null
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c manifest.sha256 || { echo "ERROR: checksum verification failed" >&2; exit 2; }
else
  shasum -a 256 -c manifest.sha256 || { echo "ERROR: checksum verification failed" >&2; exit 2; }
fi
popd >/dev/null

# Locate dump
DUMP_FILE=$(find "$BACKUP_DIR" -type f -name "*.dump" | head -n1)
if [[ -z "$DUMP_FILE" ]]; then
  echo "ERROR: No .dump file found in backup" >&2
  exit 2
fi

# Start isolated Postgres via Docker if requested
RESTORE_DB_URL=""
DOCKER_CONTAINER_NAME="maxos_restore_test_$(date -u +%Y%m%dT%H%M%SZ)"
if [[ "$USE_DOCKER" == "true" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker not available. Install Docker or use --no-docker with --target-postgres." >&2
    exit 2
  fi
  echo "Starting temporary Postgres Docker container: $DOCKER_CONTAINER_NAME"
  docker run --rm --name "$DOCKER_CONTAINER_NAME" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5433:5432 -d postgres:15
  # Wait for Postgres to accept connections
  for i in {1..30}; do
    if pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  RESTORE_DB_URL="postgres://postgres:postgres@localhost:5433/postgres"
else
  if [[ -n "$TARGET_POSTGRES" ]]; then
    RESTORE_DB_URL="$TARGET_POSTGRES"
  else
    echo "ERROR: --no-docker requires --target-postgres to be set" >&2
    exit 2
  fi
fi

# Final safety check: refuse to run if RESTORE_DB_URL looks like production (host contains supabase.co)
if echo "$RESTORE_DB_URL" | grep -Ei "supabase.co" >/dev/null 2>&1; then
  echo "Refusing to restore into production-like target. Use scripts/restore/confirm-production.sh to proceed intentionally." >&2
  exit 2
fi

# Restore using pg_restore
echo "Restoring dump into $RESTORE_DB_URL"
PGPASSWORD="postgres" pg_restore --no-owner --no-acl -d "$RESTORE_DB_URL" "$DUMP_FILE" || { echo "ERROR: pg_restore failed" >&2; exit 2; }

# Post-restore verification: run counts and sample queries
echo "Running post-restore verification queries..."
TABLES=(conversations messages journal_entries knowledge_items knowledge_suggestions)
for t in "${TABLES[@]}"; do
  cnt=$(psql "$RESTORE_DB_URL" -t -c "SELECT COUNT(*) FROM \"$t\";" | tr -d '[:space:]')
  echo "  - $t: $cnt rows"
done

# Sample content checks for Unicode/multiline
echo "Sample content checks (first message and first journal entry):"
psql "$RESTORE_DB_URL" -c "SELECT id, content FROM messages ORDER BY created_at LIMIT 1;"
psql "$RESTORE_DB_URL" -c "SELECT id, content FROM journal_entries ORDER BY created_at LIMIT 1;"

if [[ "$USE_DOCKER" == "true" ]]; then
  echo "Test restore completed in temporary Docker Postgres.
Connect locally with: psql 'postgres://postgres:postgres@localhost:5433/postgres'"
  echo "The Docker container will continue running until you exit this script. To stop it, press Ctrl-C or run: docker stop $DOCKER_CONTAINER_NAME"
else
  echo "Test restore completed into target: $RESTORE_DB_URL"
fi

# Note: the caller is responsible for stopping/removing the Docker container; container is run with --rm so stopping it removes it.

exit 0
