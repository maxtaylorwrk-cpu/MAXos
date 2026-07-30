#!/usr/bin/env bash
set -euo pipefail

# scripts/common/env-validate.sh
# Validate required commands and environment variables for Max OS backup/restore scripts.

prog_name="env-validate"

# Helper: print an error and exit
err() {
  echo "ERROR: $*" >&2
  exit 2
}

# Check for a command or suggest install
check_cmd() {
  local cmd="$1"; shift
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    case "$cmd" in
      pg_dump|pg_restore|psql)
        echo "  -> On macOS: brew install postgresql"
        echo "  -> On Debian/Ubuntu: sudo apt-get install postgresql-client"
        ;;
      gpg)
        echo "  -> On macOS: brew install gpg"
        echo "  -> On Debian/Ubuntu: sudo apt-get install gnupg"
        ;;
      sha256sum)
        echo "  -> On macOS: shasum -a 256 is available by default"
        ;;
      jq)
        echo "  -> On macOS: brew install jq"
        echo "  -> On Debian/Ubuntu: sudo apt-get install jq"
        ;;
    esac
    err "Please install $cmd and re-run the script."
  fi
}

# macOS sha256 tool detection
detect_sha_cmd() {
  if command -v sha256sum >/dev/null 2>&1; then
    echo "sha256sum"
  elif command -v shasum >/dev/null 2>&1; then
    echo "shasum -a 256"
  else
    echo "sha256sum"
  fi
}

# Required commands
REQUIRED_CMDS=(pg_dump pg_restore psql gpg jq)
for c in "${REQUIRED_CMDS[@]}"; do
  check_cmd "$c"
done

# sha256 helper (shasum exists on macOS)
SHA_CMD=$(detect_sha_cmd)
if ! command -v ${SHA_CMD%% *} >/dev/null 2>&1; then
  echo "Warning: neither sha256sum nor shasum found. Checksums will fail."
fi

# Check for optional env vars (BACKUP_DB_URL is validated in scripts)
# Nothing sensitive printed here; only presence validated when needed.

echo "Environment validation passed. Required commands available: pg_dump, pg_restore, psql, gpg, jq, $SHA_CMD"
