-- State already contributes to search_document. Intersect its lexemes in the
-- existing GIN predicate to avoid fetching national text matches before state
-- filtering. Keep exact state, visibility, pagination and category predicates.
-- No index rebuild, data rewrite, grants or deadline changes.

create or replace function public.search_nonprofit_directory(p_query text default '',p_state text default null,p_after text default null,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path = '' set statement_timeout = '3s' set plan_cache_mode = 'force_custom_plan' as $$
declare q text := btrim(coalesce(p_query,'')); result jsonb; text_query tsquery; state_query tsquery;
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
    text_query := websearch_to_tsquery('english',q);
    state_query := plainto_tsquery('english',p_state);
    -- Empty tsqueries are identities under &&, so never add state to an empty
    -- user query. Stop-word states (IN/OR/ME/AS) retain the original predicate.
    if numnode(text_query)>0 and numnode(state_query)>0 then
      text_query := text_query && state_query;
    end if;
    select coalesce(jsonb_agg(r.item order by r.ein),'[]'::jsonb) into result from (
      select ein,item from public.nonprofit_directory_public
      where search_document @@ text_query
        and (p_after is null or ein>p_after) and (p_state is null or state=p_state)
      order by ein limit p_limit
    ) r;
  end if;
  return result;
end;
$$;

create or replace function public.search_nonprofit_directory_v2(p_query text default '',p_state text default null,
  p_category text default null,p_after text default null,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path='' set statement_timeout='3s' set plan_cache_mode='force_custom_plan' as $$
declare q text:=btrim(coalesce(p_query,'')); result jsonb; text_query tsquery; state_query tsquery;
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

-- Rollback: restore the two function bodies from migrations 20261006193000
-- and 20261007070000, retaining force_custom_plan from 20261007190000.
