# Max OS Current State

_Last updated: 2026-07-28_

This file is the lightweight handoff for the next engineering or AI session.

## Current runtime

- Backend/runtime: Supabase
- Database: Supabase Postgres
- Frontend: `app` Supabase Edge Function
- Owner access: one owner key checked directly by `api` / `chat`
- AI provider: Groq through a thin `callAI()` function
- Current AI model: `llama-3.3-70b-versatile`

## Edge Functions

All functions are ACTIVE:

- `app` — V4
- `auth` — V4, legacy endpoint retired from active use
- `api` — V5
- `chat` — V5

`verify_jwt = false` remains intentional. V1 does not use Supabase Auth JWTs; `api` and `chat` enforce the single-owner key in application code.

## Simplified owner gate

The previous passphrase → auth function → signed 30-day session → `SESSION_SECRET` design was retired on 2026-07-28.

Current flow:

1. Max enters the owner key.
2. The browser stores it locally on Max's device.
3. `api` / `chat` requests send it as `x-maxos-key`.
4. The Edge Function compares it with the server-side `APP_PASSPHRASE` secret.
5. Invalid keys receive `401 Unauthorized`.

`SESSION_SECRET` is no longer required.

The `auth` Edge Function remains deployed only so stale clients receive HTTP 410 and know to reload.

## Database

Tables:

- `conversations`
- `messages`
- `journal_entries`
- `knowledge_items`
- `knowledge_suggestions`

Security state:

- RLS enabled on all five tables.
- No direct browser RLS policies.
- Direct SQL privileges for `anon` and `authenticated` have been revoked; verified count = **0**.
- Server-side Edge Functions use the service-role key after the owner-key gate.

Migration history now includes:

- `20260728005556 max_os_core_schema`
- `20260728023432 decouple_from_supabase_auth`
- `20260728203414 lock_down_direct_table_grants`

## Work audit response / simplification decision

A read-only ChatGPT Work pressure test correctly identified that the prior custom session design was oversized for a one-user V1.

Decision:

- Do **not** remove the front-door gate entirely.
- Do remove unnecessary session machinery.
- Keep one owner key because public Edge Function URLs can still receive automated internet traffic even if Max OS is obscure.
- Make the database boundary stronger instead: no direct client table grants.

## Other fixes currently in GitHub / runtime

- Knowledge review field mismatch fixed (`content` / `reviewed_at`).
- Knowledge approval avoids inserting an exact duplicate permanent item on repeated approval attempts.
- Frontend over-escaped inline handlers were replaced with normal event handling.
- Chat selects the latest 30 messages and then restores chronological order before sending context to the model.
- Missing critical runtime configuration fails closed.
- Original migration history and deployed source are versioned in GitHub.
- `skills/max-os-maintainer/SKILL.md` defines the maintenance protocol for future AI agents.

## Secrets

Custom runtime secrets actually needed by V1:

- `APP_PASSPHRASE` — legacy name; functions as the one owner key.
- `GROQ_API_KEY`

Supabase server environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`SESSION_SECRET` is retired and can be removed from the project later.

Never commit or paste secret values into GitHub, Notion, or AI chat.

## Biggest remaining continuity risk

**Live Supabase data does not yet have a verified off-platform backup/restore process.**

GitHub can reconstruct code and schema, but conversations, messages, journal entries, and live knowledge could still be lost if the Supabase project/data were destroyed.

This is more important for long-term Max OS durability than adding more authentication layers.

## Still unresolved

- Confirm the owner key you intend to use is set as `APP_PASSPHRASE` and is unique to Max OS.
- Confirm/rotate `GROQ_API_KEY` if its value was ever exposed in chat.
- End-to-end test: owner key → home → Lola chat → journal → search → knowledge review.
- Establish and test an off-platform live-data backup/restore process.
- GitHub repository is temporarily public for setup/debugging and should be returned to private after the current integration work is complete.

## Claude resumption rule

Claude's earlier session is stale. It must **not** continue the three-secret/session task it was doing.

When Claude returns, it must first:

1. Read this file.
2. Read `skills/max-os-maintainer/SKILL.md`.
3. Review current GitHub code.
4. Inspect live Supabase functions/schema.
5. Treat `SESSION_SECRET` / signed-session work as intentionally retired.

## Next engineering priority

**Use and verify V1, then build backup continuity.**

Do not add multi-user authentication or speculative modules unless a real use case appears.
