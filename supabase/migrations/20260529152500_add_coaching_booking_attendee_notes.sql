alter table if exists public.coaching_bookings
  add column if not exists attendee_notes text;
