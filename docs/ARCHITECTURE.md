# ARCHITECTURE (V1)

This document describes the current V1 architecture for Max OS and the source-of-truth boundaries in the system.

## Runtime flow

User
  ↓
Frontend / `app` Edge Function
  ↓
`auth` / `api` / `chat` Edge Functions
  ↓
Supabase Postgres
  ↓
AI provider via thin `callAI()` function

## Source-of-truth boundaries

Max OS intentionally has different sources of truth for different kinds of information:

- **GitHub** — technical source of truth for code, database migrations, recovery instructions, and deployable configuration.
- **Supabase** — live runtime and live application-data source of truth. It hosts Edge Functions and Postgres.
- **Notion** — human-editable documentation, philosophy, planning, architecture explanations, and long-term context. It is not an application runtime dependency.
- **AI providers** — replaceable inference engines. No provider owns Max OS identity or data.

This separation is deliberate. Losing or replacing one vendor should not destroy the system.

## Runtime notes

- Supabase acts as both the runtime host for Edge Functions and the Postgres database.
- The `chat` Edge Function calls a thin `callAI()` abstraction to the AI provider (currently Groq / `llama-3.3-70b-versatile`). Keep this abstraction intentionally small in V1.
- Do not introduce an elaborate AI gateway yet. Portability matters, but unused abstractions are technical debt.
- V1 uses a custom passphrase plus signed session token instead of Supabase Auth.
- The Edge Functions therefore use `verify_jwt = false` and enforce the custom session rules in application code.

## Database layers

### Conversation Layer
- `conversations` — conversation-level metadata
- `messages` — chat messages
- `journal_entries` — personal journal entries

### Knowledge Review Layer
- `knowledge_suggestions` — suggested knowledge awaiting explicit review

### Permanent Knowledge Layer
- `knowledge_items` — approved durable knowledge entries

Promotion flow:

Conversation → Suggested Knowledge → Human Review → Approval → Permanent Knowledge

Nothing should automatically become permanent knowledge without explicit approval.

## Security and RLS

- All five application tables have Row Level Security enabled.
- V1 intentionally has **zero RLS policies** for anon/authenticated clients, producing deny-by-default direct database access.
- The service-role key is used only inside server-side Edge Functions and must never be exposed to browser/client code.
- Custom secrets belong in Supabase Edge Function secrets, never in Git.
- The current session design is intentionally lightweight for a single-owner V1 and should receive a dedicated security review before multi-user expansion.

## Versioned recovery artifacts

GitHub should contain:

- every deployed Edge Function source file
- `supabase/config.toml`
- the historical database migrations in `supabase/migrations/`
- `.env.example` containing names/placeholders only
- recovery and continuity documentation

## Deployment principle

**Exist. Ship. Learn.**

Do not over-architect V1. Preserve the working system, fix verified defects, use it, and let real usage determine V2.
