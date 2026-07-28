-- Max OS core schema: two-layer architecture (conversation layer + knowledge layer)
-- Single-owner model, built on Supabase Auth so RLS uses the standard auth.uid() pattern.
-- This means if real multi-user auth is ever added later, this schema and every policy
-- below keeps working unchanged -- no rewrite required.

create extension if not exists pgcrypto;

-- ============ CONVERSATION LAYER (temporary) ============

create table conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'New Conversation',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ KNOWLEDGE LAYER (permanent, curated) ============

create table knowledge_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  content text not null,
  source_conversation_id uuid references conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ PROMOTION SYSTEM ============

create table knowledge_suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  content text not null,
  source_conversation_id uuid references conversations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ============ ROW LEVEL SECURITY ============
-- Locked to a single owner (auth.uid()). No public/anon access to any row, ever.

alter table conversations enable row level security;
alter table messages enable row level security;
alter table journal_entries enable row level security;
alter table knowledge_items enable row level security;
alter table knowledge_suggestions enable row level security;

create policy "owner full access" on conversations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on messages for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on journal_entries for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on knowledge_items for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on knowledge_suggestions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index on messages (conversation_id, created_at);
create index on knowledge_items (category);
create index on knowledge_suggestions (status);
