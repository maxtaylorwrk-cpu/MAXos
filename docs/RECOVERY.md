# RECOVERY

This document describes how to rebuild Max OS if Supabase, GitHub, the AI provider, or the frontend deployment changes or is lost.

## 1. Restore source

- Clone/download this GitHub repository.
- Read `docs/CURRENT_STATE.md` before deploying anything.
- Read `skills/max-os-maintainer/SKILL.md` so stale AI context does not overwrite newer state.

## 2. Create/connect Supabase

- Create a Supabase project or choose a recovery project.
- Confirm the project exposes the normal server environment values used by Edge Functions.

## 3. Apply migrations

Apply the committed SQL migrations under `supabase/migrations/` in version order.

The current production migration history is documented in `docs/CURRENT_STATE.md`.

After migration:

- verify the five application tables exist;
- verify RLS is enabled;
- verify direct `anon` / `authenticated` table grants are absent.

## 4. Configure runtime secrets

Custom secrets needed by simplified V1:

- `APP_PASSPHRASE` — the one-user owner key (legacy environment name).
- `GROQ_API_KEY`

Supabase server environment used by Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`SESSION_SECRET` is retired and is not required by current V1.

Never place secret values in GitHub, Notion, tickets, or AI chat.

## 5. Deploy Edge Functions

Deploy from the exact committed source under:

- `supabase/functions/app/index.ts`
- `supabase/functions/api/index.ts`
- `supabase/functions/chat/index.ts`
- `supabase/functions/auth/index.ts` (legacy retirement response only)

Current functions use `verify_jwt = false` intentionally because the application uses its own single-owner key rather than Supabase Auth JWTs.

Do not blindly change this during recovery.

## 6. Verify the owner boundary

Expected behavior:

- App shell is publicly reachable.
- `api` and `chat` reject a missing/wrong `x-maxos-key` with `401`.
- Correct owner key allows application requests.
- Browser never receives the service-role key or Groq key.
- Legacy `auth` endpoint returns a retirement response and is not used by current frontend code.

## 7. End-to-end test

Test in this order:

1. Enter owner key.
2. Home loads.
3. Lola chat returns a response and persists both messages.
4. Journal can create and reload an entry.
5. Search returns expected records.
6. Knowledge review can list and approve/reject a suggestion.
7. Reload the app and confirm the stored owner key still unlocks the same device.
8. Use **Lock** and confirm the local owner key is removed.

## 8. Data restore

Code/schema recovery is not the same as data recovery.

A real long-term recovery process must restore:

- conversations
- messages
- journal entries
- knowledge items
- knowledge suggestions

At the time of this document's update, an off-platform live-data backup process is still an open requirement. Do not claim full disaster recovery until a backup has been created and a restore drill has succeeded.

## 9. Notion continuity

Notion is not a runtime dependency, but it contains human-readable Max OS context and should also have an independent export/backup strategy over time.

## Recovery success standard

Recovery is complete only when a fresh environment can reproduce the working owner-key → database → Lola loop and restore the expected historical data.

A checklist without a demonstrated restore is not proof of recoverability.
