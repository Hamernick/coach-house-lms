create function public.publish_nonprofit_category_chunk(p_batch uuid,p_manifest_hash text,p_chunk integer,
  p_payload text,p_target text,p_authorization text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='10s' set lock_timeout='2s' as $$
declare payload jsonb; payload_hash text; prior public.nonprofit_category_chunks%rowtype;
  old public.nonprofit_category_sets%rowtype; r jsonb; c jsonb; key text; digest text;
  hold text; status text; rev uuid; outcomes jsonb:='[]'; rollback_rows jsonb:='[]';
begin
  if p_batch is null or p_chunk is null or p_chunk<0 or p_manifest_hash is null or p_manifest_hash !~ '^[0-9a-f]{64}$'
    or p_authorization is null or length(btrim(p_authorization))<1 or length(p_authorization)>1000
    or p_payload is null or octet_length(p_payload)>1048576 then
    raise exception 'Invalid category chunk' using errcode='22023';
  end if;
  if not exists(select 1 from public.nonprofit_directory_settings where singleton and publication_enabled and target_ref=p_target) then
    raise exception 'Category target not enabled' using errcode='22023';
  end if;
  payload:=p_payload::jsonb;
  if jsonb_typeof(payload)<>'array' or jsonb_array_length(payload)<1 or jsonb_array_length(payload)>250 then
    raise exception 'Invalid category payload' using errcode='22023';
  end if;
  payload_hash:=encode(sha256(convert_to(p_payload,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended('nonprofit-category-batch:'||p_batch::text,0));
  if exists(select 1 from public.nonprofit_category_chunks where batch_id=p_batch and
    (manifest_hash<>p_manifest_hash or target_ref<>p_target or authorization_reference<>p_authorization)) then
    raise exception 'Category batch changed' using errcode='22023';
  end if;
  select * into prior from public.nonprofit_category_chunks where batch_id=p_batch and chunk_number=p_chunk;
  if found then
    if prior.payload_hash<>payload_hash or prior.rolled_back_at is not null then
      raise exception 'Category receipt changed or rolled back' using errcode='22023';
    end if;
    return jsonb_build_object('replayed',true,'outcomes',prior.outcomes);
  end if;
  if (select count(*)<>count(distinct value->>'ein') from jsonb_array_elements(payload)) then
    raise exception 'Duplicate category EIN' using errcode='22023';
  end if;
  for r in select value from jsonb_array_elements(payload) order by value->>'ein' loop
    key:=r->>'ein'; c:=(r->>'recordText')::jsonb;
    digest:=encode(sha256(convert_to(r->>'recordText','UTF8')),'hex');
    if key is null or key !~ '^[0-9]{9}$' or key='000000000' or c is null or jsonb_typeof(c)<>'object'
      or c->>'ein' is distinct from key or r->>'recordDigest' is distinct from digest
      or c->>'mappingVersion' is distinct from 'irs-organization-topics-v1'
      or c->>'basis' is distinct from 'irs_classification'
      or coalesce(c->>'sourceHash','') !~ '^[0-9a-f]{64}$'
      or jsonb_typeof(c->'categories') is distinct from 'array'
      or exists(select 1 from jsonb_object_keys(c) k where k not in ('ein','categories','mappingVersion','basis','sourceHash')) then
      raise exception 'Invalid category record' using errcode='22023';
    end if;
    if jsonb_array_length(c->'categories')>4 or exists(select 1 from jsonb_array_elements_text(c->'categories') t where t is null or t not in (
      'health','food','housing','education','employment','finance','legal','family','community','emergency',
      'environment','safety','organizations','international','animals','arts','faith','recreation','philanthropy'))
      or (select count(*)<>count(distinct value) from jsonb_array_elements(c->'categories')) then
      raise exception 'Invalid organization topics' using errcode='22023';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('nonprofit-directory:'||key,0));
    perform 1 from public.nonprofit_directory where ein=key for update;
    if not found then
      outcomes:=outcomes||jsonb_build_array(jsonb_build_object('ein',key,'status','pending','reason','identity_not_published'));
      continue;
    end if;
    hold:=public.nonprofit_directory_hold(key);
    select * into old from public.nonprofit_category_sets where ein=key for update;
    if hold is not null then
      outcomes:=outcomes||jsonb_build_array(jsonb_build_object('ein',key,'status','held','reason',hold));
      continue;
    end if;
    if old.record_digest=digest then
      outcomes:=outcomes||jsonb_build_array(jsonb_build_object('ein',key,'status','unchanged'));
      continue;
    end if;
    if old.record_digest is distinct from r->>'expectedDigest' then
      outcomes:=outcomes||jsonb_build_array(jsonb_build_object('ein',key,'status','held','reason','previous_digest_changed'));
      continue;
    end if;
    status:=case when old.ein is null then 'inserted' else 'updated' end; rev:=gen_random_uuid();
    rollback_rows:=rollback_rows||jsonb_build_array(jsonb_build_object('ein',key,'appliedRevision',rev,'before',case when old.ein is null then null else to_jsonb(old) end));
    insert into public.nonprofit_category_sets(ein,content,record_digest,revision) values(key,c,digest,rev)
      on conflict(ein) do update set content=excluded.content,record_digest=excluded.record_digest,revision=excluded.revision,updated_at=now();
    delete from public.nonprofit_directory_categories where ein=key;
    insert into public.nonprofit_directory_categories(ein,category) select key,value from jsonb_array_elements_text(c->'categories');
    outcomes:=outcomes||jsonb_build_array(jsonb_build_object('ein',key,'status',status));
  end loop;
  insert into public.nonprofit_category_chunks(batch_id,chunk_number,manifest_hash,target_ref,authorization_reference,payload_hash,outcomes,rollback_rows)
    values(p_batch,p_chunk,p_manifest_hash,p_target,p_authorization,payload_hash,outcomes,rollback_rows);
  return jsonb_build_object('replayed',false,'outcomes',outcomes);
end;
$$;
revoke all on function public.publish_nonprofit_category_chunk(uuid,text,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.publish_nonprofit_category_chunk(uuid,text,integer,text,text,text) to service_role;

create function public.rollback_nonprofit_category_chunk(p_batch uuid,p_chunk integer,p_target text)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='10s' set lock_timeout='2s' as $$
declare receipt public.nonprofit_category_chunks%rowtype; r jsonb; old public.nonprofit_category_sets%rowtype;
  current_revision uuid; restored integer:=0; preserved integer:=0;
begin
  if not exists(select 1 from public.nonprofit_directory_settings where singleton and target_ref=p_target) then
    raise exception 'Wrong category rollback target' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('nonprofit-category-batch:'||p_batch::text,0));
  select * into receipt from public.nonprofit_category_chunks where batch_id=p_batch and chunk_number=p_chunk for update;
  if not found or receipt.target_ref<>p_target then raise exception 'Missing category receipt' using errcode='22023'; end if;
  if receipt.rolled_back_at is not null then return jsonb_build_object('replayed',true); end if;
  for r in select value from jsonb_array_elements(receipt.rollback_rows) order by value->>'ein' loop
    perform pg_advisory_xact_lock(hashtextextended('nonprofit-directory:'||(r->>'ein'),0));
    perform 1 from public.nonprofit_directory where ein=r->>'ein' for update;
    select revision into current_revision from public.nonprofit_category_sets where ein=r->>'ein' for update;
    if current_revision is distinct from (r->>'appliedRevision')::uuid or public.nonprofit_directory_hold(r->>'ein') is not null then
      preserved:=preserved+1; continue;
    end if;
    delete from public.nonprofit_category_sets where ein=r->>'ein';
    if r->'before'<>'null'::jsonb then
      select * into old from jsonb_populate_record(null::public.nonprofit_category_sets,r->'before');
      insert into public.nonprofit_category_sets select old.*;
      insert into public.nonprofit_directory_categories(ein,category) select old.ein,value from jsonb_array_elements_text(old.content->'categories');
    end if;
    restored:=restored+1;
  end loop;
  update public.nonprofit_category_chunks set rolled_back_at=now() where batch_id=p_batch and chunk_number=p_chunk;
  return jsonb_build_object('replayed',false,'restored',restored,'preservedLaterChanges',preserved);
end;
$$;
revoke all on function public.rollback_nonprofit_category_chunk(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.rollback_nonprofit_category_chunk(uuid,integer,text) to service_role;

create function public.nonprofit_category_receipt(p_batch uuid,p_chunk integer)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('manifestHash',manifest_hash,'payloadHash',payload_hash,
    'outcomes',outcomes,'rolledBackAt',rolled_back_at)
  from public.nonprofit_category_chunks where batch_id=p_batch and chunk_number=p_chunk;
$$;
revoke all on function public.nonprofit_category_receipt(uuid,integer) from public,anon,authenticated;
grant execute on function public.nonprofit_category_receipt(uuid,integer) to service_role;
