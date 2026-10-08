-- Projection backfill changes no canonical values and remains idempotent.
select public.test_assert(not exists(select 1 from public.nonprofit_directory_categories c
  join public.nonprofit_directory d using(ein) where d.policy_version='category-probe-test'
  and c.search_document is distinct from d.search_document),'backfill text differs');
select public.test_assert((public.backfill_nonprofit_category_search(array['900000256'],'abcdefghijklmnopqrst')->>'assignments')::int=0,'backfill not idempotent');
set local role anon;
do $$begin
  begin perform public.backfill_nonprofit_category_search(array['900000256'],'abcdefghijklmnopqrst');
    raise exception 'anonymous backfill allowed'; exception when insufficient_privilege then null; end;
  begin perform search_document from public.nonprofit_directory_categories;
    raise exception 'private search text exposed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set local role authenticated;
do $$begin
  begin perform public.backfill_nonprofit_category_search(array['900000256'],'abcdefghijklmnopqrst');
    raise exception 'authenticated backfill allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set local role service_role;
do $$begin
  begin perform public.backfill_nonprofit_category_search(array['900000256'],'wrong-target');
    raise exception 'wrong target allowed'; exception when invalid_parameter_value then null; end;
  begin perform public.backfill_nonprofit_category_search(array[]::text[],'abcdefghijklmnopqrst');
    raise exception 'empty backfill allowed'; exception when invalid_parameter_value then null; end;
  begin perform public.backfill_nonprofit_category_search(array_fill('900000256'::text,array[101]),'abcdefghijklmnopqrst');
    raise exception 'oversized backfill allowed'; exception when invalid_parameter_value then null; end;
  begin perform public.backfill_nonprofit_category_search(array[null]::text[],'abcdefghijklmnopqrst');
    raise exception 'null EIN allowed'; exception when invalid_parameter_value then null; end;
end$$;
-- Canonical changes propagate to all category rows in the same transaction.
update public.nonprofit_directory set content=jsonb_set(content,'{description}','"Zephyr clinic"') where ein='900000256';
select public.test_assert(public.search_nonprofit_directory_v2('zephyr',null,'food',null,21)->0->>'ein'='900000256','new text missing');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('meteorite',null,'food',null,21))=1,'old text retained');
-- Even a direct privileged projection write is overwritten from canonical text.
update public.nonprofit_directory_categories set search_document=to_tsvector('english','forgedtoken') where ein='900000256';
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('forgedtoken',null,'food',null,21))=0,'forged text retained');
insert into public.nonprofit_directory_categories(ein,category) values('900000256','education');
select public.test_assert(public.search_nonprofit_directory_v2('zephyr',null,'education',null,21)->0->>'ein'='900000256','category insert not copied');
update public.nonprofit_directory_categories set category='health' where ein='900000256' and category='education';
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('zephyr',null,'education',null,21))=0,'old category retained');
select public.test_assert(public.search_nonprofit_directory_v2('zephyr',null,'health',null,21)->0->>'ein'='900000256','category update lost text');
delete from public.nonprofit_directory_categories where ein='900000256' and category='health';
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('zephyr',null,'health',null,21))=0,'deleted category remained');
update public.nonprofit_directory set suppressed_at=now() where ein='900000256';
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('zephyr',null,'food',null,21))=0,'suppression bypassed');
update public.nonprofit_directory set suppressed_at=null where ein='900000256';
reset role;
insert into public.organizations(ein) values('900-000-256');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('zephyr',null,'food',null,21))=0,'platform exclusion bypassed');
delete from public.organizations where ein='900-000-256';
insert into public.resource_map_organizations(ein) values('900000256');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('zephyr',null,'food',null,21))=0,'curated exclusion bypassed');
delete from public.resource_map_organizations where ein='900000256';
-- Restore a snapshot/receipt written before the projection column existed.
select public.test_assert((public.rollback_nonprofit_category_chunk('40000000-0000-4000-8000-000000000003',0,'abcdefghijklmnopqrst')->>'restored')::int=1,'pre-migration receipt rollback failed');
select public.test_assert((select c.category='food' and c.search_document=d.search_document from public.nonprofit_directory_categories c join public.nonprofit_directory d using(ein) where c.ein='800000001'),'old receipt restoration did not populate canonical text');
-- Outer transaction rollback restores both canonical and copied text atomically.
savepoint before_text_change;
update public.nonprofit_directory set content=jsonb_set(content,'{description}','"Temporary text"') where ein='900000256';
rollback to before_text_change;
select public.test_assert(public.search_nonprofit_directory_v2('zephyr',null,'food',null,21) @> '[{"ein":"900000256"}]'::jsonb,'text rollback diverged');
delete from public.nonprofit_directory where ein='900000256';
select public.test_assert(not exists(select 1 from public.nonprofit_directory_categories where ein='900000256'),'identity delete left projection');
