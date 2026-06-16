-- ============================================================
-- HostelPups — get_latest_messages_per_inquiry RPC
-- ============================================================
-- M9: chat-queries.ts > getMyConversations() used to pull *every*
-- message for every inquiry the user was in just to derive the
-- "last message" preview for each conversation card. For a renter
-- with 20 inquiries and 100 messages each, that's 2,000 rows over
-- the wire for a single inbox load.
--
-- This RPC pushes the dedupe into Postgres using DISTINCT ON. The
-- function is STABLE (read-only) and SECURITY INVOKER so RLS on
-- public.messages still applies — callers can only see rows they
-- already had access to via the messages_select_participants policy.
--
-- Apply manually via Supabase SQL Editor (founder will do this).
-- Expand-contract: pure expand. Client code in `getMyConversations`
-- gracefully falls back to the per-row scan if `.rpc(...)` fails,
-- so deploy ordering is safe.
-- ============================================================

create or replace function public.get_latest_messages_per_inquiry(
  p_inquiry_ids uuid[]
)
returns table (
  inquiry_id    uuid,
  content       text,
  created_at    timestamptz,
  sender_id     uuid,
  was_redacted  boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (m.inquiry_id)
    m.inquiry_id,
    m.content,
    m.created_at,
    m.sender_id,
    m.was_redacted
  from public.messages m
  where m.inquiry_id = any(p_inquiry_ids)
  order by m.inquiry_id, m.created_at desc;
$$;

-- The Supabase auto-generated REST endpoint for this function expects
-- to be callable by anon + authenticated; RLS on public.messages
-- prevents leakage either way.
grant execute on function public.get_latest_messages_per_inquiry(uuid[])
  to anon, authenticated;

-- ============================================================
-- Verification
-- ============================================================
-- -- Spot-check the new function exists + parameters:
-- select proname, pg_get_function_identity_arguments(oid)
-- from pg_proc
-- where proname = 'get_latest_messages_per_inquiry';
