#!/usr/bin/env bash
set -euo pipefail

# scripts/backup/maxos-backup.sh
# Create a timestamped backup of Max OS core application data.
# Beginner-friendly single command wrapper.

# Usage: ./maxos-backup.sh --outdir /path/to/out [--encrypt]

PROG_NAME="maxos-backup"
TOOL_VERSION="maxos-backup.sh v1"

print_usage() {
  printf '%s\n' \
    "Usage: $PROG_NAME --outdir /path/to/out [--encrypt]" \
    "" \
    "Options:" \
    "  --outdir DIR      Directory where backups and manifest will be written (required)" \
    "  --encrypt         Encrypt the final archive using GPG symmetric AES256 (interactive passphrase)" \
    "  --dry-run         Show what would be done without contacting the database" \
    "  --help            Show this help" \
    "" \
    "Environment (set locally, not in Git):" \
    "  BACKUP_DB_URL     Postgres connection URL for the database to back up (required unless --dry-run)" \
    "" \
    "Example:" \
    "  BACKUP_DB_URL=postgres://user:pass@host:5432/postgres ./scripts/backup/maxos-backup.sh --outdir \"$HOME/maxos-backups\" --encrypt" \
    ""
}

# Basic arg parsing
OUTDIR=""
ENCRYPT="false"
DRY_RUN="false"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --outdir)
      OUTDIR="$2"; shift 2;;
    --encrypt)
      ENCRYPT="true"; shift;;
    --dry-run)
      DRY_RUN="true"; shift;;
    --help)
      print_usage; exit 0;;
    *)
      echo "Unknown arg: $1"; print_usage; exit 2;;
  esac
done

if [[ -z "$OUTDIR" ]]; then
  echo "ERROR: --outdir is required. See --help." >&2
  exit 2
fi

if [[ "$DRY_RUN" == "true" ]]; then
  echo "DRY RUN: no DB actions will be performed. OUTDIR=$OUTDIR ENCRYPT=$ENCRYPT"
fi

# Validate environment and commands
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

# Timestamp
TS=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_NAME="maxos-$TS"
BACKUP_DIR="$OUTDIR/$BACKUP_NAME"
DUMP_FILE="$BACKUP_DIR/${BACKUP_NAME}.dump"
MANIFEST_JSON="$BACKUP_DIR/manifest.json"
MANIFEST_SHA="$BACKUP_DIR/manifest.sha256"
CSV_DIR="$BACKUP_DIR/tables"

# safe mkdir
if [[ -d "$BACKUP_DIR" ]]; then
  echo "ERROR: Backup directory already exists: $BACKUP_DIR" >&2
  echo "Will not overwrite existing backups. Choose a different outdir or timestamp." >&2
  exit 2
fi

mkdir -p "$CSV_DIR"

# Tables to export
TABLES=(conversations messages journal_entries knowledge_items knowledge_suggestions)

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Would run pg_dump to create: $DUMP_FILE"
  for t in "${TABLES[@]}"; do
    echo "Would export table $t to $CSV_DIR/$t-$TS.csv"
  done
  echo "Would create manifest at $MANIFEST_JSON and checksums at $MANIFEST_SHA"
  if [[ "$ENCRYPT" == "true" ]]; then
    echo "Would encrypt archive and recommend storing passphrase securely (password manager / offline safe)"
  fi
  exit 0
fi

# Require BACKUP_DB_URL for real runs
if [[ -z "${BACKUP_DB_URL-}" ]]; then
  echo "ERROR: BACKUP_DB_URL environment variable must be set for real backups." >&2
  echo "Example (do not commit):" >&2
  echo "  export BACKUP_DB_URL='postgres://user:password@host:5432/postgres'" >&2
  exit 2
fi

# Try to capture repo metadata for manifest (best-effort)
GIT_REPO=""
GIT_COMMIT=""
if command -v git >/dev/null 2>&1; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_REPO=$(git config --get remote.origin.url || true)
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || true)
  fi
fi
# Normalize repo identifier if present
if [[ -n "$GIT_REPO" ]]; then
  # strip .git suffix and convert to owner/repo form when possible
  GIT_REPO=$(echo "$GIT_REPO" | sed -E 's/\.git$//' | sed -E 's#.*[:/](.+/.+)$#\1#')
fi

# Run pg_dump
echo "Creating Postgres custom-format dump..."
pg_dump -Fc --no-owner --no-acl -f "$DUMP_FILE" "$BACKUP_DB_URL"

# Export tables as CSV using COPY for portability
echo "Exporting individual table CSVs..."
for t in "${TABLES[@]}"; do
  OUT_CSV="$CSV_DIR/$t-$TS.csv"
  echo "  - $t -> $OUT_CSV"
  psql "$BACKUP_DB_URL" -c "COPY (SELECT * FROM \"$t\" ORDER BY created_at NULLS FIRST) TO STDOUT WITH (FORMAT csv, HEADER)" > "$OUT_CSV"
done

# Row counts
echo "Collecting row counts..."
declare -A COUNTS
for t in "${TABLES[@]}"; do
  cnt=$(psql "$BACKUP_DB_URL" -t -c "SELECT COUNT(*) FROM \"$t\";" | tr -d '[:space:]')
  COUNTS[$t]=$cnt
done

# Build a valid manifest with table counts and an initially empty payload-file list.
TABLES_JSON='{}'
for t in "${TABLES[@]}"; do
  TABLES_JSON=$(jq --arg table "$t" --argjson count "${COUNTS[$t]}" '. + {($table): $count}' <<<"$TABLES_JSON")
done

jq -n \
  --arg backup_name "$BACKUP_NAME" \
  --arg created_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg maxos_repo "$GIT_REPO" \
  --arg maxos_commit "$GIT_COMMIT" \
  --arg tool_version "$TOOL_VERSION" \
  --argjson tables "$TABLES_JSON" \
  '{backup_name: $backup_name, created_at: $created_at, maxos_repo: $maxos_repo, maxos_commit: $maxos_commit, tool_version: $tool_version, tables: $tables, files: []}' \
  > "$MANIFEST_JSON"

jq empty "$MANIFEST_JSON"

# Compute payload checksums first. The manifest describes payload files only, avoiding circular self-checksums.
pushd "$BACKUP_DIR" >/dev/null
echo "Computing payload checksums..."
PAYLOAD_SHA=".payload.sha256"
: > "$PAYLOAD_SHA"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  "${SHA_CMD[@]}" "$f" >> "$PAYLOAD_SHA"
done < <(find . -type f ! -name 'manifest.json' ! -name 'manifest.sha256' ! -name '.payload.sha256' -print | sed 's#^\./##' | LC_ALL=C sort)

FILES_JSON='[]'
while read -r checksum file; do
  [[ -z "${checksum:-}" || -z "${file:-}" ]] && continue
  size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file")
  FILES_JSON=$(jq \
    --arg path "$file" \
    --argjson size "$size" \
    --arg sha256 "$checksum" \
    '. + [{path: $path, size: $size, sha256: $sha256}]' \
    <<<"$FILES_JSON")
done < "$PAYLOAD_SHA"

# Finalize manifest.json before generating the verification checksum file.
jq --argjson files "$FILES_JSON" '.files = $files' "$MANIFEST_JSON" > "${MANIFEST_JSON}.tmp"
mv "${MANIFEST_JSON}.tmp" "$MANIFEST_JSON"
jq empty "$MANIFEST_JSON"

# Generate final checksums for every backup file except manifest.sha256 itself and the temporary payload list.
: > "$MANIFEST_SHA"
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  "${SHA_CMD[@]}" "$f" >> "$MANIFEST_SHA"
done < <(find . -type f ! -name 'manifest.sha256' ! -name '.payload.sha256' -print | sed 's#^\./##' | LC_ALL=C sort)

rm -f "$PAYLOAD_SHA"
popd >/dev/null

# Optionally encrypt everything into a single tar.gz.gpg
ARCHIVE="$OUTDIR/${BACKUP_NAME}.tar.gz"
ARCHIVE_GPG="$OUTDIR/${BACKUP_NAME}.tar.gz.gpg"

echo "Creating compressed archive..."
tar -C "$OUTDIR" -czf "$ARCHIVE" "$BACKUP_NAME"

if [[ "$ENCRYPT" == "true" ]]; then
  echo "Encrypting archive with GPG (symmetric AES256). You will be prompted for a passphrase."
  gpg --batch --yes --symmetric --cipher-algo AES256 --output "$ARCHIVE_GPG" "$ARCHIVE"
  rm -f "$ARCHIVE"
  echo "Backup encrypted: $ARCHIVE_GPG"
  FINAL_PATH="$ARCHIVE_GPG"
else
  echo "Backup archive created (unencrypted): $ARCHIVE"
  FINAL_PATH="$ARCHIVE"
fi

# Verify archive integrity by listing dump (if unencrypted, or by decrypting temporarily if encrypted)
echo "Verifying backup integrity..."
if [[ "$ENCRYPT" == "true" ]]; then
  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT
  echo "Decrypting archive to temporary location for verification..."
  gpg --batch --yes --output "$TMP_DIR/${BACKUP_NAME}.tar.gz" --decrypt "$FINAL_PATH"
  tar -C "$TMP_DIR" -xzf "$TMP_DIR/${BACKUP_NAME}.tar.gz"
  if ! pg_restore --list "$TMP_DIR/$BACKUP_NAME/${BACKUP_NAME}.dump" >/dev/null 2>&1; then
    echo "ERROR: pg_restore cannot read dump in decrypted archive" >&2
    exit 2
  fi
else
  if ! pg_restore --list "$BACKUP_DIR/${BACKUP_NAME}.dump" >/dev/null 2>&1; then
    echo "ERROR: pg_restore cannot read dump" >&2
    exit 2
  fi
fi

# Human-friendly summary
printf '\nMax OS backup created\n'
echo "Five application tables included: ${TABLES[*]}"
if [[ "$ENCRYPT" == "true" ]]; then
  echo "Backup encrypted (AES256): $FINAL_PATH"
else
  echo "Backup archive: $FINAL_PATH"
fi
echo "Integrity verification passed"
echo "Manifest: $MANIFEST_JSON"

echo "Next steps: upload the encrypted file to your secure off-platform storage (S3, B2, or encrypted external drive)."

exit 0
