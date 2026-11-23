-- User data only; Quran text and page images remain static app assets.
create table public.ayahvault_library_entries (
 user_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,
 payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 500000),
 revision bigint not null default 1 check (revision > 0),
 deleted boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key (user_id, id),
 check (payload->>'id' = id::text)
);
alter table public.ayahvault_library_entries enable row level security;
create policy "Read own AyahVault entries" on public.ayahvault_library_entries for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.ayahvault_library_entries from anon, authenticated;
grant select on public.ayahvault_library_entries to authenticated;

-- Compare-and-swap revisions prevent offline devices overwriting newer edits.
-- Writes only through this function, always scoped to the authenticated user.
create or replace function public.save_ayahvault_entry(p_id uuid, p_payload jsonb, p_base_revision bigint, p_deleted boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); existing public.ayahvault_library_entries;
begin
 if uid is null then raise exception 'Sign in to sync'; end if;
 if p_id is null or p_payload is null or p_base_revision is null or p_base_revision < 0 or p_deleted is null then raise exception 'Invalid sync request'; end if;
 if p_payload->>'id' is distinct from p_id::text or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 500000 then raise exception 'Invalid entry'; end if;
 -- Serializes first inserts as well as updates for this user/entry pair.
 perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_id::text, 0));
 select * into existing from public.ayahvault_library_entries where user_id = uid and id = p_id for update;
 if found then
  if existing.revision <> p_base_revision then return jsonb_build_object('conflict', true, 'row', to_jsonb(existing)); end if;
  update public.ayahvault_library_entries set payload=p_payload, deleted=p_deleted, revision=revision+1, updated_at=now() where user_id=uid and id=p_id returning * into existing;
 else
  if p_base_revision <> 0 then raise exception 'Cloud entry missing; export your local copy before retrying'; end if;
  insert into public.ayahvault_library_entries(user_id,id,payload,deleted) values(uid,p_id,p_payload,p_deleted) returning * into existing;
 end if;
 return jsonb_build_object('conflict', false, 'row', to_jsonb(existing));
end $$;
revoke all on function public.save_ayahvault_entry(uuid,jsonb,bigint,boolean) from public, anon;
grant execute on function public.save_ayahvault_entry(uuid,jsonb,bigint,boolean) to authenticated;
