-- Remove reliance on Supabase Auth (auth.uid()) entirely.
-- V1 uses a single hardcoded owner + custom passphrase gate enforced in Edge Functions,
-- not Supabase's built-in login system. Access model: RLS enabled, zero policies for
-- anon/authenticated roles = explicit deny-all. Only the service_role key (used
-- exclusively inside Edge Functions, never exposed to the client) can read/write.

drop policy if exists "owner full access" on conversations;
drop policy if exists "owner full access" on messages;
drop policy if exists "owner full access" on journal_entries;
drop policy if exists "owner full access" on knowledge_items;
drop policy if exists "owner full access" on knowledge_suggestions;

alter table conversations drop constraint if exists conversations_owner_id_fkey;
alter table messages drop constraint if exists messages_owner_id_fkey;
alter table journal_entries drop constraint if exists journal_entries_owner_id_fkey;
alter table knowledge_items drop constraint if exists knowledge_items_owner_id_fkey;
alter table knowledge_suggestions drop constraint if exists knowledge_suggestions_owner_id_fkey;

alter table conversations alter column owner_id set default '00000000-0000-0000-0000-000000000001';
alter table messages alter column owner_id set default '00000000-0000-0000-0000-000000000001';
alter table journal_entries alter column owner_id set default '00000000-0000-0000-0000-000000000001';
alter table knowledge_items alter column owner_id set default '00000000-0000-0000-0000-000000000001';
alter table knowledge_suggestions alter column owner_id set default '00000000-0000-0000-0000-000000000001';

comment on column conversations.owner_id is 'Fixed placeholder for V1 single-owner mode. Swap to real auth.uid() values if/when multi-user auth is added later — no schema change needed.';
