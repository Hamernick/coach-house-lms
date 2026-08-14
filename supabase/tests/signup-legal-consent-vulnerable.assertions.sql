insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
values (
  '00000000-0000-0000-0000-000000000000',
  '{}'::jsonb,
  '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = '00000000-0000-0000-0000-000000000000'
  ) then
    raise exception 'pre-fix trigger unexpectedly rejected missing legal consent';
  end if;

  if exists (
    select 1
    from public.platform_legal_acceptances
    where user_id = '00000000-0000-0000-0000-000000000000'
  ) then
    raise exception 'pre-fix trigger unexpectedly recorded missing legal consent';
  end if;
end;
$$;

delete from auth.users
where id = '00000000-0000-0000-0000-000000000000';
