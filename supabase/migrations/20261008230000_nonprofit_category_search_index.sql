-- Incremental category text index. Existing rows remain NULL until bounded backfill;
-- search keeps an exact fallback for those rows throughout deployment.
alter table public.nonprofit_directory_categories add column search_document tsvector;
create index nonprofit_category_text_idx on public.nonprofit_directory_categories
  using gin (search_document, (array[category])) with (fastupdate=off)
  where search_document is not null;
create index nonprofit_category_text_missing_idx on public.nonprofit_directory_categories(category,ein)
  where search_document is null;

create function public.nonprofit_category_search_document()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  -- Serialize with directory edits before copying the generated, canonical text.
  select d.search_document into new.search_document from public.nonprofit_directory d
    where d.ein=new.ein for update;
  if not found then raise exception 'Missing directory identity' using errcode='23503'; end if;
  return new;
end;
$$;
revoke all on function public.nonprofit_category_search_document() from public,anon,authenticated,service_role;
create trigger nonprofit_category_search_document before insert or update
  on public.nonprofit_directory_categories for each row
  execute function public.nonprofit_category_search_document();

create function public.nonprofit_directory_refresh_category_search()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.nonprofit_directory_categories set search_document=new.search_document
    where ein=new.ein;
  return null;
end;
$$;
revoke all on function public.nonprofit_directory_refresh_category_search() from public,anon,authenticated,service_role;
create trigger nonprofit_directory_refresh_category_search after update
  on public.nonprofit_directory for each row
  when (old.search_document is distinct from new.search_document)
  execute function public.nonprofit_directory_refresh_category_search();

-- A bounded, target-bound maintenance RPC, never an unbounded migration rewrite.
create function public.backfill_nonprofit_category_search(p_eins text[],p_target text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='500ms' as $$
declare key text; doc tsvector; changed integer; total integer:=0; identities integer:=0;
begin
  if p_eins is null or cardinality(p_eins)<1 or cardinality(p_eins)>100
    or exists(select 1 from unnest(p_eins) e where e is null or e !~ '^[0-9]{9}$')
    or not exists(select 1 from public.nonprofit_directory_settings where singleton and publication_enabled and target_ref=p_target) then
    raise exception 'Invalid category search backfill' using errcode='22023';
  end if;
  for key in select distinct e from unnest(p_eins) e order by e loop
    -- Same parent-before-child lock order as category/field publication.
    select search_document into doc from public.nonprofit_directory where ein=key for update;
    if not found then continue; end if;
    update public.nonprofit_directory_categories set search_document=doc
      where ein=key and search_document is null;
    get diagnostics changed=row_count;
    total:=total+changed;
    if changed>0 then identities:=identities+1; end if;
  end loop;
  return jsonb_build_object('identities',identities,'assignments',total);
end;
$$;
revoke all on function public.backfill_nonprofit_category_search(text[],text) from public,anon,authenticated;
grant execute on function public.backfill_nonprofit_category_search(text[],text) to service_role;

create or replace function public.search_nonprofit_directory_v2(p_query text default '',p_state text default null,
  p_category text default null,p_after text default null,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='3s' set plan_cache_mode='force_custom_plan' as $$
declare q text:=btrim(coalesce(p_query,'')); result jsonb; text_query tsquery; state_query tsquery; candidate_count integer;
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
    text_query := websearch_to_tsquery('english',q);
    state_query := plainto_tsquery('english',p_state);
    -- Empty tsqueries are identities under &&, so never add state to an empty
    -- user query. Stop-word states (IN/OR/ME/AS) retain the original predicate.
    if numnode(text_query)>0 and numnode(state_query)>0 then
      text_query := text_query && state_query;
    end if;
    -- A broad text scan can touch thousands of heap pages even when an early
    -- category page already contains enough matches. Probe at most 128 category
    -- identities by primary key, retaining every public visibility predicate.
    -- OFFSET 0 keeps these lookups parameterized; it does not truncate results.
    -- State-filtered searches retain their selective GIN path.
    if p_state is null and numnode(text_query)>0 then
      with candidates as materialized (
        select c.ein,c.search_document from public.nonprofit_directory_categories c
        where c.category=p_category and (p_after is null or c.ein>p_after)
        order by c.ein limit 128
      )
      select (select count(*) from candidates),coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb)
      into candidate_count,result from (
        select c.ein,d.item from candidates c cross join lateral (
          select d.item from public.nonprofit_directory_public d
          where d.ein=c.ein and (c.search_document is not null or d.search_document @@ text_query) offset 0
        ) d where c.search_document is null or c.search_document @@ text_query
        order by c.ein limit p_limit
      ) r;
      -- An exhausted category or a full page is conclusive. Otherwise use the
      -- original query and cursor, so sparse/late matches can never be omitted.
      if candidate_count<128 or jsonb_array_length(result)>=p_limit then
        return result;
      end if;
    end if;
    if p_state is null and numnode(text_query)>0 then
      -- Intersect category and text inside one GIN index before directory reads.
      -- NULL and indexed partitions are disjoint, preserving every rollout row.
      with matches as materialized (
        select c.ein from public.nonprofit_directory_categories c
        where c.search_document is not null
          and array[c.category] @> array[p_category]
          and c.search_document @@ text_query
          and (p_after is null or c.ein>p_after)
        union all
        select c.ein from public.nonprofit_directory_categories c
        cross join lateral (
          select d.ein from public.nonprofit_directory_public d
          where d.ein=c.ein and d.search_document @@ text_query offset 0
        ) d
        where c.category=p_category and c.search_document is null
          and (p_after is null or c.ein>p_after)
      )
      select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
        select d.ein,d.item from matches m
        cross join lateral (
          select d.ein,d.item from public.nonprofit_directory_public d
          where d.ein=m.ein offset 0
        ) d
        order by d.ein limit p_limit
      ) r;
      return result;
    end if;
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select d.ein,d.item from public.nonprofit_directory_public d
      join public.nonprofit_directory_categories c on c.ein=d.ein and c.category=p_category
      where d.search_document @@ text_query
        and (p_after is null or d.ein>p_after) and (p_state is null or d.state=p_state)
      order by d.ein limit p_limit
    ) r;
  end if;
  return result;
end;
$$;

-- Expose the bounded repair RPC after the migration commits.
notify pgrst, 'reload schema';
