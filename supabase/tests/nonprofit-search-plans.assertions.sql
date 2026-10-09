-- Reused database sessions must retain bounded, parameter-aware RPC planning.
-- Run against the existing disposable database, never the live catalog.
begin;
select public.test_assert((select count(*)=2 from pg_proc
  where oid in ('public.search_nonprofit_directory(text,text,text,integer)'::regprocedure,
    'public.search_nonprofit_directory_v2(text,text,text,text,integer)'::regprocedure)
  and prosecdef
  and proconfig @> array['plan_cache_mode=force_custom_plan','statement_timeout=3s','search_path=""']),
  'search RPC planning, deadline or definer boundary regressed');

select public.test_chunk('40000000-0000-4000-8000-000000000001',0,'033456781','Food Search First');
select public.test_chunk('40000000-0000-4000-8000-000000000001',1,'033456782','Food Search Second');
select public.test_categories('40000000-0000-4000-8000-000000000002',0,'033456781','["food"]');
select public.test_categories('40000000-0000-4000-8000-000000000002',1,'033456782','["food"]');

-- Force a hostile caller setting and exceed the automatic generic-plan trial
-- count. Function-local configuration must restore the caller after each call.
set local plan_cache_mode = force_generic_plan;
set local role anon;
do $$begin
  for i in 1..8 loop
    perform public.test_assert(public.search_nonprofit_directory('food','IL','033456780',1)->0->>'ein'='033456781','text/state/limit search regressed');
    perform public.test_assert(public.search_nonprofit_directory('food','IL','033456781',1)->0->>'ein'='033456782','text cursor regressed');
    perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food','NY',null,1))=0,'state filter regressed');
    perform public.test_assert(public.search_nonprofit_directory('03-3456781',null,null,1)->0->>'ein'='033456781','EIN lookup regressed');
    perform public.test_assert(public.search_nonprofit_directory('',null,'033456780',1)->0->>'ein'='033456781','empty query browse regressed');
    perform public.test_assert(public.search_nonprofit_directory_v2('food','IL',null,'033456780',1)->0->>'ein'='033456781','nested v1 fallback regressed');
    perform public.test_assert(public.search_nonprofit_directory_v2('food','IL','food','033456781',1)->0->>'ein'='033456782','category text/cursor regressed');
    perform public.test_assert(public.search_nonprofit_directory_v2('',null,'food','033456780',1)->0->>'ein'='033456781','category-only browse regressed');
    perform public.test_assert(current_setting('plan_cache_mode')='force_generic_plan','function planning setting leaked into caller');
  end loop;
end$$;
reset role;

-- The optimization must retain suppression and curated-identity exclusion.
update public.nonprofit_directory set suppressed_at=now() where ein='033456781';
insert into public.resource_map_organizations(ein) values('03-3456782');
set local role anon;
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food',null,'033456780',20))=0,'text search leaked hidden records');
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('',null,'food','033456780',20))=0,'category search leaked hidden records');
reset role;
rollback;
