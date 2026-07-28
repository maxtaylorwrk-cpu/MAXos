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

- `app` — active, V3 frontend deployed on 2026-07-28
- `api` — active, V3 deployed on 2026-07-28
- `auth` — active, V2
- `chat` — active, V2

## Database

Tables:
- `conversations`
- `messages`
- `journal_entries`
- `knowledge_items`
- `knowledge_suggestions`

All five tables have RLS enabled. V1 intentionally has no anon/authenticated RLS policies; server-side Edge Functions use the service-role key.

## Fixes completed on 2026-07-28

1. **Knowledge review field mismatch fixed**
   - Deployed API expected `proposed_content` / `resolved_at`.
   - Actual database uses `content` / `reviewed_at`.
   - API V3 now matches the real schema.

2. **Frontend inline-handler escaping removed**
   - The prior app generated fragile over-escaped inline `onclick` handlers.
   - App V3 uses normal DOM event listeners / data attributes instead.
   - JavaScript syntax was checked before deployment.

3. **GitHub recovery layer established**
   - Live `auth`, original `api`, and `chat` sources were captured from Supabase.
   - Corrected `api` and `app` sources are now versioned.
   - Original database migration history is versioned.
   - `supabase/config.toml` records the custom-auth `verify_jwt = false` requirement.

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

## Still unresolved

- Verify all three custom Edge Function secrets are present and rotated.
- End-to-end test: login → home → chat → journal → search → knowledge review.
- Decide whether to harden the custom session design before wider use.
- GitHub repository is temporarily public for setup/debugging and should be returned to private after the current integration work is complete.

## Next engineering priority

**Finish and verify V1 before adding new modules.**

The next session should test the deployed application end to end and only fix failures that can be reproduced. Do not expand the architecture until the core loop works reliably.
