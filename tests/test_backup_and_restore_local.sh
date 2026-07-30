#!/usr/bin/env bash
set -euo pipefail

# tests/test_backup_and_restore_local.sh
# Integration test: start ephemeral Postgres, load fixtures, run backup -> verify -> restore-test, and assert row counts and sample content.

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
FIXTURE="$ROOT_DIR/tests/fixtures/fixture.sql"
OUTDIR=$(mktemp -d /tmp/maxos-backup-test-XXXX)
SRC_CONTAINER="maxos_test_src_$$"
DST_CONTAINER="maxos_test_dst_$$"

cleanup(){
  echo "Cleaning up containers and temp dirs..."
  docker rm -f "$SRC_CONTAINER" >/dev/null 2>&1 || true
  docker rm -f "$DST_CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$OUTDIR" || true
}
trap cleanup EXIT

if [[ ! -f "$FIXTURE" ]]; then
  echo "ERROR: fixture not found: $FIXTURE" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required for this integration test" >&2
  exit 2
fi

# Start source Postgres (port 5433)
echo "Starting source Postgres container: $SRC_CONTAINER"
docker run --rm --name "$SRC_CONTAINER" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5433:5432 -d postgres:15

# Wait for Postgres to be ready
for i in {1..30}; do
  if pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! pg_isready -h localhost -p 5433 -U postgres >/dev/null 2>&1; then
  echo "ERROR: source Postgres didn't become ready" >&2
  exit 2
fi

# Create pgcrypto extension (fixture uses gen_random_uuid default)
echo "Creating pgcrypto extension in source DB..."
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >/dev/null

# Load fixture. ON_ERROR_STOP prevents a partially loaded fixture from producing misleading downstream results.
echo "Loading fixture into source DB..."
PGPASSWORD=postgres psql -v ON_ERROR_STOP=1 -h localhost -p 5433 -U postgres -d postgres -f "$FIXTURE"

# Run backup (no encryption for CI test)
echo "Running backup against source DB..."
export BACKUP_DB_URL="postgres://postgres:postgres@localhost:5433/postgres"
mkdir -p "$OUTDIR"
"$ROOT_DIR/scripts/backup/maxos-backup.sh" --outdir "$OUTDIR"

# Find created archive
ARCHIVE=$(ls -1t "$OUTDIR"/maxos-*.tar.gz 2>/dev/null | head -n1 || true)
if [[ -z "$ARCHIVE" ]]; then
  echo "ERROR: backup archive not found in $OUTDIR" >&2
  exit 2
fi
echo "Archive created: $ARCHIVE"

# Run verify
echo "Verifying archive..."
"$ROOT_DIR/scripts/backup/maxos-verify.sh" "$ARCHIVE"

# Start destination Postgres (port 5434) to restore into
echo "Starting destination Postgres container: $DST_CONTAINER"
docker run --rm --name "$DST_CONTAINER" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5434:5432 -d postgres:15

# Wait for dest Postgres
for i in {1..30}; do
  if pg_isready -h localhost -p 5434 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! pg_isready -h localhost -p 5434 -U postgres >/dev/null 2>&1; then
  echo "ERROR: destination Postgres didn't become ready" >&2
  exit 2
fi

# Create pgcrypto on dest as well
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >/dev/null

# Perform test restore into destination via restore-test (use --no-docker and point to target)
echo "Running test restore into destination Postgres..."
"$ROOT_DIR/scripts/restore/maxos-restore-test.sh" "$ARCHIVE" --no-docker --target-postgres "postgres://postgres:postgres@localhost:5434/postgres"

# Gather counts from source and dest and compare
TABLES=(conversations messages journal_entries knowledge_items knowledge_suggestions)
for t in "${TABLES[@]}"; do
  src_count=$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM \"$t\";" | tr -d '[:space:]')
  dst_count=$(PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM \"$t\";" | tr -d '[:space:]')
  echo "Table $t: source=$src_count dest=$dst_count"
  if [[ "$src_count" != "$dst_count" ]]; then
    echo "ERROR: row count mismatch for table $t" >&2
    exit 2
  fi
done

# Sample content check: messages first row content
src_sample=$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -t -c "SELECT content FROM messages ORDER BY created_at LIMIT 1;" | sed -n '1p' | tr -d '\n')
dst_sample=$(PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d postgres -t -c "SELECT content FROM messages ORDER BY created_at LIMIT 1;" | sed -n '1p' | tr -d '\n')

echo "Sample message: src='$src_sample' dst='$dst_sample'"
if [[ "$src_sample" != "$dst_sample" ]]; then
  echo "ERROR: sample message content mismatch" >&2
  exit 2
fi

echo "Integration test passed: backup -> verify -> restore-test round-trip successful"
exit 0
