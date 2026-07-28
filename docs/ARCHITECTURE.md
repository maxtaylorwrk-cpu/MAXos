# ARCHITECTURE (V1)

This document describes the current V1 architecture for Max OS and the source-of-truth boundaries in the system.

## Runtime flow

```text
User
  ↓
Frontend / `app` Edge Function
  ↓ one owner key
`api` / `chat` Edge Functions
  ↓ server-only service role
Supabase Postgres
  ↓
AI provider via thin `callAI()` function
```

The legacy `auth` Edge Function is retired from the active request path. It remains deployed only to return a clear retirement response to stale clients.

## Source-of-truth boundaries

- **GitHub** — technical source of truth for code, database migrations, recovery instructions, and deployable configuration.
- **Supabase** — live runtime and live application-data source of truth.
- **Notion** — human-editable documentation, philosophy, planning, architecture explanations, and long-term context. It is not a runtime dependency.
- **AI providers** — replaceable inference engines. No provider owns Max OS identity or data.

## V1 owner model

Max OS is deliberately single-owner.

V1 does **not** need multi-user account infrastructure. It therefore avoids OAuth, organizations, roles, MFA flows, Supabase Auth sessions, and custom signed application sessions.

The active gate is intentionally simple:

1. Max enters the owner key in the app.
2. The browser stores it locally on Max's device for convenience.
3. Requests to `api` and `chat` send it in the `x-maxos-key` header.
4. Server-side functions compare it against the `APP_PASSPHRASE` Edge Function secret.
5. A bad or missing key receives `401 Unauthorized`.

`SESSION_SECRET` is retired from V1.

This is not intended as a reusable SaaS authentication system. If Max OS ever becomes multi-user or internet-facing for other people, authentication should be redesigned rather than extending this V1 gate.

## Database layers

### Conversation Layer
- `conversations`
- `messages`
- `journal_entries`

### Knowledge Review Layer
- `knowledge_suggestions`

### Permanent Knowledge Layer
- `knowledge_items`

Promotion flow:

`Conversation → Suggested Knowledge → Human Review → Approval → Permanent Knowledge`

Nothing should automatically become permanent knowledge without explicit approval.

## Security boundary

The important security boundary is server-side data access, not complicated user-management machinery.

- All five application tables have RLS enabled.
- There are zero direct RLS access policies for browser roles.
- Direct table privileges for `anon` and `authenticated` are revoked.
- Browser code never receives `SUPABASE_SERVICE_ROLE_KEY`.
- Server-side `api` / `chat` functions use service-role access only after the owner-key check.
- `GROQ_API_KEY` remains server-only.
- `verify_jwt = false` is intentional because these functions use the custom one-owner gate rather than Supabase Auth JWTs.

## AI layer

The `chat` Edge Function currently calls Groq through a small `callAI()` function using `llama-3.3-70b-versatile`.

Keep the abstraction thin in V1. Provider portability matters, but a large provider framework is unnecessary until changing providers becomes a real need.

## Versioned recovery artifacts

GitHub should contain:

- every deployed Edge Function source file
- `supabase/config.toml`
- database migrations under `supabase/migrations/`
- `.env.example` containing names/placeholders only
- recovery and continuity documentation
- `skills/max-os-maintainer/SKILL.md`

## Known continuity gap

GitHub preserves code and schema, but it does not preserve live Supabase application data. An off-platform backup/restore process for conversations, journals, messages, and knowledge is still required before Max OS can honestly claim long-term durability.

## Deployment principle

**Exist. Ship. Learn.**

Do not over-architect V1. Preserve the working system, fix verified defects, use it, and let real usage determine V2.
