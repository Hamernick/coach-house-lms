-- Seed a demo class and three modules for canonical module pages.
do $$
declare
  v_class_id uuid;
begin
  insert into classes (id, title, slug, description, published)
  values (gen_random_uuid(), 'Foundations', 'foundations', 'Foundations overview, outcomes, prerequisites.', true)
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    published = excluded.published
  returning id into v_class_id;

  -- Module 1
  insert into modules (id, class_id, idx, slug, title, description, video_url, content_md, duration_minutes, published)
  values (
    gen_random_uuid(), v_class_id, 1, 'intro-and-goals', 'Module 1', 'Intro & goals',
    'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    '# Module 1 — Intro & goals\n\nWelcome to the course.\n\n- Understand the journey\n- Set expectations\n- Meet your cohort',
    8, true)
  on conflict (class_id, idx) do update set
    slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    video_url = excluded.video_url,
    content_md = excluded.content_md,
    duration_minutes = excluded.duration_minutes,
    published = excluded.published;

  -- Module 2
  insert into modules (id, class_id, idx, slug, title, description, video_url, content_md, duration_minutes, published)
  values (
    gen_random_uuid(), v_class_id, 2, 'core-concepts', 'Module 2', 'Core concepts',
    'https://www.youtube.com/watch?v=HhesaQXLuRY',
    '# Module 2 — Core concepts\n\nDig into fundamentals with examples and short exercises.',
    12, true)
  on conflict (class_id, idx) do update set
    slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    video_url = excluded.video_url,
    content_md = excluded.content_md,
    duration_minutes = excluded.duration_minutes,
    published = excluded.published;

  -- Module 3
  insert into modules (id, class_id, idx, slug, title, description, video_url, content_md, duration_minutes, published)
  values (
    gen_random_uuid(), v_class_id, 3, 'practice-recap', 'Module 3', 'Practice & recap',
    'https://www.youtube.com/watch?v=oHg5SJYRHA0',
    '# Module 3 — Practice & recap\n\nApply what you''ve learned and summarize key takeaways.',
    10, true)
  on conflict (class_id, idx) do update set
    slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    video_url = excluded.video_url,
    content_md = excluded.content_md,
    duration_minutes = excluded.duration_minutes,
    published = excluded.published;
end $$;

