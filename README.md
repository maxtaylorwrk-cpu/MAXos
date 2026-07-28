# Max OS

Max OS is a private personal operating system and lifelong personal archive for Max. It is designed to preserve identity, decisions, durable knowledge, projects, reflections, and the continuity of thought across time and changing platforms.

This repository is the technical source of truth for Max OS. It intentionally contains only code and documentation required to: preserve the current Supabase-based implementation, document architecture and philosophy, and make future recovery and development safe.

Principles
- Exist. Ship. Learn. — get V1 working reliably before expanding features.
- Preserve what exists. Do not over-engineer or prematurely optimize.
- Technology should help Max become more, not merely do more.

What Max OS is (V1)
- A one-user personal app that runs on Supabase as the backend/runtime.
- Lola is the AI thinking-partner layer — a collaborator, not a mere assistant.
- Authentication is a custom passphrase/session system (not Supabase Auth).
- The AI chat function currently uses a thin callAI() abstraction; the live model is llama-3.3-70b-versatile through Groq in V1.

Why this repository exists
- Establish GitHub as the canonical, recoverable source of truth for Max OS.
- Document architecture, recovery, continuity, and the Lola relationship.
- Preserve deployed code (by copying exact sources when available) and avoid burying secrets.

Current V1 architecture
User
  ↓
Frontend / app Edge Function
  ↓
auth / api / chat Edge Functions
  ↓
Supabase Postgres
  ↓
AI provider via thin callAI() function

Key database tables (V1)
- knowledge_items — permanent knowledge
- knowledge_suggestions — suggested items for review
- conversations — conversation metadata
- messages — chat messages
- journal_entries — personal journal entries

Secrets and security (short)
- Secrets MUST NEVER be committed to Git. See docs/ for fuller guidance.
- Important secret names (examples, not values): GROQ_API_KEY, APP_PASSPHRASE, SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Current status and focus
- Preserve the current Supabase implementation and documentation.
- Keep the AI abstraction thin; do not build a complex AI gateway yet.
- V1 goal: get the system working reliably and recoverable.

What I did in this commit
- Create repository skeleton, documentation, placeholders for Supabase Edge Functions, and migration README.

Next steps
- Copy exact deployed Edge Function sources into supabase/functions/* when available.
- Export and commit database migration files or a SQL schema dump for Postgres.

License and privacy
- This repository is private and intended to remain so. Do not publish secrets or service keys.
