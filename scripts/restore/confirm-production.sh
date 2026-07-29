#!/usr/bin/env bash
set -euo pipefail

# scripts/restore/confirm-production.sh
# Interactive guard: require exact typed confirmation to proceed with production-like targets.

usage(){
  cat <<EOF
Usage: $0
This script reads an exact confirmation phrase from stdin and exits non-zero if it does not match.
EOF
}

CONFIRM_PHRASE="I UNDERSTAND THIS WILL AFFECT PRODUCTION"

echo "To proceed you must type the exact confirmation phrase (case-sensitive):"
echo
echo "  ${CONFIRM_PHRASE}"
echo
read -r input
if [[ "$input" != "$CONFIRM_PHRASE" ]]; then
  echo "Confirmation did not match. Aborting." >&2
  exit 2
fi

echo "Confirmation accepted. Proceeding with caution..."
exit 0
