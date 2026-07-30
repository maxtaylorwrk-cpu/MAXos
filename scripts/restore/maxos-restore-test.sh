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

By default this script creates a disposable local Postgres via Docker and restores the backup into it for verification.
Use --no-docker with --target-postgres only for an existing Postgres on localhost/127.0.0.1.

This test tool intentionally refuses remote/production targets. Production restore is not implemented by this command.
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

# Existing targets are deliberately restricted to loopback hosts.
if [[ -n "$TARGET_POSTGRES" ]]; then
  if ! printf '%s\n' "$TARGET_POSTGRES" | grep -Eq '^postgres(ql)?://[^@]*@(localhost|127\.0\.0\.1)(:|/)'; then
    echo "ERROR: restore-test only accepts localhost/127.0.0.1 targets. Remote and production restores are intentionally unsupported." >&2
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

# Create temporary workspace and ensure all disposable resources are removed on every exit path.
WORKDIR=$(mktemp -d)
DOCKER_CONTAINER_NAME=""
cleanup() {
  if [[ -n "$DOCKER_CONTAINER_NAME" ]]; then
    docker rm -f "$DOCKER_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

safe_extract_tar() {
  local archive="$1"
  local destination="$2"
  if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    echo "ERROR: archive contains unsafe absolute or parent-directory paths" >&2
    exit 2
  fi
  tar -C "$destination" -xzf "$archive"
}

# If encrypted, decrypt
TMP_ARCHIVE="$WORKDIR/archive.tar.gz"
if [[ "$BACKUP_ARCHIVE" == *.gpg ]]; then
  echo "Decrypting backup archive to temporary location..."
  if [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE-}" ]]; then
    printf '%s' "$BACKUP_ENCRYPTION_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --output "$TMP_ARCHIVE" --decrypt "$BACKUP_ARCHIVE" || { echo "ERROR: GPG decryption failed" >&2; exit 2; }
  else
    gpg --yes --output "$TMP_ARCHIVE" --decrypt "$BACKUP_ARCHIVE" || { echo "ERROR: GPG decryption failed" >&2; exit 2; }
  fi
else
  cp "$BACKUP_ARCHIVE" "$TMP_ARCHIVE"
fi

# Extract
safe_extract_tar "$TMP_ARCHIVE" "$WORKDIR"
BACKUP_DIR=$(find "$WORKDIR" -mindepth 1 -maxdepth 1 -type d -print -quit)
if [[ -z "$BACKUP_DIR" ]]; then
  echo "ERROR: could not locate extracted backup directory" >&2
  exit 2
fi

# Verify checksums (manifest.sha256 expected at top level)
if [[ ! -f "$BACKUP_DIR/manifest.sha256" ]]; then
  echo "ERROR: manifest.sha256 missing in backup" >&2
  exit 2
fi
if [[ ! -f "$BACKUP_DIR/manifest.json" ]]; then
  echo "ERROR: manifest.json missing in backup" >&2
  exit 2
fi
jq empty "$BACKUP_DIR/manifest.json" || { echo "ERROR: manifest.json is not valid JSON" >&2; exit 2; }

pushd "$BACKUP_DIR" >/dev/null
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c manifest.sha256 || { echo "ERROR: checksum verification failed" >&2; exit 2; }
else
  shasum -a 256 -c manifest.sha256 || { echo "ERROR: checksum verification failed" >&2; exit 2; }
fi
popd >/dev/null

# Locate dump
DUMP_FILE=$(find "$BACKUP_DIR" -type f -name "*.dump" -print -quit)
if [[ -z "$DUMP_FILE" ]]; then
  echo "ERROR: No .dump file found in backup" >&2
  exit 2
fi

# Start isolated Postgres via Docker if requested
RESTORE_DB_URL=""
if [[ "$USE_DOCKER" == "true" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker not available. Install Docker or use --no-docker with a local --target-postgres." >&2
    exit 2
  fi
  DOCKER_CONTAINER_NAME="maxos_restore_test_$(date -u +%Y%m%dT%H%M%SZ)_$$"
  echo "Starting temporary Postgres Docker container: $DOCKER_CONTAINER_NAME"
  docker run --rm --name "$DOCKER_CONTAINER_NAME" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5433:5432 -d postgres:15
  for i in {1..30}; do
    if pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  if ! pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
    echo "ERROR: temporary Postgres did not become ready" >&2
    exit 2
  fi
  RESTORE_DB_URL="postgres://postgres:postgres@localhost:5433/postgres"
else
  if [[ -n "$TARGET_POSTGRES" ]]; then
    RESTORE_DB_URL="$TARGET_POSTGRES"
  else
    echo "ERROR: --no-docker requires --target-postgres to be set" >&2
    exit 2
  fi
fi

# Defense in depth: never allow a non-loopback target through this test command.
if ! printf '%s\n' "$RESTORE_DB_URL" | grep -Eq '^postgres(ql)?://[^@]*@(localhost|127\.0\.0\.1)(:|/)'; then
  echo "ERROR: refusing non-local restore target. Production restore is intentionally unsupported by restore-test." >&2
  exit 2
fi

# Restore using pg_restore
echo "Restoring dump into local test database"
pg_restore --no-owner --no-acl -d "$RESTORE_DB_URL" "$DUMP_FILE" || { echo "ERROR: pg_restore failed" >&2; exit 2; }

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
  echo "Test restore completed successfully in disposable Docker Postgres. The container will now be removed."
else
  echo "Test restore completed successfully into local target."
fi

exit 0
