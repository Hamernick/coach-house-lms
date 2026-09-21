insert into public.google_calendar_connections(user_id,google_subject,google_email,refresh_secret,enabled)
values ('00000000-0000-0000-0000-000000000001','google-a','test@example.invalid','{"ciphertext":"encrypted"}',true);
insert into public.google_calendar_oauth_intents(user_id,state_sha256,verifier,expires_at)
values ('00000000-0000-0000-0000-000000000001',repeat('a',64),'{"ciphertext":"encrypted"}',now()+interval '10 minutes');

set role anon;
do $$ begin
  begin perform * from public.google_calendar_connections; raise exception 'Anonymous credentials readable';
  exception when insufficient_privilege then null; end;
  begin perform * from public.google_calendar_oauth_intents; raise exception 'Anonymous intents readable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$ begin
  begin perform * from public.google_calendar_connections; raise exception 'Owner credentials readable';
  exception when insufficient_privilege then null; end;
  begin update public.google_calendar_connections set enabled=false; raise exception 'Direct owner mutation allowed';
  exception when insufficient_privilege then null; end;
  begin delete from public.google_calendar_oauth_intents; raise exception 'Direct intent consumption allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$ begin
  begin perform * from public.google_calendar_connections; raise exception 'Board member personal cache readable';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role service_role;
do $$
declare old_revision uuid; new_revision uuid := gen_random_uuid(); affected integer;
begin
  select revision into old_revision from public.google_calendar_connections limit 1;
  update public.google_calendar_connections set revision=new_revision,lease_id=gen_random_uuid()
    where revision=old_revision;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'First worker cannot claim'; end if;
  update public.google_calendar_connections set lease_id=gen_random_uuid() where revision=old_revision;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Concurrent worker incorrectly claims'; end if;
  update public.google_calendar_connections set enabled=false, revision=gen_random_uuid(), lease_id=null where revision=new_revision;
  update public.google_calendar_connections set last_synced_at=now() where revision=new_revision;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Paused sync writes stale result'; end if;
  delete from public.google_calendar_oauth_intents where state_sha256=repeat('a',64);
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Intent cannot be consumed'; end if;
  delete from public.google_calendar_oauth_intents where state_sha256=repeat('a',64);
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Intent replay accepted'; end if;
end $$;
reset role;
do $$ begin
  if exists(select 1 from pg_class where relname in ('google_calendar_connections','google_calendar_oauth_intents')
    and (not relrowsecurity or not relforcerowsecurity)) then raise exception 'RLS missing'; end if;
end $$;
