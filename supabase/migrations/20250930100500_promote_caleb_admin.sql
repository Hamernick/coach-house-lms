set search_path = public;

-- Promote a known user to admin by email.
-- Safe to re-run; does nothing if the email does not exist.
do $$ begin
  update profiles
     set role = 'admin'
   where id in (
     select id from auth.users where lower(email) = lower('caleb@bandto.com')
   );
end $$;

