#!/usr/bin/env bash
set -euo pipefail

# scripts/backup/maxos-verify.sh
# Verify a Max OS backup archive or directory. Plain-language outputs.

PROG="maxos-verify"

usage() {
  printf '%s\n' \
    "Usage: $PROG /path/to/maxos-YYYYmmddTHHMMSSZ.tar.gz[.gpg] or /path/to/backupdir" \
    "" \
    "If the archive is encrypted (.gpg), GPG will prompt securely unless BACKUP_ENCRYPTION_PASSPHRASE is set." \
    ""
}

if [[ ${1-} == "" ]]; then
  usage; exit 2
fi
TARGET="$1"

TMPDIR=""
CLEAN_TMP=false
cleanup() {
  if [[ "$CLEAN_TMP" == true && -n "$TMPDIR" && -d "$TMPDIR" ]]; then
    rm -rf "$TMPDIR"
  fi
}
trap cleanup EXIT

err(){ echo "ERROR: $*" >&2; exit 2; }

safe_extract_tar() {
  local archive="$1"
  local destination="$2"
  if tar -tzf "$archive" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
    err "Archive contains unsafe absolute or parent-directory paths"
  fi
  tar -C "$destination" -xzf "$archive" || err "Failed to extract archive"
}

# basic checks
if [[ ! -e "$TARGET" ]]; then
  err "Target does not exist: $TARGET"
fi

# decide whether target is archive or directory
if [[ "$TARGET" == *.gpg ]]; then
  TMPDIR=$(mktemp -d)
  CLEAN_TMP=true
  echo "Decrypting archive for verification into temporary directory..."
  if [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE-}" ]]; then
    printf '%s' "$BACKUP_ENCRYPTION_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --output "$TMPDIR/archive.tar.gz" --decrypt "$TARGET" || err "GPG decryption failed"
  else
    gpg --yes --output "$TMPDIR/archive.tar.gz" --decrypt "$TARGET" || err "GPG decryption failed"
  fi
  safe_extract_tar "$TMPDIR/archive.tar.gz" "$TMPDIR"
  BACKUP_DIR=$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d -print -quit)
elif [[ -f "$TARGET" ]]; then
  TMPDIR=$(mktemp -d)
  CLEAN_TMP=true
  safe_extract_tar "$TARGET" "$TMPDIR"
  BACKUP_DIR=$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d -print -quit)
elif [[ -d "$TARGET" ]]; then
  BACKUP_DIR="$TARGET"
else
  err "Unsupported target type. Provide a tar.gz, tar.gz.gpg, or a backup directory."
fi

if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  err "Could not determine backup directory inside archive"
fi

echo "Found backup directory: $BACKUP_DIR"

# Check manifest files
MANIFEST_JSON="$BACKUP_DIR/manifest.json"
MANIFEST_SHA="$BACKUP_DIR/manifest.sha256"
if [[ ! -f "$MANIFEST_JSON" ]]; then
  err "Missing manifest.json in backup"
fi
if [[ ! -f "$MANIFEST_SHA" ]]; then
  err "Missing manifest.sha256 in backup"
fi

# Validate manifest JSON before trusting its summary output.
if command -v jq >/dev/null 2>&1; then
  jq empty "$MANIFEST_JSON" || err "manifest.json is not valid JSON"
fi

# Verify checksums listed in manifest.sha256
echo "Verifying SHA256 checksums..."
pushd "$BACKUP_DIR" >/dev/null
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c "$MANIFEST_SHA" || err "Checksum verification failed"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 -c "$MANIFEST_SHA" || err "Checksum verification failed"
else
  err "No checksum tool available (sha256sum or shasum)"
fi
popd >/dev/null

echo "Checksums OK"

# Attempt to read the dump file with pg_restore --list
DUMP_FILE=$(find "$BACKUP_DIR" -type f -name "*.dump" -print -quit)
if [[ -z "$DUMP_FILE" ]]; then
  err "No .dump file found in backup"
fi

if ! pg_restore --list "$DUMP_FILE" >/dev/null 2>&1; then
  err "pg_restore could not read the dump file (it may be corrupted)"
fi

echo "pg_restore can read the dump file"

if command -v jq >/dev/null 2>&1; then
  echo "Manifest summary:"
  jq '{backup_name: .backup_name, created_at: .created_at, tables: .tables}' "$MANIFEST_JSON"
fi

echo "Integrity verification passed"
echo "Verification complete: backup appears consistent and readable."
exit 0
