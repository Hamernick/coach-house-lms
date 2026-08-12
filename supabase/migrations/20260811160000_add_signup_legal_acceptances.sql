create table if not exists public.platform_legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_version text not null check (length(document_version) between 1 and 100),
  terms_sha256 text not null check (terms_sha256 ~ '^[a-f0-9]{64}$'),
  privacy_sha256 text not null check (privacy_sha256 ~ '^[a-f0-9]{64}$'),
  accepted_at timestamptz not null,
  source text not null check (source in ('signup', 'tester_signup')),
  created_at timestamptz not null default now(),
  unique (user_id, document_version)
);

create index if not exists platform_legal_acceptances_user_id_idx
  on public.platform_legal_acceptances (user_id);

alter table public.platform_legal_acceptances enable row level security;

revoke all on public.platform_legal_acceptances from anon, authenticated;
grant select on public.platform_legal_acceptances to authenticated;

drop policy if exists "platform_legal_acceptances_select_own"
  on public.platform_legal_acceptances;
create policy "platform_legal_acceptances_select_own"
  on public.platform_legal_acceptances
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.record_signup_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  consent jsonb := new.raw_user_meta_data -> 'legal_consent';
begin
  if jsonb_typeof(consent) = 'object'
    and consent ->> 'version' = '2026-08-12.1'
    and consent ->> 'termsSha256' = '405e53cfa64e4dba9ecb4e04289d82ed0b8f20b70a233a4b310996d63493e5a2'
    and consent ->> 'privacySha256' = 'c4ff2282fa5033042d4bcee3ed26ac4b1a5863b4cabd1346084c3d6097853d92'
  then
    insert into public.platform_legal_acceptances (
      user_id,
      document_version,
      terms_sha256,
      privacy_sha256,
      accepted_at,
      source
    ) values (
      new.id,
      consent ->> 'version',
      consent ->> 'termsSha256',
      consent ->> 'privacySha256',
      coalesce(new.created_at, now()),
      'signup'
    )
    on conflict (user_id, document_version) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.record_signup_legal_acceptance() from public;

drop trigger if exists on_auth_user_legal_acceptance on auth.users;
create trigger on_auth_user_legal_acceptance
after insert on auth.users
for each row execute function public.record_signup_legal_acceptance();
