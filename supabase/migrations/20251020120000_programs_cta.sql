set check_function_bodies = off;
set search_path = public;

-- Add CTA fields for programs
alter table programs add column if not exists cta_label text;
alter table programs add column if not exists cta_url text;

