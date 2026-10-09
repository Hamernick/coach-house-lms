-- Exercise dense pages, exhausted categories, and matches beyond the probe.
create temp table category_probe_settings as
select oid,proconfig,prosecdef,proacl,proowner from pg_proc
where oid='public.search_nonprofit_directory_v2(text,text,text,text,integer)'::regprocedure;
insert into public.nonprofit_directory(ein,content,record_digest,policy_version,suppressed_at)
select (900000000+n)::text,jsonb_build_object('ein',(900000000+n)::text,
  'name',case when n%4=0 then 'Housing Food Center' else 'Food Center' end,
  'state',case when n%2=0 then 'OR' else 'IL' end,
  'description',case when n in (129,256,599) then 'Meteorite research' else 'Community assistance' end),
  repeat('c',64),'category-probe-test',case when n in (1,129) then now() end
from generate_series(1,600) n;
insert into public.organizations(ein) values('900000002');
insert into public.resource_map_organizations(ein) values('900000003');
insert into public.nonprofit_category_sets(ein,content,record_digest)
select ein,jsonb_build_object('ein',ein),repeat('c',64) from public.nonprofit_directory
where policy_version='category-probe-test';
insert into public.nonprofit_directory_categories(ein,category)
select ein,'food' from public.nonprofit_directory where policy_version='category-probe-test'
union all select ein,'faith' from public.nonprofit_directory where ein between '900000001' and '900000128'
union all select ein,'recreation' from public.nonprofit_directory where ein between '900000001' and '900000064';
create temp table category_probe_cases as
select q,state,category,cursor,lim,public.search_nonprofit_directory_v2(q,state,category,cursor,lim) expected
from unnest(array['food','meteorite','unmatchedtoken','the','food -housing','"food center"','food OR meteorite','-food','','900000256']::text[]) q
cross join unnest(array[null,'OR','IL']::text[]) state
cross join unnest(array['food','faith','recreation','absent_category']::text[]) category
cross join unnest(array[null,'900000001','900000127','900000128','900000255','900000590','999999999']::text[]) cursor
cross join unnest(array[1,21,101]) lim;
grant select on category_probe_cases to anon,authenticated;
