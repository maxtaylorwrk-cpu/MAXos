# PR_DESCRIPTION.md

feat(backup): off-platform backup & verification tooling

Summary:
- Adds scripts to create, verify, encrypt, and test-restore backups for Max OS. Includes a small CLI wrapper and a doctor health-check.
- Adds synthetic fixtures and integration tests that validate round-trip backup -> verify -> restore-test using ephemeral Postgres containers.
- Adds a CI validation workflow that runs syntax checks and the integration test on the branch backup/implement-offplatform-backup.

Tests:
- tests/test_shell_syntax.sh (bash -n checks and doctor smoke test)
- tests/test_backup_and_restore_local.sh (end-to-end integration using Docker)

Security notes:
- Scripts do not print secrets or connection strings. Encryption is symmetric GPG (AES256). Owners must store passphrases in a password manager and an offline physical copy.

Owner live-verification checklist:
- Run the doctor
- Create an encrypted backup locally (export BACKUP_DB_URL before running)
- Run verify on the produced archive
- Run restore-test locally and confirm row counts and sample content
- Upload encrypted archive to your chosen off-platform storage and confirm upload

