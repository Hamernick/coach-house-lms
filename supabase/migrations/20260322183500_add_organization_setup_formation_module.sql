set check_function_bodies = off;
set search_path = public;

do $$
declare
  v_electives_class_id uuid;
  v_existing_setup_module_id uuid;
begin
  select id
  into v_electives_class_id
  from classes
  where slug = 'electives'
  limit 1;

  if v_electives_class_id is null then
    raise exception 'Unable to seed organization setup module: class slug "electives" not found.';
  end if;

  -- Shift core Formation modules out of the way to avoid unique-index collisions
  -- before we place Organization setup at index 4.
  update modules
  set
    idx = case
      when slug = 'naming-your-nfp' then 105
      when slug = 'nfp-registration' then 106
      when slug = 'filing-1023' then 107
      else idx
    end,
    index_in_class = case
      when slug = 'naming-your-nfp' then 105
      when slug = 'nfp-registration' then 106
      when slug = 'filing-1023' then 107
      else index_in_class
    end,
    position = case
      when slug = 'naming-your-nfp' then 105
      when slug = 'nfp-registration' then 106
      when slug = 'filing-1023' then 107
      else position
    end
  where class_id = v_electives_class_id
    and slug in ('naming-your-nfp', 'nfp-registration', 'filing-1023');

  select id
  into v_existing_setup_module_id
  from modules
  where class_id = v_electives_class_id
    and slug in (
      'organization-setup',
      'workspace-setup',
      'workspace-onboarding-organization-setup'
    )
  order by
    case slug
      when 'organization-setup' then 0
      when 'workspace-setup' then 1
      else 2
    end
  limit 1;

  if v_existing_setup_module_id is null then
    insert into modules (
      class_id,
      idx,
      index_in_class,
      position,
      slug,
      title,
      description,
      is_published
    )
    values (
      v_electives_class_id,
      4,
      4,
      4,
      'organization-setup',
      'Organization setup',
      'Set up your organization workspace before continuing Formation.',
      true
    );
  else
    update modules
    set
      idx = 4,
      index_in_class = 4,
      position = 4,
      slug = 'organization-setup',
      title = 'Organization setup',
      is_published = true
    where id = v_existing_setup_module_id;
  end if;

  update modules
  set
    idx = case
      when slug = 'naming-your-nfp' then 5
      when slug = 'nfp-registration' then 6
      when slug = 'filing-1023' then 7
      else idx
    end,
    index_in_class = case
      when slug = 'naming-your-nfp' then 5
      when slug = 'nfp-registration' then 6
      when slug = 'filing-1023' then 7
      else index_in_class
    end,
    position = case
      when slug = 'naming-your-nfp' then 5
      when slug = 'nfp-registration' then 6
      when slug = 'filing-1023' then 7
      else position
    end,
    is_published = true
  where class_id = v_electives_class_id
    and slug in ('naming-your-nfp', 'nfp-registration', 'filing-1023');

  insert into module_content (module_id)
  select m.id
  from modules m
  where m.class_id = v_electives_class_id
    and m.slug = 'organization-setup'
  on conflict (module_id) do nothing;
end $$;
