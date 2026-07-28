# Max OS Current State

_Last updated: 2026-07-28_

This file is a lightweight handoff for the next engineering or AI session. It should answer: what exists, what changed recently, what is unresolved, and what should happen next.

## Current runtime

- Backend/runtime: Supabase
- Database: Supabase Postgres
- Frontend: `app` Supabase Edge Function
- Custom auth: passphrase → signed session token
- AI provider: Groq through a thin `callAI()` function
- Current AI model: `llama-3.3-70b-versatile`

## Edge Functions

All four functions are ACTIVE and currently on V3:

- `app` — V3 frontend deployed on 2026-07-28
- `api` — V3 deployed on 2026-07-28
- `auth` — V3 deployed on 2026-07-28
- `chat` — V3 deployed on 2026-07-28

All four intentionally use `verify_jwt = false` because V1 uses custom application authentication rather than Supabase Auth JWTs. This requirement is versioned in `supabase/config.toml`.

## Database

Tables:
- `conversations`
- `messages`
- `journal_entries`
- `knowledge_items`
- `knowledge_suggestions`

All five tables have RLS enabled. V1 intentionally has no anon/authenticated RLS policies; server-side Edge Functions use the service-role key.

Permanent knowledge currently includes the Lola continuity documents plus a durable `Source of Truth & Recovery Policy` describing GitHub/Supabase/Notion responsibilities.

## Fixes completed on 2026-07-28

1. **Knowledge review field mismatch fixed**
   - Deployed API expected `proposed_content` / `resolved_at`.
   - Actual database uses `content` / `reviewed_at`.
   - API V3 now matches the real schema.

2. **Frontend inline-handler escaping removed**
   - The prior app generated fragile over-escaped inline `onclick` handlers.
   - App V3 uses DOM event listeners and data attributes instead.
   - JavaScript syntax was checked before deployment.

3. **GitHub recovery layer established**
   - Live `auth`, original `api`, and `chat` sources were captured from Supabase before repairs.
   - Corrected deployable source is now versioned.
   - Original database migration history is versioned.
   - `supabase/config.toml` records the custom-auth deployment requirement.

4. **Functions now fail closed on missing custom configuration**
   - `auth` returns a generic configuration error instead of attempting to operate without `APP_PASSPHRASE` or `SESSION_SECRET`.
   - `chat` returns a generic configuration error instead of attempting to operate without its required server-side configuration, including `GROQ_API_KEY`.
   - No secret values are exposed by these checks.

## Secrets

Custom runtime secret names:
- `GROQ_API_KEY`
- `APP_PASSPHRASE`
- `SESSION_SECRET`

Supabase-hosted defaults used server-side:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit secret values.

### Security follow-up

The custom secret values were previously handled in an AI chat while setup was in progress. Treat any secret value that appeared in chat as compromised and rotate it before considering V1 secure.

The connector can manage Edge Function code and database state but does not expose secret-management actions, so custom secret values still require the Supabase dashboard/CLI secret flow.

## Supabase advisor state

Security advisor:
- Only informational `RLS enabled, no policy` notices are present for the five V1 tables. This is expected under the deliberate deny-by-default + service-role server architecture.

Performance advisor:
- Two informational unindexed-foreign-key notices exist on `source_conversation_id` fields.
- Existing indexes are currently reported unused because the application has almost no runtime data yet.
- No performance migration was added; V1 should earn optimizations through real usage.

## Still unresolved

- Verify all three custom Edge Function secrets are present and rotate any values previously exposed in chat.
- End-to-end test: login → home → chat → journal → search → knowledge review.
- Decide whether to harden the custom session design before wider use.
- GitHub repository is temporarily public for setup/debugging and should be returned to private after the current integration work is complete.

## Next engineering priority

**Finish and verify V1 before adding new modules.**

The next session should test the deployed application end to end and only fix failures that can be reproduced. Do not expand the architecture until the core loop works reliably.
