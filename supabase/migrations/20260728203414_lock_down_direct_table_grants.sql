-- Max OS V1 single-owner hardening.
-- Browser clients never access application tables directly.
-- All application data access goes through server-side Edge Functions using service_role.

revoke all privileges on table
  public.conversations,
  public.messages,
  public.journal_entries,
  public.knowledge_items,
  public.knowledge_suggestions
from anon, authenticated;
