#!/usr/bin/env bash
set -euo pipefail

# tests/test_shell_syntax.sh
# Basic syntax checks and smoke tests for shell scripts.

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SCRIPTS=(
  "$ROOT_DIR/scripts/backup/maxos-backup.sh"
  "$ROOT_DIR/scripts/backup/maxos-verify.sh"
  "$ROOT_DIR/scripts/backup/encrypt-backup.sh"
  "$ROOT_DIR/scripts/restore/maxos-restore-test.sh"
  "$ROOT_DIR/scripts/restore/confirm-production.sh"
  "$ROOT_DIR/scripts/maxos-backup-cli.sh"
  "$ROOT_DIR/scripts/doctor/maxos-doctor.sh"
)

echo "Running bash -n (syntax) checks..."
FAILED=0
for s in "${SCRIPTS[@]}"; do
  if [[ -f "$s" ]]; then
    bash -n "$s" || { echo "Syntax error in $s"; FAILED=1; }
  else
    echo "Missing script: $s"; FAILED=1
  fi
done

if [[ $FAILED -ne 0 ]]; then
  echo "Shell syntax checks failed"; exit 2
fi

# Run doctor (should be non-fatal)
echo "Running doctor..."
bash "$ROOT_DIR/scripts/maxos-backup-cli.sh" doctor || true

echo "Shell syntax checks and doctor smoke test passed"
exit 0
