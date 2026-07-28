# ARCHITECTURE (V1)

This document describes the current V1 architecture for Max OS and the data layers in the system.

Runtime flow

User
  ↓
Frontend / app Edge Function
  ↓
auth / api / chat Edge Functions
  ↓
Supabase Postgres
  ↓
AI provider via thin callAI() function

Notes
- Supabase acts as both the runtime host for Edge Functions and the Postgres database.
- The chat Edge Function calls a thin callAI() abstraction to the AI provider (currently Groq/llama-3.3-70b-versatile). Keep this abstraction intentionally small in V1.
- Do not introduce an elaborate AI gateway yet — portability across providers is important.

Database layers

Conversation Layer
- conversations — conversation-level metadata
- messages — chat messages
- journal_entries — personal journal/notes tied to time

Knowledge Review Layer
- knowledge_suggestions — suggested items for review or action

Permanent Knowledge Layer
- knowledge_items — approved, durable knowledge entries

Security and RLS
- RLS should default to deny-by-default. Service-role keys are server-only and must not be exposed to client code.

Deployment
- Edge Functions are deployed to Supabase Edge Functions. Store secrets in the Supabase project secrets manager and never in Git.
