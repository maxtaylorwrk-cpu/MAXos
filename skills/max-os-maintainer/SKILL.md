# Max OS Maintainer Skill

Use this protocol for any engineering or infrastructure work on Max OS.

## Mission

Keep Max OS simple, recoverable, and aligned with its one-user V1 purpose. Preserve working behavior before expanding architecture.

## Source-of-truth order

1. **GitHub** — deployable code, migrations, config, recovery docs.
2. **Supabase** — live runtime and live application data.
3. **Notion** — human-readable architecture, philosophy, handoffs, and decisions.
4. **AI chat context** — useful context only; never treat stale chat memory as authoritative over live systems.

## Before changing anything

1. Read `docs/CURRENT_STATE.md`.
2. Inspect the current GitHub files you intend to change.
3. Inspect the corresponding live Supabase function/schema state.
4. If another AI/agent previously worked on the same area, assume its context may be stale until verified.
5. Preserve or record the current working state before destructive changes.

## V1 architecture rules

- Max OS is single-owner.
- Do not add multi-user auth, organizations, roles, OAuth, MFA, or account-management systems unless Max explicitly decides V1 needs them.
- Current owner gate: one owner key sent to server-side `api` / `chat` functions.
- `SESSION_SECRET` and signed application sessions are retired in simplified V1.
- Browser code must never receive `SUPABASE_SERVICE_ROLE_KEY` or `GROQ_API_KEY`.
- Direct `anon` and `authenticated` grants on application tables should remain revoked.
- RLS remains enabled on application tables as defense in depth.
- `verify_jwt = false` is intentional for these custom-gated Edge Functions; do not toggle it blindly.

## Secrets

Never paste, commit, log, or mirror secret values into GitHub, Notion, issues, comments, or AI chat.

Required custom runtime secret names:
- `APP_PASSPHRASE` — used as the one-user owner key in V1.
- `GROQ_API_KEY` — AI provider credential.

Supabase-provided server values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If a secret value is suspected to have been exposed, rotate it through Supabase rather than copying it into a work log.

## Change workflow

1. Make the smallest change that solves a verified problem.
2. Commit source to GitHub.
3. Deploy the exact committed source to Supabase.
4. Verify function status and relevant database state.
5. Re-run Supabase security/performance advisors after schema/security changes.
6. Update `docs/CURRENT_STATE.md`.
7. Update Notion handoff / Knowledge Sync when the change is materially important.
8. Do not add speculative abstractions after completing the requested fix.

## Verification standard

A change is not complete because deployment returned success. Verify the resulting state with the strongest available evidence: function metadata, database queries, logs, application behavior, or an end-to-end test.

If a step cannot be verified, mark it explicitly rather than assuming success.

## Recovery principle

The system should be reconstructable from GitHub + Supabase backups + human-readable Notion context without depending on one AI vendor or one conversation history.

## Stale-agent rule

If Claude, Copilot, ChatGPT Work, Lola, or another agent returns after another agent changed the system, the returning agent must re-read current GitHub/Supabase/Notion state before continuing an unfinished task.

## Product principle

**Exist. Ship. Learn.**

V1 should earn complexity through real use. Do not solve hypothetical future problems at the expense of a working personal system today.
