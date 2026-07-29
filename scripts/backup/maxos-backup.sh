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

# Create manifest.json (include metadata for traceability)
cat > "$MANIFEST_JSON" <<EOF
{
  "backup_name": "$BACKUP_NAME",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "maxos_repo": "${GIT_REPO}",
  "maxos_commit": "${GIT_COMMIT}",
  "tool_version": "${TOOL_VERSION}",
  "tables": {
$(for t in "${TABLES[@]}"; do echo "    \"$t\": ${COUNTS[$t]},"; done)
  },
  "files": []
}
EOF

# Compute checksums for all files and append to manifest.sha256
pushd "$BACKUP_DIR" >/dev/null
echo "Computing checksums..."
# ensure manifest.sha256 is created empty
> "$MANIFEST_SHA"
for f in *; do
  if [[ -f "$f" ]]; then
    $SHA_CMD "$f" >> "$MANIFEST_SHA"
  fi
done

# Add file info to manifest.json with sizes and checksum
# We'll build a JSON array fragment
FILES_JSON=""
while read -r line; do
  checksum=$(echo "$line" | awk '{print $1}')
  file=$(echo "$line" | awk '{print $2}')
  size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file")
  FILES_JSON+="    {\"path\": \"$file\", \"size\": $size, \"sha256\": \"$checksum\"},\\n"
done < "$MANIFEST_SHA"
# remove trailing comma
FILES_JSON=$(echo -e "$FILES_JSON" | sed '$s/,$//')

# Inject files array into manifest.json (naive but acceptable for small number of files)
python3 - <<PY >/dev/null 2>&1 || true
import json,sys
m=json.load(open('$MANIFEST_JSON'))
files=[]
for line in open('$MANIFEST_SHA').read().strip().splitlines():
    parts=line.split()
    if not parts: continue
    sha=parts[0]
    name=parts[1]
    import os
    size=os.path.getsize(name)
    files.append({'path':name,'size':size,'sha256':sha})
m['files']=files
json.dump(m,open('$MANIFEST_JSON','w'),indent=2)
PY

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
echo "\nMax OS backup created"
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
