-- Seed baseline data for Coach House LMS local development.
set search_path = public;

insert into classes (id, title, slug, description, stripe_product_id, stripe_price_id, published)
values
  (
    gen_random_uuid(),
    'Coach House Foundations',
    'coach-house-foundations',
    'Orientation modules to help new students ramp quickly.',
    null,
    null,
    true
  ),
  (
    gen_random_uuid(),
    'Advanced Facilitation',
    'advanced-facilitation',
    'Deep dives into live session delivery and engagement tactics.',
    null,
    null,
    false
  )
  on conflict do nothing;

with class_lookup as (
  select id from classes where slug = 'coach-house-foundations' limit 1
)
insert into modules (class_id, idx, slug, title, description, video_url, content_md, duration_minutes)
select
  class_lookup.id,
  data.idx,
  data.slug,
  data.title,
  data.description,
  data.video_url,
  data.content_md,
  data.duration_minutes
from class_lookup,
  (values
    (1, 'welcome', 'Welcome to Coach House', 'Quick orientation for first-time learners.', 'https://youtu.be/dQw4w9WgXcQ', '# Welcome!\nThis is where your journey starts.', 5),
    (2, 'setup', 'Platform Setup', 'Steps to get your account configured and ready.', null, '# Setup\nFollow these steps to get started.', 8)
  ) as data(idx, slug, title, description, video_url, content_md, duration_minutes)
on conflict (class_id, slug) do nothing;

with class_lookup as (
  select id from classes where slug = 'coach-house-foundations' limit 1
)
insert into schedule_events (class_id, title, description, start_at, duration_minutes, event_type)
select
  class_lookup.id,
  data.title,
  data.description,
  timezone('utc', now()) + data.offset,
  data.duration_minutes,
  data.event_type
from class_lookup,
  (values
    ('Live coaching session', 'Join the weekly cohort Q&A to discuss progress.', interval '1 day', 60, 'session'),
    ('Module 3 milestone', 'Submit the reflection assignment for Module 3.', interval '3 days', 0, 'deadline'),
    ('Peer workshop', 'Collaborative workshop with breakout groups.', interval '5 days', 90, 'workshop')
  ) as data(title, description, offset, duration_minutes, event_type)
where not exists (
  select 1
  from schedule_events existing
  where existing.class_id = class_lookup.id
    and existing.title = data.title
);
