#!/usr/bin/env bash
set -euo pipefail

# tests/test_backup_and_restore_local.sh
# Integration test: ephemeral Postgres round trips for plain and encrypted backups.

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
FIXTURE="$ROOT_DIR/tests/fixtures/fixture.sql"
OUTDIR=$(mktemp -d /tmp/maxos-backup-test-XXXX)
SRC_CONTAINER="maxos_test_src_$$"
DST_CONTAINER="maxos_test_dst_$$"
ENC_DST_CONTAINER="maxos_test_enc_dst_$$"

cleanup(){
  echo "Cleaning up containers and temp dirs..."
  docker rm -f "$SRC_CONTAINER" >/dev/null 2>&1 || true
  docker rm -f "$DST_CONTAINER" >/dev/null 2>&1 || true
  docker rm -f "$ENC_DST_CONTAINER" >/dev/null 2>&1 || true
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

# Run unencrypted backup
 echo "Running backup against source DB..."
export BACKUP_DB_URL="postgres://postgres:postgres@localhost:5433/postgres"
mkdir -p "$OUTDIR/plain"
"$ROOT_DIR/scripts/backup/maxos-backup.sh" --outdir "$OUTDIR/plain"

ARCHIVE=$(ls -1t "$OUTDIR"/plain/maxos-*.tar.gz 2>/dev/null | head -n1 || true)
if [[ -z "$ARCHIVE" ]]; then
  echo "ERROR: backup archive not found in $OUTDIR/plain" >&2
  exit 2
fi
echo "Archive created: $ARCHIVE"

echo "Verifying archive..."
"$ROOT_DIR/scripts/backup/maxos-verify.sh" "$ARCHIVE"

# Start destination Postgres (port 5434) for plain restore
echo "Starting destination Postgres container: $DST_CONTAINER"
docker run --rm --name "$DST_CONTAINER" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5434:5432 -d postgres:15
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
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >/dev/null

echo "Running test restore into destination Postgres..."
"$ROOT_DIR/scripts/restore/maxos-restore-test.sh" "$ARCHIVE" --no-docker --target-postgres "postgres://postgres:postgres@localhost:5434/postgres"

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

src_sample=$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -t -c "SELECT content FROM messages ORDER BY created_at LIMIT 1;" | sed -n '1p' | tr -d '\n')
dst_sample=$(PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d postgres -t -c "SELECT content FROM messages ORDER BY created_at LIMIT 1;" | sed -n '1p' | tr -d '\n')
echo "Sample message: src='$src_sample' dst='$dst_sample'"
if [[ "$src_sample" != "$dst_sample" ]]; then
  echo "ERROR: sample message content mismatch" >&2
  exit 2
fi

# Encrypted round trip uses a fixed synthetic CI-only passphrase; never production credentials.
echo "Running encrypted backup smoke test..."
export BACKUP_ENCRYPTION_PASSPHRASE="maxos-ci-synthetic-passphrase"
mkdir -p "$OUTDIR/encrypted"
"$ROOT_DIR/scripts/backup/maxos-backup.sh" --outdir "$OUTDIR/encrypted" --encrypt
ENC_ARCHIVE=$(ls -1t "$OUTDIR"/encrypted/maxos-*.tar.gz.gpg 2>/dev/null | head -n1 || true)
if [[ -z "$ENC_ARCHIVE" ]]; then
  echo "ERROR: encrypted backup archive not found" >&2
  exit 2
fi
"$ROOT_DIR/scripts/backup/maxos-verify.sh" "$ENC_ARCHIVE"

# Restore encrypted archive into a second isolated destination on port 5435.
echo "Starting encrypted-restore destination: $ENC_DST_CONTAINER"
docker run --rm --name "$ENC_DST_CONTAINER" -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=postgres -p 5435:5432 -d postgres:15
for i in {1..30}; do
  if pg_isready -h localhost -p 5435 -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! pg_isready -h localhost -p 5435 -U postgres >/dev/null 2>&1; then
  echo "ERROR: encrypted-restore destination didn't become ready" >&2
  exit 2
fi
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" >/dev/null
"$ROOT_DIR/scripts/restore/maxos-restore-test.sh" "$ENC_ARCHIVE" --no-docker --target-postgres "postgres://postgres:postgres@localhost:5435/postgres"

src_messages=$(PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d postgres -t -c 'SELECT COUNT(*) FROM messages;' | tr -d '[:space:]')
enc_dst_messages=$(PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d postgres -t -c 'SELECT COUNT(*) FROM messages;' | tr -d '[:space:]')
if [[ "$src_messages" != "$enc_dst_messages" ]]; then
  echo "ERROR: encrypted restore message count mismatch" >&2
  exit 2
fi
unset BACKUP_ENCRYPTION_PASSPHRASE

echo "Integration test passed: plain + encrypted backup -> verify -> restore-test round trips successful"
exit 0
