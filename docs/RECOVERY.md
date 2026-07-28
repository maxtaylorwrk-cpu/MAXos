# RECOVERY

This document describes how to rebuild Max OS if important services change or are lost (Supabase, GitHub, AI provider, frontend deployment).

High-level steps

1) Restore code
- Clone or download this GitHub repository.
- If any Supabase Edge Function source files are missing, import the exact deployed function source code into supabase/functions/* — DO NOT reconstruct from memory.

2) Create or connect a Supabase project
- Create a new Supabase project or re-use an existing one.
- Create the Postgres database and configure Edge Functions.

3) Apply database migrations
- Apply committed migration files if present under supabase/migrations/.
- If migration files are not present, restore a SQL schema dump exported from the original project.

4) Deploy Edge Functions
- Deploy each Edge Function from the supabase/functions/* directories.
- Ensure the Edge Function secrets are configured in the Supabase project (see Secrets section below).

5) Configure secrets
- Add required secrets to the Supabase project's secret manager. NEVER store them in Git.
  - GROQ_API_KEY
  - APP_PASSPHRASE
  - SESSION_SECRET
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

6) Verify tables and functions
- Connect to the Supabase DB and verify the presence of key tables: knowledge_items, knowledge_suggestions, conversations, messages, journal_entries.
- Verify RLS policy and that service-role keys are only used server-side.

7) Test auth and API
- Test the custom passphrase/session authentication end-to-end.
- Test API endpoints via the auth and api Edge Functions.

8) Test Lola chat
- Verify chat Edge Function calls callAI() correctly and that the AI provider secrets are set.
- Run a few sample conversations and ensure messages and conversation records persist.

9) Backups and continuity
- Export database schema and data backups to a secure backup location.
- Periodically export Edge Function sources and migration files to this repo to keep the source of truth updated.

Notes and cautions
- DO NOT commit secrets or service keys. If a key is accidentally committed, rotate it immediately.
- Keep an inventory of what was exported versus what remains in Supabase alone.
