# Max OS

Max OS is a one-user personal operating system and long-term personal archive for Max. It is designed to preserve identity, decisions, durable knowledge, projects, reflections, and continuity across changing tools and AI platforms.

This repository is the technical source of truth for Max OS code, migrations, recovery instructions, and deployable configuration.

## Principles

- **Exist. Ship. Learn.** Get V1 working reliably before expanding features.
- Preserve what exists. Do not over-engineer or prematurely optimize.
- Technology should help Max become more, not merely do more.
- V1 should earn complexity through real use.

## What Max OS is today

- A single-owner personal app running on Supabase.
- Lola is the AI thinking-partner layer.
- The frontend is served by the `app` Supabase Edge Function.
- `api` and `chat` are server-side Edge Functions using the Supabase service role.
- V1 uses one owner key rather than a multi-user authentication system.
- The owner key is sent only to the server-side API/chat gate; `SESSION_SECRET` and signed application sessions are retired.
- The AI chat layer currently uses Groq / `llama-3.3-70b-versatile` through a deliberately thin `callAI()` function.

## Current V1 architecture

```text
User
  ↓
app Edge Function (public shell)
  ↓ owner key
api / chat Edge Functions
  ↓ server-only service role
Supabase Postgres
  ↓
AI provider via callAI()
```

The legacy `auth` function remains deployed only so stale clients receive a clear retirement response. New clients do not use it.

## Database boundaries

Application tables:

- `knowledge_items`
- `knowledge_suggestions`
- `conversations`
- `messages`
- `journal_entries`

All five have RLS enabled. Direct table privileges for `anon` and `authenticated` are revoked. Browser clients do not access these tables directly; server-side Edge Functions use `SUPABASE_SERVICE_ROLE_KEY`.

## Secrets

Never commit secret values.

Custom runtime secrets:

- `APP_PASSPHRASE` — legacy environment name; used as the single owner key in V1.
- `GROQ_API_KEY`

Supabase server environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`SESSION_SECRET` is no longer used by V1.

## Source-of-truth split

- **GitHub** — code, migrations, configuration, recovery documentation.
- **Supabase** — live runtime and live application data.
- **Notion** — human-readable philosophy, architecture, decisions, and continuity.

## Current priority

Finish and verify the core loop before adding modules:

`owner key → home → Lola chat → journal → search → knowledge review`

The largest continuity gap still open is a verified off-platform backup of live Supabase data. Code and schema are recoverable from GitHub; conversations, messages, journals, and operational knowledge still need a durable backup process.

## Maintenance protocol

Future agents should read:

- `docs/CURRENT_STATE.md`
- `skills/max-os-maintainer/SKILL.md`

before changing the system.

## Privacy

The repository is temporarily public during setup/debugging. It is intended to be returned to **private** after the current integration work is complete. No secret values belong in Git regardless of repository visibility.
