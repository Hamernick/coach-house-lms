create table auth.users(id uuid primary key);
alter table profiles add column full_name text, add column email text;
insert into profiles(id,role,full_name,email) values('00000000-0000-4000-8000-000000000003','member','Unrelated user','unrelated@example.test');
insert into auth.users select id from profiles;
update profiles set full_name='Assigning admin' where id='00000000-0000-4000-8000-000000000001';
update profiles set full_name='Assigned coach' where id='00000000-0000-4000-8000-000000000002';
create table public.platform_staff_members(user_id uuid primary key references profiles(id), access_level text);
insert into public.platform_staff_members values('00000000-0000-4000-8000-000000000001','developer'),('00000000-0000-4000-8000-000000000002','coach');
