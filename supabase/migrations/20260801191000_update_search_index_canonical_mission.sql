set check_function_bodies = off;
set search_path = public;

create or replace function public.organization_narrative_plain_text(
  p_profile jsonb,
  p_section_id text,
  p_legacy_key text
)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  with target as (
    select section
    from (
      select entry as section
      from jsonb_array_elements(
        case
          when jsonb_typeof(p_profile->'roadmap'->'sections') = 'array'
            then p_profile->'roadmap'->'sections'
          else '[]'::jsonb
        end
      ) as entry
      where entry->>'id' = p_section_id

      union all

      select entry as section
      from jsonb_each(
        case
          when jsonb_typeof(p_profile->'roadmap'->'sections') = 'object'
            then p_profile->'roadmap'->'sections'
          else '{}'::jsonb
        end
      ) as stored(key, entry)
      where coalesce(entry->>'id', stored.key) = p_section_id
    ) candidates
    limit 1
  ),
  resolved as (
    select case
      when target.section is not null
        and (
          btrim(coalesce(target.section->>'content', '')) <> ''
          or target.section->>'lastUpdated' is not null
        )
        then coalesce(target.section->>'content', '')
      when jsonb_typeof(p_profile->p_legacy_key) = 'string'
        then coalesce(p_profile->>p_legacy_key, '')
      when jsonb_typeof(p_profile->p_legacy_key) = 'array'
        then coalesce((
          select string_agg(value, E'\n')
          from jsonb_array_elements_text(p_profile->p_legacy_key) as value
        ), '')
      else ''
    end as content
    from (select 1) seed
    left join target on true
  )
  select btrim(
    regexp_replace(
      regexp_replace(content, '<[^>]*>', ' ', 'g'),
      '[[:space:]]+',
      ' ',
      'g'
    )
  )
  from resolved;
$$;

create or replace view search_index as
  select
    'class:' || c.id::text as id,
    c.title as label,
    coalesce(c.subtitle, c.description) as subtitle,
    '/accelerator/class/' || c.slug as href,
    'Classes'::text as group_name,
    'academy'::text as scope,
    null::uuid as user_id,
    false::boolean as is_public,
    c.is_published as is_published,
    setweight(to_tsvector('english', coalesce(c.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(c.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(c.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(c.slug, '')), 'D') as tsv
  from classes c

  union all

  select
    'module:' || m.id::text as id,
    m.title as label,
    c.title as subtitle,
    '/accelerator/class/' || c.slug || '/module/' || coalesce(m.index_in_class, m.idx, 1) as href,
    'Modules'::text as group_name,
    'academy'::text as scope,
    null::uuid as user_id,
    false::boolean as is_public,
    (m.is_published and c.is_published) as is_published,
    setweight(to_tsvector('english', coalesce(m.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(m.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(c.title, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(c.slug, '')), 'D') as tsv
  from modules m
  join classes c on c.id = m.class_id

  union all

  select
    'question:' || ma.module_id::text || ':' || field.ordinality::text as id,
    coalesce(field.value->>'label', field.value->>'name') as label,
    concat_ws(' · ', c.title, m.title) as subtitle,
    '/accelerator/class/' || c.slug || '/module/' || coalesce(m.index_in_class, m.idx, 1) as href,
    'Questions'::text as group_name,
    'academy'::text as scope,
    null::uuid as user_id,
    false::boolean as is_public,
    (m.is_published and c.is_published) as is_published,
    setweight(to_tsvector('english', coalesce(field.value->>'label', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(field.value->>'name', '')), 'B') ||
    setweight(to_tsvector('english', coalesce(field.value->>'description', '')), 'C') ||
    setweight(to_tsvector('english', coalesce(m.title, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(c.title, '')), 'D') as tsv
  from module_assignments ma
  join modules m on m.id = ma.module_id
  join classes c on c.id = m.class_id
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(ma.schema->'fields') = 'array' then ma.schema->'fields'
      else '[]'::jsonb
    end
  ) with ordinality as field(value, ordinality)
  where btrim(coalesce(field.value->>'label', field.value->>'name', '')) <> ''

  union all

  select
    'program:' || p.id::text as id,
    coalesce(p.title, 'Untitled program') as label,
    coalesce(p.subtitle, p.status_label) as subtitle,
    '/my-organization?tab=programs&programId=' || p.id::text as href,
    'Programs'::text as group_name,
    'owner'::text as scope,
    p.user_id as user_id,
    false::boolean as is_public,
    true::boolean as is_published,
    setweight(to_tsvector('english', coalesce(p.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(p.status_label, '')), 'C') as tsv
  from programs p

  union all

  select
    'org:' || o.user_id::text as id,
    coalesce(o.profile->>'name', 'My organization') as label,
    'Your organization'::text as subtitle,
    '/my-organization'::text as href,
    'My organization'::text as group_name,
    'owner'::text as scope,
    o.user_id as user_id,
    false::boolean as is_public,
    true::boolean as is_published,
    setweight(to_tsvector('english', coalesce(o.profile->>'name', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(o.profile->>'tagline', '')), 'B') ||
    setweight(to_tsvector('english', public.organization_narrative_plain_text(o.profile, 'mission_vision_values', 'mission')), 'C') ||
    setweight(to_tsvector('english', coalesce(o.profile->>'description', '')), 'C') as tsv
  from organizations o

  union all

  select
    'roadmap:' || o.user_id::text || ':' || coalesce(section.value->>'slug', section.value->>'id', section.ordinality::text) as id,
    coalesce(section.value->>'title', 'Roadmap section') as label,
    coalesce(section.value->>'subtitle', '') as subtitle,
    '/my-organization/roadmap#' || coalesce(section.value->>'slug', section.value->>'id', section.ordinality::text) as href,
    'Roadmap'::text as group_name,
    'owner'::text as scope,
    o.user_id as user_id,
    o.is_public_roadmap as is_public,
    true::boolean as is_published,
    setweight(to_tsvector('english', coalesce(section.value->>'title', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(section.value->>'subtitle', '')), 'B') ||
    setweight(to_tsvector('english', coalesce(section.value->>'content', '')), 'C') as tsv
  from organizations o
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(o.profile->'roadmap'->'sections') = 'array' then o.profile->'roadmap'->'sections'
      else '[]'::jsonb
    end
  ) with ordinality as section(value, ordinality)

  union all

  select
    'doc:' || o.user_id::text || ':' || doc.key as id,
    coalesce(doc.value->>'name', doc.key) as label,
    case doc.key
      when 'verificationLetter' then '501(c)(3) determination letter'
      when 'articlesOfIncorporation' then 'Articles of incorporation'
      when 'bylaws' then 'Bylaws'
      when 'stateRegistration' then 'State registration'
      when 'goodStandingCertificate' then 'Certificate of good standing'
      when 'w9' then 'W-9 form'
      when 'taxExemptCertificate' then 'Tax exempt certificate'
      else 'Document'
    end as subtitle,
    '/my-organization/documents'::text as href,
    'Documents'::text as group_name,
    'owner'::text as scope,
    o.user_id as user_id,
    false::boolean as is_public,
    true::boolean as is_published,
    setweight(to_tsvector('english', coalesce(doc.value->>'name', '')), 'A') ||
    setweight(to_tsvector('english', doc.key), 'B') as tsv
  from organizations o
  cross join lateral jsonb_each(
    case
      when jsonb_typeof(o.profile->'documents') = 'object' then o.profile->'documents'
      else '{}'::jsonb
    end
  ) as doc(key, value)

  union all

  select
    'public-org:' || o.user_id::text as id,
    coalesce(o.profile->>'name', o.public_slug) as label,
    coalesce(o.profile->>'tagline', concat_ws(', ', o.profile->>'address_city', o.profile->>'address_state')) as subtitle,
    '/' || o.public_slug as href,
    'Community'::text as group_name,
    'public'::text as scope,
    o.user_id as user_id,
    true::boolean as is_public,
    true::boolean as is_published,
    setweight(to_tsvector('english', coalesce(o.profile->>'name', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(o.profile->>'tagline', '')), 'B') ||
    setweight(to_tsvector('english', public.organization_narrative_plain_text(o.profile, 'mission_vision_values', 'mission')), 'C') ||
    setweight(to_tsvector('english', coalesce(o.public_slug, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(o.profile->>'address_city', '')), 'D') ||
    setweight(to_tsvector('english', coalesce(o.profile->>'address_state', '')), 'D') as tsv
  from organizations o
  where o.is_public and o.public_slug is not null;

alter view public.search_index set (security_invoker = true);
revoke all on public.search_index from public;
revoke all on public.search_index from anon;
revoke all on public.search_index from authenticated;
