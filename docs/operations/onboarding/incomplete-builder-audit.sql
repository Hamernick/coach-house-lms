-- READ ONLY. Run through the existing authorized SQL surface.
-- Compare created_at against the approved fix's production activation time.
-- Existing rows are a recovery backlog; this query does not authorize repairs.
-- Member intents and platform staff are excluded by the documented gate.
with candidates as (
  select o.user_id as org_owner_id, o.created_at, o.updated_at,
         jsonb_typeof(o.profile->'name') = 'string'
           and nullif(btrim(o.profile->>'name'), '') is not null as has_name,
         nullif(btrim(o.public_slug), '') is not null as has_url,
         coalesce(o.profile->>'formationStatus' in
           ('pre_501c3', 'in_progress', 'approved'), false) as has_formation
  from public.organizations o
  join auth.users u on u.id = o.user_id
  left join public.profiles p on p.id = u.id
  where u.raw_user_meta_data->>'onboarding_intent_focus' = 'build'
    and u.raw_user_meta_data->>'onboarding_completed' = 'true'
    and coalesce(p.role::text, '') <> 'admin'
    and not exists (
      select 1 from public.platform_staff_members s where s.user_id = u.id
    )
)
select org_owner_id, created_at, updated_at,
       not coalesce(has_name, false) as missing_name,
       not has_url as missing_url,
       not has_formation as missing_formation
from candidates
where not coalesce(has_name, false) or not has_url or not has_formation
order by created_at, org_owner_id;
