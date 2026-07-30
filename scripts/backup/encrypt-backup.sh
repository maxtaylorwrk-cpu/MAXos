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
if [[ -n "${BACKUP_ENCRYPTION_PASSPHRASE-}" ]]; then
  printf '%s' "$BACKUP_ENCRYPTION_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback --passphrase-fd 0 --symmetric --cipher-algo AES256 --output "$OUT" "$ARCHIVE"
else
  echo "GPG will prompt securely for a passphrase."
  gpg --yes --symmetric --cipher-algo AES256 --output "$OUT" "$ARCHIVE"
fi

if [[ -f "$OUT" ]]; then
  echo "Encrypted archive created: $OUT"
  echo "Store the passphrase in a password manager and/or a secure offline copy. Losing it makes this backup unrecoverable."
  exit 0
else
  echo "ERROR: encryption failed" >&2
  exit 2
fi
