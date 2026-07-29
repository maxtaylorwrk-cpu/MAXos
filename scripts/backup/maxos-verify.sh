#!/usr/bin/env bash
set -euo pipefail

# scripts/backup/maxos-verify.sh
# Verify a Max OS backup archive or directory. Plain-language outputs.

PROG="maxos-verify"

usage(){
  cat <<EOF
Usage: $PROG /path/to/maxos-YYYYmmddTHHMMSSZ.tar.gz[.gpg] or /path/to/backupdir

If the archive is encrypted (.gpg), you will be prompted for the GPG passphrase to decrypt temporarily.

EOF
}

if [[ ${1-} == "" ]]; then
  usage; exit 2
fi
TARGET="$1"

# helper: error
err(){ echo "ERROR: $*" >&2; exit 2 }

# locate scripts dir
SCRIPTDIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# basic checks
if [[ ! -e "$TARGET" ]]; then
  err "Target does not exist: $TARGET"
fi

# decide whether target is archive or directory
TMPDIR=""
CLEAN_TMP=false
if [[ "$TARGET" == *.gpg ]]; then
  # encrypted archive: decrypt to temp
  TMPDIR=$(mktemp -d)
  CLEAN_TMP=true
  echo "Decrypting archive for verification into temporary directory..."
  gpg --batch --yes --output "$TMPDIR/archive.tar.gz" --decrypt "$TARGET" || err "GPG decryption failed"
  tar -C "$TMPDIR" -xzf "$TMPDIR/archive.tar.gz" || err "Failed to extract decrypted archive"
  BACKUP_DIR=$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d | head -n1)
elif [[ -f "$TARGET" ]]; then
  # unencrypted tar.gz
  TMPDIR=$(mktemp -d)
  CLEAN_TMP=true
  tar -C "$TMPDIR" -xzf "$TARGET" || err "Failed to extract archive"
  BACKUP_DIR=$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d | head -n1)
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

# Verify checksums listed in manifest.sha256
echo "Verifying SHA256 checksums..."
pushd "$BACKUP_DIR" >/dev/null
# Use sha256sum or shasum
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
DUMP_FILE=$(find "$BACKUP_DIR" -type f -name "*.dump" | head -n1)
if [[ -z "$DUMP_FILE" ]]; then
  err "No .dump file found in backup"
fi

if ! pg_restore --list "$DUMP_FILE" >/dev/null 2>&1; then
  err "pg_restore could not read the dump file (it may be corrupted)"
fi

echo "pg_restore can read the dump file"

# Optionally report simple manifest summary
if command -v jq >/dev/null 2>&1; then
  echo "Manifest summary:"
  jq '{backup_name: .backup_name, created_at: .created_at, tables: .tables}' "$MANIFEST_JSON"
fi

# Cleanup
if [[ "$CLEAN_TMP" == true && -n "$TMPDIR" ]]; then
  rm -rf "$TMPDIR"
fi

echo "Integrity verification passed"

# Ensure script ends cleanly
: # noop

echo "Verification complete: backup appears consistent and readable."
exit 0
