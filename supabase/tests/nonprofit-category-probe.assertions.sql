set local role anon;
do $$declare c record; begin
  for c in select * from category_probe_cases loop
    perform public.test_assert(public.search_nonprofit_directory_v2(c.q,c.state,c.category,c.cursor,c.lim)=c.expected,
      format('category probe changed results: %s',row_to_json(c)));
  end loop;
  perform public.test_assert(public.search_nonprofit_directory_v2('meteorite',null,'food',null,21)->0->>'ein'='900000256',
    'sparse fallback missed first visible match beyond probe');
  perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('meteorite',null,'food',null,21))=2,
    'sparse fallback omitted later matches or exposed suppressed match');
  perform public.test_assert(jsonb_array_length(public.search_nonprofit_directory_v2('food',null,'food','900000000',101))=101,
    'maximum page was truncated to probe matches');
  perform public.test_assert(public.search_nonprofit_directory_v2('food',null,'food','900000000',1)->0->>'ein'='900000004',
    'probe bypassed public exclusions');
end$$;
reset role;
select public.test_assert(not exists(select 1 from category_probe_settings s join pg_proc p using(oid)
  where (s.proconfig,s.prosecdef,s.proacl,s.proowner) is distinct from (p.proconfig,p.prosecdef,p.proacl,p.proowner)),
  'category function settings, security, grants or ownership changed');
set local role authenticated;
select public.test_assert(public.search_nonprofit_directory_v2('meteorite',null,'food',null,21)=
  (select expected from category_probe_cases where q='meteorite' and state is null and category='food' and cursor is null and lim=21),
  'authenticated fallback differs');
reset role;
select count(*) as category_probe_equivalence_cases from category_probe_cases;
