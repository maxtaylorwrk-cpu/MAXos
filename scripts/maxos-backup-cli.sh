#!/usr/bin/env bash
set -euo pipefail

# scripts/maxos-backup-cli.sh
# Small beginner-friendly CLI wrapper for backup operations.
# Usage: ./maxos-backup-cli.sh <command> [args]

prog="maxos-backup-cli"

usage(){
  cat <<EOF
Usage: $prog <command> [args]

Commands:
  create --outdir DIR [--encrypt]    Create a timestamped backup (prompts for passphrase if encrypt)
  verify PATH                        Verify a backup archive or directory
  restore-test PATH [--no-docker]    Perform a safe test restore into a disposable local DB (Docker)
  doctor                              Run a local health check (doctor)
  help                                Show this help

Examples:
  BACKUP_DB_URL=postgres://user:pass@host:5432/postgres ./scripts/maxos-backup-cli.sh create --outdir ~/maxos-backups --encrypt
  ./scripts/maxos-backup-cli.sh verify ~/maxos-backups/maxos-20260729T120000Z.tar.gz.gpg
  ./scripts/maxos-backup-cli.sh restore-test ~/maxos-backups/maxos-20260729T120000Z.tar.gz.gpg
EOF
}

if [[ ${1-} == "" ]]; then
  usage; exit 0
fi

cmd="$1"; shift
case "$cmd" in
  create)
    # forward all args to maxos-backup.sh
    ./scripts/backup/maxos-backup.sh "$@"
    ;;
  verify)
    if [[ ${1-} == "" ]]; then
      echo "ERROR: verify requires a path to the archive or backup directory" >&2; exit 2
    fi
    ./scripts/backup/maxos-verify.sh "$1"
    ;;
  restore-test)
    if [[ ${1-} == "" ]]; then
      echo "ERROR: restore-test requires a path to the backup archive" >&2; exit 2
    fi
    ./scripts/restore/maxos-restore-test.sh "$@"
    ;;
  doctor)
    ./scripts/doctor/maxos-doctor.sh
    ;;
  help|-h|--help)
    usage; exit 0
    ;;
  *)
    echo "Unknown command: $cmd" >&2; usage; exit 2
    ;;
esac
