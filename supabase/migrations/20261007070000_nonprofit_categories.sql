-- Organization topics are separate from verified service categories and identity receipts.
create table public.nonprofit_category_sets (
  ein text primary key references public.nonprofit_directory(ein) on delete cascade,
  content jsonb not null check (jsonb_typeof(content)='object' and content->>'ein'=ein),
  record_digest text not null check (record_digest ~ '^[0-9a-f]{64}$'),
  revision uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now()
);
create table public.nonprofit_directory_categories (
  ein text not null references public.nonprofit_category_sets(ein) on delete cascade,
  category text not null check (category in (
    'health','food','housing','education','employment','finance','legal','family',
    'community','emergency','environment','safety','organizations','international',
    'animals','arts','faith','recreation','philanthropy')),
  primary key(ein,category)
);
create index nonprofit_directory_categories_category_ein_idx on public.nonprofit_directory_categories(category,ein);
create table public.nonprofit_category_chunks (
  batch_id uuid not null,
  chunk_number integer not null check (chunk_number>=0),
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  target_ref text not null,
  authorization_reference text not null,
  payload_hash text not null,
  outcomes jsonb not null,
  rollback_rows jsonb not null,
  committed_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  primary key(batch_id,chunk_number)
);
alter table public.nonprofit_category_sets enable row level security;
alter table public.nonprofit_category_sets force row level security;
alter table public.nonprofit_directory_categories enable row level security;
alter table public.nonprofit_directory_categories force row level security;
alter table public.nonprofit_category_chunks enable row level security;
alter table public.nonprofit_category_chunks force row level security;
revoke all on public.nonprofit_category_sets,public.nonprofit_directory_categories,public.nonprofit_category_chunks from public,anon,authenticated;
grant select,insert,update,delete on public.nonprofit_category_sets,public.nonprofit_directory_categories,public.nonprofit_category_chunks to service_role;

create function public.nonprofit_category_preflight(p_eins text[])
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='3s' as $$
begin
  if p_eins is null or cardinality(p_eins)>250 or exists(select 1 from unnest(p_eins) e where e is null or e !~ '^[0-9]{9}$') then
    raise exception 'Invalid category preflight' using errcode='22023';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('ein',e,'expectedDigest',s.record_digest,
    'published',d.ein is not null,'hold',public.nonprofit_directory_hold(e)) order by e),'[]'::jsonb)
    from (select distinct unnest(p_eins) e) inputs
    left join public.nonprofit_directory d on d.ein=e left join public.nonprofit_category_sets s on s.ein=e);
end;
$$;
revoke all on function public.nonprofit_category_preflight(text[]) from public,anon,authenticated;
grant execute on function public.nonprofit_category_preflight(text[]) to service_role;

-- V1 remains available throughout deployment. Payload shape remains the public identity allowlist.
create function public.search_nonprofit_directory_v2(p_query text default '',p_state text default null,
  p_category text default null,p_after text default null,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='3s' as $$
declare q text:=btrim(coalesce(p_query,'')); result jsonb;
begin
  if length(q)>160 or p_limit is null or p_limit<1 or p_limit>101 or
    (p_after is not null and p_after !~ '^[0-9]{9}$') or (p_state is not null and p_state !~ '^[A-Z]{2}$') or
    (p_category is not null and (length(p_category)>80 or p_category !~ '^[a-z][a-z_0-9]*$')) then
    raise exception 'Invalid directory query' using errcode='22023';
  end if;
  if p_category is null then
    return public.search_nonprofit_directory(q,p_state,p_after,p_limit);
  end if;
  -- Exact topic match: broad IRS topics must never satisfy a specific service leaf.
  if q='' then
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select d.ein,d.item from public.nonprofit_directory_categories c
      join public.nonprofit_directory_public d on d.ein=c.ein
      where c.category=p_category and (p_after is null or c.ein>p_after) and (p_state is null or d.state=p_state)
      order by c.ein limit p_limit
    ) r;
  elsif regexp_replace(q,'[- ]','','g') ~ '^[0-9]{9}$' then
    select coalesce(jsonb_agg(d.item),'[]'::jsonb) into result
      from public.nonprofit_directory_public d join public.nonprofit_directory_categories c on c.ein=d.ein
      where c.category=p_category and d.ein=regexp_replace(q,'[- ]','','g')
        and (p_after is null or d.ein>p_after) and (p_state is null or d.state=p_state);
  else
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select d.ein,d.item from public.nonprofit_directory_public d
      join public.nonprofit_directory_categories c on c.ein=d.ein and c.category=p_category
      where d.search_document @@ websearch_to_tsquery('english',q)
        and (p_after is null or d.ein>p_after) and (p_state is null or d.state=p_state)
      order by d.ein limit p_limit
    ) r;
  end if;
  return result;
end;
$$;
revoke all on function public.search_nonprofit_directory_v2(text,text,text,text,integer) from public;
grant execute on function public.search_nonprofit_directory_v2(text,text,text,text,integer) to anon,authenticated,service_role;
