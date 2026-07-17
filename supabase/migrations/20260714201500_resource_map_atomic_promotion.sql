set check_function_bodies = on;
set search_path = public;

create index if not exists resource_map_import_record_matches_accepted_idx
  on public.resource_map_import_record_matches (import_record_id, match_score desc, id)
  where match_status = 'accepted';

create or replace function public.lock_resource_map_match_acceptance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_promotion_status text;
begin
  if new.match_status <> 'accepted' then
    return new;
  end if;

  select import_record.promotion_status
  into v_promotion_status
  from public.resource_map_import_records import_record
  where import_record.id = new.import_record_id
  for update;

  if v_promotion_status is null then
    raise exception 'Resource map import record % does not exist.', new.import_record_id
      using errcode = 'P0002';
  end if;

  if v_promotion_status = 'promoted' then
    raise exception 'Resource map import record % is already promoted and cannot accept a duplicate match.', new.import_record_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists lock_resource_map_match_acceptance
  on public.resource_map_import_record_matches;
create trigger lock_resource_map_match_acceptance
  before insert or update of match_status, import_record_id
  on public.resource_map_import_record_matches
  for each row execute function public.lock_resource_map_match_acceptance();

create or replace function public.promote_resource_map_import_record(
  p_import_record_id uuid,
  p_payload jsonb,
  p_publish boolean default false
)
returns table (
  promotion_result text,
  organization_id uuid,
  service_id uuid,
  location_id uuid,
  contact_count integer,
  link_count integer,
  field_evidence_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_record public.resource_map_import_records%rowtype;
  v_match public.resource_map_import_record_matches%rowtype;
  v_organization jsonb;
  v_service jsonb;
  v_location jsonb;
  v_contact jsonb;
  v_link jsonb;
  v_contact_id uuid;
  v_link_id uuid;
  v_first_contact_id uuid;
  v_first_link_id uuid;
  v_contact_ids jsonb := '{}'::jsonb;
  v_link_ids jsonb := '{}'::jsonb;
  v_organization_id uuid;
  v_service_id uuid;
  v_location_id uuid;
  v_contact_count integer := 0;
  v_link_count integer := 0;
  v_evidence_count integer := 0;
  v_visibility text;
  v_review_status text;
  v_approved_at timestamptz;
  v_source_comparison_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if not (select public.is_admin()) then
      raise exception 'Only administrators may promote resource map records.'
        using errcode = '42501';
    end if;
  end if;

  if p_import_record_id is null then
    raise exception 'p_import_record_id is required.' using errcode = '22004';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'p_payload must be a JSON object.' using errcode = '22023';
  end if;

  select import_record.*
  into v_record
  from public.resource_map_import_records import_record
  where import_record.id = p_import_record_id
  for update;

  if not found then
    raise exception 'Resource map import record % does not exist.', p_import_record_id
      using errcode = 'P0002';
  end if;

  if v_record.review_status <> 'approved' then
    raise exception 'Resource map import record % must be approved before promotion.', p_import_record_id
      using errcode = '23514';
  end if;

  if v_record.reviewed_by is null or v_record.reviewed_at is null then
    raise exception 'Resource map import record % requires an identified reviewer and review timestamp.', p_import_record_id
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.profiles reviewer
    where reviewer.id = v_record.reviewed_by
  ) then
    raise exception 'Resource map import record % reviewer does not exist.', p_import_record_id
      using errcode = '23503';
  end if;

  if v_record.promotion_status = 'promoted' then
    if v_record.promoted_organization_id is null or v_record.promoted_service_id is null then
      raise exception 'Resource map import record % has an invalid promoted state.', p_import_record_id
        using errcode = '23514';
    end if;

    return query select
      'already_promoted'::text,
      v_record.promoted_organization_id,
      v_record.promoted_service_id,
      (
        select location.id
        from public.resource_map_locations location
        where location.service_id = v_record.promoted_service_id
          and location.is_primary
        order by location.created_at, location.id
        limit 1
      ),
      (
        select count(*)::integer
        from public.resource_map_contacts contact
        where contact.service_id = v_record.promoted_service_id
      ),
      (
        select count(*)::integer
        from public.resource_map_links link
        where link.service_id = v_record.promoted_service_id
      ),
      (
        select count(*)::integer
        from public.resource_map_field_evidence evidence
        where evidence.import_record_id = p_import_record_id
          and evidence.service_id = v_record.promoted_service_id
      );
    return;
  end if;

  select match.*
  into v_match
  from public.resource_map_import_record_matches match
  where match.import_record_id = p_import_record_id
    and match.match_status = 'accepted'
  order by match.match_score desc nulls last, match.id
  limit 1;

  if found then
    if v_record.promotion_status <> 'blocked' then
      update public.resource_map_import_records
      set promotion_status = 'blocked'
      where id = p_import_record_id;

      insert into public.resource_map_curation_events (
        action,
        organization_id,
        service_id,
        import_record_id,
        actor_id,
        reason,
        before_state,
        after_state
      ) values (
        'merge_duplicate',
        v_match.organization_id,
        v_match.service_id,
        p_import_record_id,
        v_record.reviewed_by,
        'Blocked promotion because an accepted duplicate match exists. Merge manually before creating a new canonical resource.',
        to_jsonb(v_record),
        jsonb_build_object(
          'blocked', true,
          'acceptedMatch', jsonb_build_object(
            'id', v_match.id,
            'organizationId', v_match.organization_id,
            'serviceId', v_match.service_id,
            'matchKind', v_match.match_kind,
            'matchScore', v_match.match_score
          )
        )
      );
    end if;

    return query select
      'blocked'::text,
      v_match.organization_id,
      v_match.service_id,
      null::uuid,
      0,
      0,
      0;
    return;
  end if;

  if v_record.promotion_status not in ('not_promoted', 'ready') then
    raise exception 'Resource map import record % has unsupported promotion status %.', p_import_record_id, v_record.promotion_status
      using errcode = '23514';
  end if;

  if v_record.last_verified_at is null then
    raise exception 'Resource map import record % requires a real verification timestamp.', p_import_record_id
      using errcode = '23514';
  end if;

  v_source_comparison_count := coalesce(
    nullif(v_record.extracted_fields #>> '{enrichment,sourceComparisonCount}', '')::integer,
    nullif(v_record.extracted_fields #>> '{enrichment,source_comparison_count}', '')::integer,
    0
  );

  if coalesce(v_record.extracted_fields #>> '{enrichment,verification,status}', '') <> 'approved'
    or v_source_comparison_count < 2
    or jsonb_array_length(coalesce(
      v_record.extracted_fields #> '{enrichment,verification,unsupportedClaims}',
      v_record.extracted_fields #> '{enrichment,verification,unsupported_claims}',
      '[]'::jsonb
    )) > 0
    or jsonb_array_length(coalesce(
      v_record.extracted_fields #> '{enrichment,verification,contradictions}',
      '[]'::jsonb
    )) > 0
  then
    raise exception 'Resource map import record % requires approved source-verified enrichment with two comparison passes and no unresolved claims.', p_import_record_id
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.resource_map_enrichment_runs enrichment_run
    where enrichment_run.import_record_id = p_import_record_id
      and enrichment_run.pass_type = 'verification'
      and enrichment_run.status = 'completed'
      and coalesce(
        enrichment_run.structured_result ->> 'status',
        enrichment_run.structured_result #>> '{verification,status}'
      ) = 'approved'
      and jsonb_array_length(coalesce(enrichment_run.issues, '[]'::jsonb)) = 0
      and jsonb_array_length(coalesce(
        enrichment_run.structured_result -> 'unsupportedClaims',
        enrichment_run.structured_result #> '{verification,unsupportedClaims}',
        enrichment_run.structured_result -> 'unsupported_claims',
        enrichment_run.structured_result #> '{verification,unsupported_claims}',
        '[]'::jsonb
      )) = 0
      and jsonb_array_length(coalesce(
        enrichment_run.structured_result -> 'contradictions',
        enrichment_run.structured_result #> '{verification,contradictions}',
        '[]'::jsonb
      )) = 0
  ) then
    raise exception 'Resource map import record % has no completed approved verification ledger entry.', p_import_record_id
      using errcode = '23514';
  end if;

  v_organization := p_payload -> 'organization';
  v_service := p_payload -> 'service';
  v_location := p_payload -> 'location';

  if jsonb_typeof(v_organization) <> 'object'
    or nullif(btrim(v_organization ->> 'name'), '') is null
  then
    raise exception 'p_payload.organization.name is required.' using errcode = '22023';
  end if;

  if jsonb_typeof(v_service) <> 'object'
    or nullif(btrim(v_service ->> 'title'), '') is null
  then
    raise exception 'p_payload.service.title is required.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_payload -> 'categoryKeys', '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_payload -> 'categoryKeys', '[]'::jsonb)) = 0
  then
    raise exception 'p_payload.categoryKeys must contain at least one category.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_payload -> 'contacts', '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_payload -> 'links', '[]'::jsonb)) <> 'array'
  then
    raise exception 'p_payload contacts and links must be arrays.' using errcode = '22023';
  end if;

  v_visibility := case when p_publish then 'published' else 'draft' end;
  v_review_status := case when p_publish then 'approved' else 'pending_review' end;
  v_approved_at := case when p_publish then v_record.reviewed_at else null end;

  insert into public.resource_map_organizations (
    source_id,
    source_record_id,
    name,
    tagline,
    description,
    website_url,
    donate_url,
    logo_url,
    favicon_url,
    domain,
    email,
    phone,
    normalized_email,
    normalized_phone,
    visibility,
    review_status,
    approved_by,
    approved_at,
    data_quality_score,
    source_url,
    source_snapshot,
    last_seen_at,
    last_verified_at,
    created_by,
    updated_by
  ) values (
    v_record.source_id,
    v_record.source_record_id,
    btrim(v_organization ->> 'name'),
    nullif(btrim(v_organization ->> 'tagline'), ''),
    nullif(btrim(v_organization ->> 'description'), ''),
    nullif(btrim(v_organization ->> 'website_url'), ''),
    nullif(btrim(v_organization ->> 'donate_url'), ''),
    nullif(btrim(v_organization ->> 'logo_url'), ''),
    nullif(btrim(v_organization ->> 'favicon_url'), ''),
    nullif(btrim(v_organization ->> 'domain'), ''),
    nullif(btrim(v_organization ->> 'email'), ''),
    nullif(btrim(v_organization ->> 'phone'), ''),
    nullif(btrim(v_organization ->> 'normalized_email'), ''),
    nullif(btrim(v_organization ->> 'normalized_phone'), ''),
    v_visibility,
    v_review_status,
    case when p_publish then v_record.reviewed_by else null end,
    v_approved_at,
    v_record.confidence_score,
    coalesce(nullif(btrim(v_record.source_url), ''), nullif(btrim(v_organization ->> 'source_url'), '')),
    v_record.raw_snapshot,
    v_record.last_seen_at,
    v_record.last_verified_at,
    v_record.reviewed_by,
    v_record.reviewed_by
  ) returning id into v_organization_id;

  insert into public.resource_map_services (
    organization_id,
    source_id,
    source_record_id,
    title,
    subtitle,
    description,
    service_kind,
    delivery_modes,
    eligibility,
    cost,
    who_it_helps,
    intake_url,
    appointment_info,
    documents_needed,
    accessibility_notes,
    urgent_availability,
    languages,
    hours,
    timezone,
    appointment_required,
    availability_status,
    availability_notes,
    temporary_closed_until,
    coverage_area,
    visibility,
    review_status,
    approved_by,
    approved_at,
    source_url,
    source_snapshot,
    last_seen_at,
    last_verified_at,
    created_by,
    updated_by
  ) values (
    v_organization_id,
    v_record.source_id,
    v_record.source_record_id,
    btrim(v_service ->> 'title'),
    nullif(btrim(v_service ->> 'subtitle'), ''),
    nullif(btrim(v_service ->> 'description'), ''),
    coalesce(nullif(btrim(v_service ->> 'service_kind'), ''), 'service'),
    coalesce(array(
      select jsonb_array_elements_text(coalesce(v_service -> 'delivery_modes', '[]'::jsonb))
    ), '{}'::text[]),
    nullif(btrim(v_service ->> 'eligibility'), ''),
    nullif(btrim(v_service ->> 'cost'), ''),
    nullif(btrim(v_service ->> 'who_it_helps'), ''),
    nullif(btrim(v_service ->> 'intake_url'), ''),
    nullif(btrim(v_service ->> 'appointment_info'), ''),
    coalesce(array(
      select jsonb_array_elements_text(coalesce(v_service -> 'documents_needed', '[]'::jsonb))
    ), '{}'::text[]),
    nullif(btrim(v_service ->> 'accessibility_notes'), ''),
    nullif(btrim(v_service ->> 'urgent_availability'), ''),
    coalesce(array(
      select jsonb_array_elements_text(coalesce(v_service -> 'languages', '[]'::jsonb))
    ), '{}'::text[]),
    coalesce(v_service -> 'hours', '{}'::jsonb),
    nullif(btrim(v_service ->> 'timezone'), ''),
    coalesce((v_service ->> 'appointment_required')::boolean, false),
    coalesce(nullif(btrim(v_service ->> 'availability_status'), ''), 'unknown'),
    nullif(btrim(v_service ->> 'availability_notes'), ''),
    nullif(v_service ->> 'temporary_closed_until', '')::timestamptz,
    coalesce(array(
      select jsonb_array_elements_text(coalesce(v_service -> 'coverage_area', '[]'::jsonb))
    ), '{}'::text[]),
    v_visibility,
    v_review_status,
    case when p_publish then v_record.reviewed_by else null end,
    v_approved_at,
    coalesce(nullif(btrim(v_record.source_url), ''), nullif(btrim(v_service ->> 'source_url'), '')),
    v_record.raw_snapshot,
    v_record.last_seen_at,
    v_record.last_verified_at,
    v_record.reviewed_by,
    v_record.reviewed_by
  ) returning id into v_service_id;

  with requested_categories as (
    select
      category.category_key,
      min(category.position) as position
    from jsonb_array_elements_text(p_payload -> 'categoryKeys')
      with ordinality as category(category_key, position)
    group by category.category_key
  )
  insert into public.resource_map_service_categories (
    service_id,
    category_key,
    is_primary,
    confidence,
    source_id
  )
  select
    v_service_id,
    category.category_key,
    row_number() over (order by category.position) = 1,
    coalesce(
      nullif(p_payload #>> array['categoryConfidenceByKey', category.category_key], '')::numeric,
      v_record.confidence_score
    ),
    v_record.source_id
  from requested_categories category
  order by category.position;

  if v_location is not null and jsonb_typeof(v_location) <> 'null' then
    if jsonb_typeof(v_location) <> 'object' then
      raise exception 'p_payload.location must be an object or null.' using errcode = '22023';
    end if;

    insert into public.resource_map_locations (
      organization_id,
      service_id,
      label,
      location_type,
      address_line1,
      address_line2,
      city,
      state,
      county,
      postal_code,
      country,
      latitude,
      longitude,
      geocoding_accuracy,
      service_radius_miles,
      location_url,
      service_area,
      accessibility_notes,
      hours,
      timezone,
      appointment_required,
      availability_status,
      availability_notes,
      temporary_closed_until,
      is_primary
    ) values (
      v_organization_id,
      v_service_id,
      nullif(btrim(v_location ->> 'label'), ''),
      coalesce(nullif(btrim(v_location ->> 'location_type'), ''), 'physical'),
      nullif(btrim(v_location ->> 'address_line1'), ''),
      nullif(btrim(v_location ->> 'address_line2'), ''),
      nullif(btrim(v_location ->> 'city'), ''),
      nullif(btrim(v_location ->> 'state'), ''),
      nullif(btrim(v_location ->> 'county'), ''),
      nullif(btrim(v_location ->> 'postal_code'), ''),
      coalesce(nullif(btrim(v_location ->> 'country'), ''), 'United States'),
      nullif(v_location ->> 'latitude', '')::double precision,
      nullif(v_location ->> 'longitude', '')::double precision,
      coalesce(nullif(btrim(v_location ->> 'geocoding_accuracy'), ''), 'unknown'),
      nullif(v_location ->> 'service_radius_miles', '')::numeric,
      nullif(btrim(v_location ->> 'location_url'), ''),
      coalesce(array(
        select jsonb_array_elements_text(coalesce(v_location -> 'service_area', '[]'::jsonb))
      ), '{}'::text[]),
      nullif(btrim(v_location ->> 'accessibility_notes'), ''),
      coalesce(v_location -> 'hours', '{}'::jsonb),
      nullif(btrim(v_location ->> 'timezone'), ''),
      coalesce((v_location ->> 'appointment_required')::boolean, false),
      coalesce(nullif(btrim(v_location ->> 'availability_status'), ''), 'unknown'),
      nullif(btrim(v_location ->> 'availability_notes'), ''),
      nullif(v_location ->> 'temporary_closed_until', '')::timestamptz,
      true
    ) returning id into v_location_id;
  end if;

  for v_contact in
    select value
    from jsonb_array_elements(coalesce(p_payload -> 'contacts', '[]'::jsonb))
  loop
    if jsonb_typeof(v_contact) <> 'object' then
      raise exception 'Every p_payload.contacts entry must be an object.' using errcode = '22023';
    end if;

    insert into public.resource_map_contacts (
      organization_id,
      service_id,
      contact_type,
      label,
      value,
      url,
      is_primary,
      is_public,
      metadata
    ) values (
      v_organization_id,
      v_service_id,
      btrim(v_contact ->> 'contact_type'),
      nullif(btrim(v_contact ->> 'label'), ''),
      btrim(v_contact ->> 'value'),
      nullif(btrim(v_contact ->> 'url'), ''),
      coalesce((v_contact ->> 'is_primary')::boolean, false),
      false,
      coalesce(v_contact -> 'metadata', '{}'::jsonb)
    ) returning id into v_contact_id;

    v_contact_count := v_contact_count + 1;
    v_first_contact_id := coalesce(v_first_contact_id, v_contact_id);
    if not v_contact_ids ? (v_contact ->> 'contact_type') then
      v_contact_ids := v_contact_ids || jsonb_build_object(v_contact ->> 'contact_type', v_contact_id);
    end if;
  end loop;

  for v_link in
    select value
    from jsonb_array_elements(coalesce(p_payload -> 'links', '[]'::jsonb))
  loop
    if jsonb_typeof(v_link) <> 'object' then
      raise exception 'Every p_payload.links entry must be an object.' using errcode = '22023';
    end if;

    insert into public.resource_map_links (
      organization_id,
      service_id,
      link_type,
      label,
      url,
      domain,
      is_primary,
      is_public,
      metadata
    ) values (
      v_organization_id,
      v_service_id,
      btrim(v_link ->> 'link_type'),
      nullif(btrim(v_link ->> 'label'), ''),
      btrim(v_link ->> 'url'),
      nullif(btrim(v_link ->> 'domain'), ''),
      coalesce((v_link ->> 'is_primary')::boolean, false),
      false,
      coalesce(v_link -> 'metadata', '{}'::jsonb)
    ) returning id into v_link_id;

    v_link_count := v_link_count + 1;
    v_first_link_id := coalesce(v_first_link_id, v_link_id);
    if not v_link_ids ? (v_link ->> 'link_type') then
      v_link_ids := v_link_ids || jsonb_build_object(v_link ->> 'link_type', v_link_id);
    end if;
  end loop;

  with staged as (
    select
      evidence.*,
      regexp_replace(
        regexp_replace(evidence.field_path, '\[[0-9]+\]', '', 'g'),
        '^.*\.',
        ''
      ) as field_name
    from public.resource_map_field_evidence evidence
    where evidence.import_record_id = p_import_record_id
      and evidence.organization_id is null
      and evidence.service_id is null
      and evidence.location_id is null
      and evidence.contact_id is null
      and evidence.link_id is null
  ), targets as (
    select
      staged.*,
      case
        when staged.field_name in (
          'address', 'addressLine1', 'address_line1', 'addressLine2', 'address_line2',
          'streetAddress', 'fullAddress', 'city', 'state', 'county', 'postalCode',
          'postal_code', 'country', 'latitude', 'lat', 'longitude', 'lng', 'lon',
          'locationUrl', 'location_url', 'locationType', 'location_type',
          'locationLabel', 'location_label', 'serviceArea', 'service_area',
          'serviceRadiusMiles', 'service_radius_miles', 'geocodingAccuracy',
          'geocoding_accuracy', 'hours', 'timezone', 'timeZone',
          'appointmentRequired', 'appointment_required', 'availabilityStatus',
          'availability_status', 'availabilityNotes', 'availability_notes',
          'temporaryClosedUntil', 'temporary_closed_until'
        ) or staged.field_path like 'extractedFields.location.%'
          or staged.field_path like 'extractedFields.locations.%'
        then v_location_id
        else null
      end as canonical_location_id,
      case
        when staged.field_name in ('contacts', 'public_contacts', 'phone', 'phoneNumber', 'email', 'contactEmail')
          or staged.field_path like 'extractedFields.contacts.%'
          or staged.field_path like 'contacts.%'
        then case staged.field_name
          when 'phone' then coalesce(nullif(v_contact_ids ->> 'phone', '')::uuid, v_first_contact_id)
          when 'phoneNumber' then coalesce(nullif(v_contact_ids ->> 'phone', '')::uuid, v_first_contact_id)
          when 'email' then coalesce(nullif(v_contact_ids ->> 'email', '')::uuid, v_first_contact_id)
          when 'contactEmail' then coalesce(nullif(v_contact_ids ->> 'email', '')::uuid, v_first_contact_id)
          else v_first_contact_id
        end
        else null
      end as canonical_contact_id,
      case
        when staged.field_name in (
          'links', 'public_links', 'website', 'websiteUrl', 'website_url',
          'donateUrl', 'donate_url', 'intakeUrl', 'intake_url', 'logoUrl',
          'logo_url', 'sourceUrl', 'source_url'
        ) or staged.field_path like 'extractedFields.links.%'
          or staged.field_path like 'links.%'
        then case staged.field_name
          when 'website' then coalesce(nullif(v_link_ids ->> 'website', '')::uuid, v_first_link_id)
          when 'websiteUrl' then coalesce(nullif(v_link_ids ->> 'website', '')::uuid, v_first_link_id)
          when 'website_url' then coalesce(nullif(v_link_ids ->> 'website', '')::uuid, v_first_link_id)
          when 'donateUrl' then coalesce(nullif(v_link_ids ->> 'donate', '')::uuid, v_first_link_id)
          when 'donate_url' then coalesce(nullif(v_link_ids ->> 'donate', '')::uuid, v_first_link_id)
          when 'intakeUrl' then coalesce(nullif(v_link_ids ->> 'intake', '')::uuid, v_first_link_id)
          when 'intake_url' then coalesce(nullif(v_link_ids ->> 'intake', '')::uuid, v_first_link_id)
          when 'logoUrl' then coalesce(nullif(v_link_ids ->> 'logo', '')::uuid, v_first_link_id)
          when 'logo_url' then coalesce(nullif(v_link_ids ->> 'logo', '')::uuid, v_first_link_id)
          when 'sourceUrl' then coalesce(nullif(v_link_ids ->> 'source', '')::uuid, v_first_link_id)
          when 'source_url' then coalesce(nullif(v_link_ids ->> 'source', '')::uuid, v_first_link_id)
          else v_first_link_id
        end
        else null
      end as canonical_link_id
    from staged
  )
  insert into public.resource_map_field_evidence (
    import_record_id,
    source_id,
    organization_id,
    service_id,
    location_id,
    contact_id,
    link_id,
    field_path,
    field_value,
    confidence_score,
    source_url,
    evidence_type,
    derived_from,
    transformation,
    evidence_metadata,
    observed_at
  )
  select
    targets.import_record_id,
    coalesce(targets.source_id, v_record.source_id),
    v_organization_id,
    v_service_id,
    targets.canonical_location_id,
    targets.canonical_contact_id,
    targets.canonical_link_id,
    targets.field_path,
    targets.field_value,
    targets.confidence_score,
    targets.source_url,
    targets.evidence_type,
    targets.derived_from,
    targets.transformation,
    targets.evidence_metadata || jsonb_build_object(
      'promotedFromImport', true,
      'originalEvidenceId', targets.id,
      'canonicalTarget', jsonb_build_object(
        'organizationId', v_organization_id,
        'serviceId', v_service_id,
        'locationId', targets.canonical_location_id,
        'contactId', targets.canonical_contact_id,
        'linkId', targets.canonical_link_id
      )
    ),
    targets.observed_at
  from targets;

  get diagnostics v_evidence_count = row_count;

  update public.resource_map_import_records
  set
    promotion_status = 'promoted',
    promoted_organization_id = v_organization_id,
    promoted_service_id = v_service_id
  where id = p_import_record_id;

  insert into public.resource_map_curation_events (
    action,
    organization_id,
    service_id,
    import_record_id,
    actor_id,
    reason,
    before_state,
    after_state
  ) values (
    'promote',
    v_organization_id,
    v_service_id,
    p_import_record_id,
    v_record.reviewed_by,
    case
      when p_publish then 'Promoted approved import as published canonical resource.'
      else 'Promoted approved import as draft canonical resource.'
    end,
    to_jsonb(v_record),
    jsonb_build_object(
      'organizationId', v_organization_id,
      'serviceId', v_service_id,
      'locationId', v_location_id,
      'categoryKeys', p_payload -> 'categoryKeys',
      'privateContactCount', v_contact_count,
      'privateLinkCount', v_link_count,
      'fieldEvidencePromotedCount', v_evidence_count,
      'visibility', v_visibility,
      'lastVerifiedAt', v_record.last_verified_at
    )
  );

  return query select
    'promoted'::text,
    v_organization_id,
    v_service_id,
    v_location_id,
    v_contact_count,
    v_link_count,
    v_evidence_count;
end;
$$;

comment on function public.promote_resource_map_import_record(uuid, jsonb, boolean) is
  'Atomically promotes one approved, source-verified resource-map import record or blocks an accepted duplicate match.';

revoke all on function public.lock_resource_map_match_acceptance() from public, anon, authenticated;
revoke all on function public.promote_resource_map_import_record(uuid, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.promote_resource_map_import_record(uuid, jsonb, boolean) to authenticated, service_role;
