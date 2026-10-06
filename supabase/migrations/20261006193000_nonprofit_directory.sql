-- Organization identities are distinct from approved, actionable resource services.
create table public.nonprofit_directory (
  ein text primary key check (ein ~ '^[0-9]{9}$' and ein <> '000000000'),
  content jsonb not null check (jsonb_typeof(content) = 'object' and content->>'ein' = ein),
  record_digest text not null check (record_digest ~ '^[0-9a-f]{64}$'),
  policy_version text not null,
  revision uuid not null default gen_random_uuid(),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  suppressed_at timestamptz,
  managed_by text not null default 'import' check (managed_by in ('import','owner','staff')),
  name text generated always as (content->>'name') stored,
  state text generated always as (content->>'state') stored,
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(content->>'name','')), 'A') ||
    setweight(to_tsvector('english', coalesce(content->>'city','') || ' ' || coalesce(content->>'state','') || ' ' || coalesce(content->>'postalCode','')), 'B') ||
    setweight(to_tsvector('english', coalesce(content->>'description','')), 'C')
  ) stored
);
create index nonprofit_directory_search_idx on public.nonprofit_directory using gin(search_document) where suppressed_at is null;
create index nonprofit_directory_state_ein_idx on public.nonprofit_directory(state,ein) where suppressed_at is null;
create index if not exists organizations_registry_ein_idx on public.organizations ((regexp_replace(ein, '[^0-9]', '', 'g'))) where ein is not null;
create index if not exists resource_map_registry_ein_idx on public.resource_map_organizations ((regexp_replace(ein, '[^0-9]', '', 'g'))) where ein is not null;

create table public.nonprofit_directory_settings (
  singleton boolean primary key default true check (singleton),
  publication_enabled boolean not null default false,
  target_ref text not null,
  policy_version text not null default 'nonprofit-directory-retained-audit-v1',
  activated_at timestamptz
);
-- Explicit activation binds this database to the reviewed target; migration alone never publishes.
create table public.nonprofit_publication_runs (
  id uuid primary key,
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  policy_version text not null,
  target_ref text not null,
  authorization_reference text not null,
  created_at timestamptz not null default now()
);
create table public.nonprofit_publication_chunks (
  batch_id uuid not null references public.nonprofit_publication_runs(id),
  chunk_number integer not null check (chunk_number >= 0),
  payload_hash text not null,
  outcomes jsonb not null,
  rollback_rows jsonb not null,
  committed_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  primary key(batch_id,chunk_number)
);

alter table public.nonprofit_directory enable row level security;
alter table public.nonprofit_directory force row level security;
alter table public.nonprofit_directory_settings enable row level security;
alter table public.nonprofit_directory_settings force row level security;
alter table public.nonprofit_publication_runs enable row level security;
alter table public.nonprofit_publication_runs force row level security;
alter table public.nonprofit_publication_chunks enable row level security;
alter table public.nonprofit_publication_chunks force row level security;
revoke all on public.nonprofit_directory, public.nonprofit_directory_settings,
  public.nonprofit_publication_runs, public.nonprofit_publication_chunks from public, anon, authenticated;
grant select,insert,update,delete on public.nonprofit_directory, public.nonprofit_directory_settings,
  public.nonprofit_publication_runs, public.nonprofit_publication_chunks to service_role;

-- Staff/owner edits and existing curated listings win, including suppressions created later.
create function public.nonprofit_directory_hold(p_ein text)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when exists(select 1 from public.organizations o where o.ein is not null and regexp_replace(o.ein,'[^0-9]','','g')=p_ein)
      then 'existing_platform_organization'
    when exists(select 1 from public.resource_map_organizations o where o.ein is not null and regexp_replace(o.ein,'[^0-9]','','g')=p_ein)
      then 'existing_curated_resource_organization'
    when exists(select 1 from public.nonprofit_directory d where d.ein=p_ein and (d.suppressed_at is not null or d.managed_by <> 'import'))
      then 'suppressed_or_manually_managed'
    else null end;
$$;
revoke all on function public.nonprofit_directory_hold(text) from public, anon, authenticated;
grant execute on function public.nonprofit_directory_hold(text) to service_role;

-- Fixed projection is accessible only through parameterized security-definer RPCs.
-- No public SELECT on this view: callers cannot supply arbitrary predicates.
-- Allow predicate pushdown so the RPC's full-text predicate reaches the GIN index.
create view public.nonprofit_directory_public as
select d.ein,d.name,d.state,d.search_document,
  jsonb_build_object(
    'ein',d.ein,'name',d.name,'city',d.content->>'city','state',d.state,
    'postalCode',d.content->>'postalCode','website',d.content->>'website',
    'phone',d.content->>'phone','description',d.content->>'description',
    'websiteBasis',d.content->>'websiteBasis','websiteSourcePeriod',d.content->>'websiteSourcePeriod',
    'phoneBasis',d.content->>'phoneBasis','phoneSourcePeriod',d.content->>'phoneSourcePeriod',
    'descriptionSourcePeriod',d.content->>'descriptionSourcePeriod',
    'operatingStatus','unknown','listingType','nonprofit_organization'
  ) as item
from public.nonprofit_directory d
where d.suppressed_at is null
  and not exists(select 1 from public.organizations o where o.ein is not null and regexp_replace(o.ein,'[^0-9]','','g')=d.ein)
  and not exists(select 1 from public.resource_map_organizations o where o.ein is not null and regexp_replace(o.ein,'[^0-9]','','g')=d.ein);
revoke all on public.nonprofit_directory_public from public,anon,authenticated;

create function public.search_nonprofit_directory(p_query text default '',p_state text default null,p_after text default null,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path = '' set statement_timeout = '3s' as $$
declare q text := btrim(coalesce(p_query,'')); result jsonb;
begin
  if length(q)>160 or p_limit is null or p_limit<1 or p_limit>101 or
    (p_after is not null and p_after !~ '^[0-9]{9}$') or (p_state is not null and p_state !~ '^[A-Z]{2}$') then
    raise exception 'Invalid directory query' using errcode='22023';
  end if;
  if q = '' then
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select ein,item from public.nonprofit_directory_public
      where (p_after is null or ein>p_after) and (p_state is null or state=p_state)
      order by ein limit p_limit
    ) r;
  elsif regexp_replace(q,'[- ]','','g') ~ '^[0-9]{9}$' then
    select coalesce(jsonb_agg(item),'[]'::jsonb) into result from public.nonprofit_directory_public
      where ein=regexp_replace(q,'[- ]','','g') and (p_after is null or ein>p_after) and (p_state is null or state=p_state);
  else
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select ein,item from public.nonprofit_directory_public
      where search_document @@ websearch_to_tsquery('english',q)
        and (p_after is null or ein>p_after) and (p_state is null or state=p_state)
      order by ein limit p_limit
    ) r;
  end if;
  return result;
end;
$$;
create function public.get_nonprofit_directory(p_ein text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select item from public.nonprofit_directory_public where ein=p_ein;
$$;
revoke all on function public.search_nonprofit_directory(text,text,text,integer),public.get_nonprofit_directory(text) from public;
grant execute on function public.search_nonprofit_directory(text,text,text,integer),public.get_nonprofit_directory(text) to anon,authenticated,service_role;
