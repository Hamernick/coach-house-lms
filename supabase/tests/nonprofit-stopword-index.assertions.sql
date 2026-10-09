select public.test_assert((select indisvalid from pg_index where indexrelid='public.nonprofit_directory_stopword_state_search_idx'::regclass), 'stop-word index invalid');
select public.test_assert((select reloptions @> array['fastupdate=off'] from pg_class where oid='public.nonprofit_directory_stopword_state_search_idx'::regclass), 'stop-word index may accumulate pending entries');
-- Synthetic plan fixture stays in the disposable database and is rolled back.
insert into public.nonprofit_directory(ein,content,record_digest,policy_version)
select (900000000+i)::text,
  jsonb_build_object('ein',(900000000+i)::text,
    'name',case when i%37=0 then 'Food Pantry' else 'Community Center' end,
    'state',case i%100 when 0 then 'IN' when 1 then 'OR' when 2 then 'ME' when 3 then 'AS' else 'CA' end),
  repeat('a',64),'stopword-index-test'
from generate_series(1,20000)i;
analyze public.nonprofit_directory;

-- Function-local force_custom_plan must permit parameter substitution before
-- checking whether the state implies the partial-index predicate.
set local plan_cache_mode=force_custom_plan;
prepare stopword_index_query(text,text) as
  select ein,item from public.nonprofit_directory_public
  where search_document @@ websearch_to_tsquery('english',$1)
    and state=$2 and ein>'900000000'
  order by ein limit 21;
do $$declare s text; plan json; begin
  foreach s in array array['IN','OR','ME','AS'] loop
    execute format('explain(format json) execute stopword_index_query(%L,%L)','food',s) into plan;
    perform public.test_assert(plan::text like '%nonprofit_directory_stopword_state_search_idx%',
      'custom query did not use stop-word-state index: '||s||' '||plan::text);
  end loop;
  execute 'explain(format json) execute stopword_index_query(''food'',''CA'')' into plan;
  perform public.test_assert(plan::text not like '%nonprofit_directory_stopword_state_search_idx%',
    'partial index used for an uncovered state');
end$$;
deallocate stopword_index_query;

-- Generated search documents and partial-index membership follow later fills,
-- state corrections and suppression, including read visibility after each edit.
insert into public.nonprofit_directory(ein,content,record_digest,policy_version)
values('999999991','{"ein":"999999991","name":"Food Canary","state":"IN"}',repeat('a',64),'stopword-index-test');
set local role anon;
select public.test_assert(public.search_nonprofit_directory('food','IN','999999990',21)->0->>'ein'='999999991','new eligible row absent');
reset role;
update public.nonprofit_directory set content=jsonb_set(content,'{state}','"CA"') where ein='999999991';
set local role anon;
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food','IN','999999990',21))=0,'state correction left stale match');
select public.test_assert(public.search_nonprofit_directory('food','CA','999999990',21)->0->>'ein'='999999991','state correction lost row');
reset role;
update public.nonprofit_directory set content=jsonb_set(content,'{state}','"OR"'),suppressed_at=now() where ein='999999991';
set local role anon;
select public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food','OR','999999990',21))=0,'suppressed row became visible');
reset role;
