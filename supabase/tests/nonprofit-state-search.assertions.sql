-- Exact JSON equality includes membership, order, limits and every public field.
set local role anon;
do $$declare c record; begin
  for c in select * from state_search_cases loop
    perform public.test_assert(public.search_nonprofit_directory(c.q,c.state,c.cursor,c.lim)=c.v1,
      format('v1 result changed: %s',row_to_json(c)));
    perform public.test_assert(public.search_nonprofit_directory_v2(c.q,c.state,c.category,c.cursor,c.lim)=c.v2,
      format('v2 result changed: %s',row_to_json(c)));
  end loop;
  perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory('the','IL',null,20))=0,'stop-word query broadened to state browse');
  perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food','IN',null,20))>0,'stop-word state lost matches');
  perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory('food','IL',null,20))=3,'hidden records leaked or visible matches lost');
end$$;
reset role;
select public.test_assert(not exists(select 1 from state_search_settings s join pg_proc p using(oid)
  where (s.proconfig,s.prosecdef,s.proacl,s.proowner) is distinct from (p.proconfig,p.prosecdef,p.proacl,p.proowner)),
  'function configuration, security, grants or ownership changed');
set local role authenticated;
select public.test_assert(public.search_nonprofit_directory('food','IL',null,3)=
  (select v1 from state_search_cases where q='food' and state='IL' and cursor is null limit 1),
  'authenticated search differs');
reset role;
select count(*) as equivalence_cases from state_search_cases;
rollback;
