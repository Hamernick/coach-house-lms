-- Runs in the directory test's disposable database; no live data.
create function public.test_categories(batch uuid,n integer,ein text,categories jsonb,expected text default null)
returns jsonb language sql as $$
  select public.publish_nonprofit_category_chunk(batch,repeat('c',64),n,
    jsonb_build_array(jsonb_build_object('ein',ein,'recordText',r::text,
      'recordDigest',encode(sha256(convert_to(r::text,'UTF8')),'hex'),'expectedDigest',expected))::text,
    'abcdefghijklmnopqrst','explicit category test authorization')
  from (select jsonb_build_object('ein',ein,'categories',categories,'mappingVersion','irs-organization-topics-v1',
    'basis','irs_classification','sourceHash',repeat('d',64)) r) x;
$$;
select public.test_chunk('10000000-0000-4000-8000-000000000001',0,'022345678','Food Research Foundation');
select public.test_chunk('10000000-0000-4000-8000-000000000001',1,'022345679','Food Pantry');
set role service_role;
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000001',0,'022345678','["food","health"]')->'outcomes'->0->>'status')='inserted','category insert failed');
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000001',0,'022345678','["food","health"]')->>'replayed')::boolean,'lost acknowledgement replay failed');
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000001',1,'022345679','["food"]')->'outcomes'->0->>'status')='inserted','second category insert failed');
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000001',2,'099999999','["food"]')->'outcomes'->0->>'status')='pending','unpublished identity must stay pending');
select public.test_assert((public.nonprofit_category_preflight(array['022345678','099999999'])->0->>'expectedDigest') is not null,'preflight digest missing');
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000002',0,'022345678','["housing"]')->'outcomes'->0->>'reason')='previous_digest_changed','stale category write overwrote');
reset role;
set role anon;
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('',null,'food',null,1))=1,'category-only browse failed');
select public.test_assert(public.search_nonprofit_directory_v2('',null,'food','022345678',1)->0->>'ein'='022345679','category cursor failed');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('research','IL','food',null,20))=1,'category text/state intersection failed');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('research','NY','food',null,20))=0,'state ignored');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('',null,'food_food_pantries',null,20))=0,'topic leaked into specific service');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('022345678',null,'food',null,20))=1,'category EIN lookup failed');
select public.test_assert(not (public.search_nonprofit_directory_v2('',null,'food',null,20)->0 ? 'sourceHash'),'private category source leaked');
do $$begin
  begin perform * from public.nonprofit_directory_categories; raise exception 'anonymous category table readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.nonprofit_category_sets; raise exception 'anonymous source readable'; exception when insufficient_privilege then null; end;
  begin perform * from public.nonprofit_category_chunks; raise exception 'anonymous receipts readable'; exception when insufficient_privilege then null; end;
  begin perform public.nonprofit_category_preflight(array['022345678']); raise exception 'anonymous preflight allowed'; exception when insufficient_privilege then null; end;
  begin perform public.test_categories('20000000-0000-4000-8000-000000000008',0,'022345678','["food"]'); raise exception 'anonymous publish allowed'; exception when insufficient_privilege then null; end;
  begin perform public.rollback_nonprofit_category_chunk('20000000-0000-4000-8000-000000000001',0,'abcdefghijklmnopqrst'); raise exception 'anonymous rollback allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set role authenticated;
do $$begin
  begin perform * from public.nonprofit_directory_categories; raise exception 'authenticated table readable'; exception when insufficient_privilege then null; end;
  begin perform public.test_categories('20000000-0000-4000-8000-000000000008',0,'022345678','["food"]'); raise exception 'authenticated publish allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set role service_role;
do $$begin
  begin perform public.test_categories('20000000-0000-4000-8000-000000000001',0,'022345678','["housing"]'); raise exception 'changed replay accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.test_categories('20000000-0000-4000-8000-000000000003',0,'022345678','["food_food_pantries"]'); raise exception 'service inference accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.test_categories('20000000-0000-4000-8000-000000000003',0,'022345678','["food","food"]'); raise exception 'duplicate topics accepted'; exception when invalid_parameter_value then null; end;
end$$;
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000004',0,'022345678','["housing"]',(select record_digest from public.nonprofit_category_sets where ein='022345678'))->'outcomes'->0->>'status')='updated','expected digest update failed');
select public.test_assert((public.rollback_nonprofit_category_chunk('20000000-0000-4000-8000-000000000001',0,'abcdefghijklmnopqrst')->>'preservedLaterChanges')::int=1,'rollback erased later mapping');
select public.test_assert((public.rollback_nonprofit_category_chunk('20000000-0000-4000-8000-000000000004',0,'abcdefghijklmnopqrst')->>'restored')::int=1,'mapping rollback failed');
select public.test_assert((select count(*)=2 from public.nonprofit_directory_categories where ein='022345678'),'rollback failed to restore topic set');
update public.nonprofit_directory set managed_by='owner' where ein='022345679';
select public.test_assert((public.rollback_nonprofit_category_chunk('20000000-0000-4000-8000-000000000001',1,'abcdefghijklmnopqrst')->>'preservedLaterChanges')::int=1,'rollback erased owner changes');
select public.test_assert((public.test_categories('20000000-0000-4000-8000-000000000005',0,'022345679','["housing"]')->'outcomes'->0->>'reason')='suppressed_or_manually_managed','owner protection failed');
update public.nonprofit_directory set suppressed_at=now() where ein='022345678';
reset role;
insert into public.resource_map_organizations(ein) values('02-2345679');
set role anon;
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('',null,'food',null,20))=0,'suppressed or curated identities exposed');
reset role;
-- Category receipts cannot alter the existing identity content/digest or imported status.
select public.test_assert((select content->>'name'='Food Research Foundation' from public.nonprofit_directory where ein='022345678'),'category writes changed identity');

select public.test_assert((select parent_key='faith' from public.resource_map_categories where key='community_faith_organizations'),'stable leaf parent not migrated');
select public.test_assert((select count(*)=4 from public.resource_map_categories where key in ('arts','faith','recreation','philanthropy') and parent_key is null),'new topics missing');
do $$declare record jsonb; good jsonb; bad jsonb; begin
  record:=jsonb_build_object('ein','022345678','categories','[]'::jsonb,'mappingVersion','irs-organization-topics-v1','basis','irs_classification','sourceHash',repeat('a',64));
  good:=jsonb_build_object('ein','022345678','recordText',record::text,'recordDigest',encode(sha256(convert_to(record::text,'UTF8')),'hex'));
  bad:=good||jsonb_build_object('ein','022345680','recordDigest',repeat('0',64));
  begin perform public.publish_nonprofit_category_chunk('30000000-0000-4000-8000-000000000001',repeat('a',64),0,jsonb_build_array(good)::text,'wrongtarget','test authorization'); raise exception 'wrong target accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.publish_nonprofit_category_chunk('30000000-0000-4000-8000-000000000001',repeat('a',64),0,jsonb_build_array(good,bad)::text,'abcdefghijklmnopqrst','test authorization'); raise exception 'invalid chunk accepted'; exception when invalid_parameter_value then null; end;
  perform public.test_assert(not exists(select 1 from public.nonprofit_category_chunks where batch_id='30000000-0000-4000-8000-000000000001'),'failed category chunk receipted');
end$$;
