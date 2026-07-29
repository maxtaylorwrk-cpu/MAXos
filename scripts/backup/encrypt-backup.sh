#!/usr/bin/env bash
set -euo pipefail

# scripts/backup/encrypt-backup.sh
# Helper to encrypt an existing backup archive using GPG symmetric AES256.

if [[ ${1-} == "" ]]; then
  echo "Usage: $0 /path/to/archive.tar.gz"
  exit 2
fi
ARCHIVE="$1"
if [[ ! -f "$ARCHIVE" ]]; then
  echo "ERROR: archive not found: $ARCHIVE" >&2
  exit 2
fi

OUT="${ARCHIVE}.gpg"

echo "Encrypting $ARCHIVE -> $OUT using GPG symmetric AES256..."

gpg --batch --yes --symmetric --cipher-algo AES256 --output "$OUT" "$ARCHIVE"

if [[ -f "$OUT" ]]; then
  echo "Encrypted archive created: $OUT"
  echo "Note: store your passphrase in a password manager and/or a secure offline copy. Losing the passphrase will make this backup unrecoverable."
  exit 0
else
  echo "ERROR: encryption failed" >&2
  exit 2
fi
