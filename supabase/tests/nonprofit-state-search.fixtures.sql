-- Snapshot the previous public behavior in the disposable test database.
begin;
create temp table state_search_settings as
select oid,proconfig,prosecdef,proacl,proowner from pg_proc where oid in (
  'public.search_nonprofit_directory(text,text,text,integer)'::regprocedure,
  'public.search_nonprofit_directory_v2(text,text,text,text,integer)'::regprocedure);
create temp table state_search_states as
select state,ordinality n from unnest(array[
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY','AS','GU','MP','PR','VI','ZZ',null]::text[]) with ordinality s(state,ordinality);
insert into public.nonprofit_directory(ein,content,record_digest,policy_version,suppressed_at)
select lpad((800000000+s.n*100+v.n)::text,9,'0'),
  jsonb_build_object('ein',lpad((800000000+s.n*100+v.n)::text,9,'0'),
    'name',v.name,'state',s.state,'city','Test City','description',v.description),
  repeat('a',64),'state-search-test',case when v.n=8 then now() end
from state_search_states s cross join (values
  (1,'Food Pantry','Fresh food and meals'),(2,'Food Bank','Pantry assistance'),
  (3,'Housing Center','Shelter and assistance'),(4,'Food Housing Alliance','Food and housing'),
  (5,'Community Center','Arts and meals'),(6,'Food Curated','Should be excluded'),
  (7,'Food Platform','Should be excluded'),(8,'Food Suppressed','Should be excluded')
) v(n,name,description);
insert into public.resource_map_organizations(ein)
select ein from public.nonprofit_directory where policy_version='state-search-test' and name='Food Curated';
insert into public.organizations(ein)
select ein from public.nonprofit_directory where policy_version='state-search-test' and name='Food Platform';
insert into public.nonprofit_category_sets(ein,content,record_digest)
select ein,jsonb_build_object('ein',ein),repeat('a',64) from public.nonprofit_directory where policy_version='state-search-test';
insert into public.nonprofit_directory_categories(ein,category)
select ein,'food' from public.nonprofit_category_sets where ein like '800%';

create temp table state_search_cases as
select q,state,category,cursor,lim,
  public.search_nonprofit_directory(q,state,cursor,lim) v1,
  public.search_nonprofit_directory_v2(q,state,category,cursor,lim) v2
from state_search_states cross join unnest(array[
  '',null,'  ','the','!!!','in or me','food','"food pantry"','food OR housing',
  'food -housing','-food','"food and housing"','food OR -housing','800001401','80-0001401'
]::text[]) q cross join unnest(array[null,'food','food_food_pantries']::text[]) category
cross join (values(null::text,3),('800001401',1),('800005701',101)) pages(cursor,lim);
grant select on state_search_cases to anon,authenticated;
