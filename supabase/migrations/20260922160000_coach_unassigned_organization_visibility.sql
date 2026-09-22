alter table public.platform_staff_members
  add column if not exists can_access_unassigned_organizations boolean not null default false;

comment on column public.platform_staff_members.can_access_unassigned_organizations is
  'Allows a coach to access organizations with no coach assignments while assigned-only scope remains enabled.';

-- Grant the requested visibility to the two verified production Auth identities.
update public.platform_staff_members as staff
set can_access_unassigned_organizations = true
from public.profiles as profile
where profile.id = staff.user_id
  and staff.access_level = 'coach'
  and (
    (staff.user_id = '64cf262e-e526-4601-8a2a-f50d1c11c8c2' and profile.email = 'joel@coachhousesolutions.org')
    or (staff.user_id = 'c5405481-cea7-418a-b0c3-531ec942c047' and profile.email = 'paula@coachhousesolutions.org')
  );
