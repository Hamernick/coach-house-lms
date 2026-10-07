-- Stable leaf IDs preserve existing assignments and category URLs.
insert into public.resource_map_categories(key,label,parent_key,sort_order,marker_color,icon_name,aliases,description)
values
  ('arts','Arts & Culture',null,160,'#d97706','book-open',array['arts','culture','museums'],'Arts, culture, museums, and humanities organizations.'),
  ('faith','Faith & Religion',null,170,'#64748b','building-2',array['faith','religion','religious'],'Religious and spiritual organizations.'),
  ('recreation','Sports & Recreation',null,180,'#0891b2','users-round',array['sports','recreation','athletics'],'Sports, recreation, and leisure organizations.'),
  ('philanthropy','Philanthropy & Grantmaking',null,190,'#059669','hand-coins',array['philanthropy','grantmaking','grantmakers'],'Foundations, grantmakers, and charitable giving organizations.')
on conflict(key) do nothing;
update public.resource_map_categories set parent_key=case
  when key='community_arts_culture' then 'arts'
  when key='community_faith_organizations' then 'faith'
  else 'recreation' end, updated_at=now()
where parent_key='community' and key in ('community_arts_culture','community_faith_organizations','community_sports','community_recreation');
