# MAXos repository instructions

This repository contains MAXos, a single-owner personal operating system and long-term personal archive. Backup/recovery tooling is one subsystem, not the whole repository.

Before making broad changes, read:

- `docs/CURRENT_STATE.md`
- `skills/max-os-maintainer/SKILL.md`
- `README.md`

Key rules for automated agents and maintainers:

- Preserve the current single-owner V1 architecture unless an explicit task changes it.
- Do not resurrect `SESSION_SECRET`, signed app sessions, multi-user auth, or Supabase Auth without a real approved requirement.
- Do not print, commit, or paste secrets.
- Browser clients do not directly access application tables; server-side functions use the Supabase service role after the owner-key gate.
- CI and tests must use synthetic fixtures and ephemeral/local databases only; never production credentials or production data.
- `scripts/restore/maxos-restore-test.sh` is local/test-only and must not restore to remote or production databases.
- When changing backup/recovery logic, update or run the relevant shell and integration tests.
- Treat GitHub as code/config/recovery source of truth, Supabase as live runtime/data source of truth, and Notion as human-readable philosophy/continuity context.
- Keep changes scoped to the user's request; do not rewrite unrelated architecture or continuity documentation.
