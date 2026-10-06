create function public.nonprofit_directory_preflight(p_eins text[])
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_eins is null or cardinality(p_eins)>1000 or cardinality(p_eins)<1 or exists(select 1 from unnest(p_eins) e where e !~ '^[0-9]{9}$') then
    raise exception 'Invalid preflight population' using errcode='22023';
  end if;
  select jsonb_agg(jsonb_build_object('ein',e,'expectedDigest',d.record_digest,'hold',public.nonprofit_directory_hold(e)) order by e)
    into result from unnest(p_eins) e left join public.nonprofit_directory d on d.ein=e;
  return jsonb_build_object('rows',result,'settings',(select to_jsonb(s) from public.nonprofit_directory_settings s where singleton));
end;
$$;

create function public.nonprofit_directory_valid_record(r jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(r)='object' and
    r->>'ein' ~ '^[0-9]{9}$' and r->>'ein'<>'000000000' and
    length(btrim(r->>'name')) between 1 and 300 and length(coalesce(r->>'description',''))<=1000 and
    length(coalesce(r->>'city',''))<=150 and length(coalesce(r->>'postalCode',''))<=20 and
    (r->>'state' is null or r->>'state' ~ '^[A-Z]{2}$') and
    (r->>'website' is null or (length(r->>'website')<=2048 and r->>'website' ~ '^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/|$)' and r->>'websiteBasis' in ('source_reported','provider_confirmed'))) and
    (r->>'phone' is null or (r->>'phone' ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$' and r->>'phoneBasis' in ('source_reported','provider_confirmed'))) and
    not exists(select 1 from jsonb_object_keys(r) k where k not in (
      'ein','name','city','state','postalCode','website','phone','description',
      'websiteBasis','websiteSourcePeriod','phoneBasis','phoneSourcePeriod','descriptionSourcePeriod')) and
    not exists(select 1 from jsonb_each(r) kv where jsonb_typeof(kv.value) not in ('string','null'))
  ,false);
$$;

create function public.publish_nonprofit_directory_chunk(
  p_batch uuid,p_manifest_hash text,p_chunk integer,p_payload text,p_target text,p_policy text,p_authorization text
)
returns jsonb language plpgsql security definer set search_path = '' set statement_timeout = '60s' as $$
declare
  rows jsonb; entry jsonb; record jsonb; record_text text; record_hash text;
  old public.nonprofit_directory%rowtype; run public.nonprofit_publication_runs%rowtype;
  existing public.nonprofit_publication_chunks%rowtype;
  outcomes jsonb := '[]'; rollback_rows jsonb := '[]'; new_revision uuid;
  v_ein text; held text; payload_hash text := encode(sha256(convert_to(p_payload,'UTF8')),'hex');
begin
  if p_batch is null or p_manifest_hash !~ '^[0-9a-f]{64}$' or p_manifest_hash is null or p_chunk is null or p_chunk<0 or
    p_payload is null or octet_length(p_payload)>2000000 or length(btrim(coalesce(p_authorization,''))) not between 1 and 500 then
    raise exception 'Invalid publication envelope' using errcode='22023';
  end if;
  if not exists(select 1 from public.nonprofit_directory_settings where singleton and publication_enabled and target_ref=p_target and policy_version=p_policy) then
    raise exception 'Directory target/policy not activated' using errcode='42501';
  end if;
  rows := p_payload::jsonb;
  if jsonb_typeof(rows)<>'array' or jsonb_array_length(rows) not between 1 and 1000 then
    raise exception 'Invalid publication chunk' using errcode='22023';
  end if;
  if (select count(distinct e->>'ein') from jsonb_array_elements(rows) e) <> jsonb_array_length(rows) then
    raise exception 'Duplicate or missing chunk EIN' using errcode='22023';
  end if;
  insert into public.nonprofit_publication_runs(id,manifest_hash,policy_version,target_ref,authorization_reference)
    values(p_batch,p_manifest_hash,p_policy,p_target,p_authorization) on conflict(id) do nothing;
  select * into run from public.nonprofit_publication_runs where id=p_batch for update;
  if run.manifest_hash<>p_manifest_hash or run.policy_version<>p_policy or run.target_ref<>p_target or run.authorization_reference<>p_authorization then
    raise exception 'Batch identity mismatch' using errcode='22023';
  end if;
  select * into existing from public.nonprofit_publication_chunks where batch_id=p_batch and chunk_number=p_chunk;
  if found then
    if existing.payload_hash<>payload_hash or existing.rolled_back_at is not null then
      raise exception 'Chunk mismatch or already rolled back' using errcode='22023';
    end if;
    return jsonb_build_object('replayed',true,'payloadHash',payload_hash,'outcomes',existing.outcomes);
  end if;
  for entry in select value from jsonb_array_elements(rows) order by value->>'ein' loop
    v_ein := entry->>'ein'; record_text := entry->>'recordText'; record := record_text::jsonb;
    if v_ein is null or not public.nonprofit_directory_valid_record(record) or record->>'ein'<>v_ein then
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('ein',v_ein,'status','held','reason','invalid_public_record'));
      continue;
    end if;
    record_hash := encode(sha256(convert_to(record_text,'UTF8')),'hex');
    if record_hash is distinct from entry->>'recordDigest' then raise exception 'Record digest mismatch' using errcode='22023'; end if;
    perform pg_advisory_xact_lock(hashtextextended('nonprofit-directory:'||v_ein,0));
    select * into old from public.nonprofit_directory where nonprofit_directory.ein=v_ein for update;
    held := public.nonprofit_directory_hold(v_ein);
    if held is not null then
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('ein',v_ein,'status','held','reason',held)); continue;
    end if;
    if old.record_digest is distinct from entry->>'expectedDigest' then
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('ein',v_ein,'status','held','reason','previous_digest_changed')); continue;
    end if;
    if old.record_digest=record_hash then
      outcomes := outcomes || jsonb_build_array(jsonb_build_object('ein',v_ein,'status','unchanged')); continue;
    end if;
    new_revision := gen_random_uuid();
    rollback_rows := rollback_rows || jsonb_build_array(jsonb_build_object('ein',v_ein,'revision',new_revision,'digest',record_hash,'before',case when old.ein is null then null else to_jsonb(old) end));
    insert into public.nonprofit_directory(ein,content,record_digest,policy_version,revision)
      values(v_ein,record,record_hash,p_policy,new_revision)
      on conflict on constraint nonprofit_directory_pkey do update set content=excluded.content,record_digest=excluded.record_digest,
        policy_version=excluded.policy_version,revision=excluded.revision,updated_at=now();
    outcomes := outcomes || jsonb_build_array(jsonb_build_object('ein',v_ein,'status',case when old.ein is null then 'inserted' else 'updated' end));
  end loop;
  insert into public.nonprofit_publication_chunks(batch_id,chunk_number,payload_hash,outcomes,rollback_rows)
    values(p_batch,p_chunk,payload_hash,outcomes,rollback_rows);
  return jsonb_build_object('replayed',false,'payloadHash',payload_hash,'outcomes',outcomes);
end;
$$;

create function public.nonprofit_publication_receipt(p_batch uuid,p_chunk integer)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('payloadHash',payload_hash,'outcomes',outcomes,'rolledBackAt',rolled_back_at)
    from public.nonprofit_publication_chunks where batch_id=p_batch and chunk_number=p_chunk;
$$;

create function public.rollback_nonprofit_directory_chunk(p_batch uuid,p_chunk integer,p_target text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare chunk public.nonprofit_publication_chunks%rowtype; entry jsonb; previous jsonb; changed integer; restored integer:=0; skipped integer:=0;
begin
  if not exists(select 1 from public.nonprofit_publication_runs where id=p_batch and target_ref=p_target) then raise exception 'Rollback target mismatch'; end if;
  perform 1 from public.nonprofit_publication_runs where id=p_batch for update;
  select * into chunk from public.nonprofit_publication_chunks where batch_id=p_batch and chunk_number=p_chunk for update;
  if not found then raise exception 'Unknown publication chunk'; end if;
  if chunk.rolled_back_at is not null then return jsonb_build_object('replayed',true); end if;
  for entry in select value from jsonb_array_elements(chunk.rollback_rows) order by value->>'ein' loop
    previous := entry->'before';
    if previous is null or previous='null'::jsonb then
      update public.nonprofit_directory set suppressed_at=now(),revision=gen_random_uuid(),updated_at=now()
        where ein=entry->>'ein' and revision=(entry->>'revision')::uuid and record_digest=entry->>'digest' and managed_by='import' and suppressed_at is null;
    else
      update public.nonprofit_directory set content=previous->'content',record_digest=previous->>'record_digest',policy_version=previous->>'policy_version',
        revision=gen_random_uuid(),updated_at=now(),published_at=(previous->>'published_at')::timestamptz
        where ein=entry->>'ein' and revision=(entry->>'revision')::uuid and record_digest=entry->>'digest' and managed_by='import' and suppressed_at is null;
    end if;
    get diagnostics changed=row_count;
    restored:=restored+changed; skipped:=skipped+(1-changed);
  end loop;
  update public.nonprofit_publication_chunks set rolled_back_at=now() where batch_id=p_batch and chunk_number=p_chunk;
  return jsonb_build_object('restoredOrSuppressed',restored,'preservedLaterChanges',skipped,'replayed',false);
end;
$$;

revoke all on function public.nonprofit_directory_preflight(text[]),public.nonprofit_directory_valid_record(jsonb),
  public.publish_nonprofit_directory_chunk(uuid,text,integer,text,text,text,text),public.nonprofit_publication_receipt(uuid,integer),
  public.rollback_nonprofit_directory_chunk(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.nonprofit_directory_preflight(text[]),
  public.publish_nonprofit_directory_chunk(uuid,text,integer,text,text,text,text),public.nonprofit_publication_receipt(uuid,integer),
  public.rollback_nonprofit_directory_chunk(uuid,integer,text) to service_role;
