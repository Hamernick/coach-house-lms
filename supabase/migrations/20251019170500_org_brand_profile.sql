set check_function_bodies = off;
set search_path = public;

-- Documentation comment: brand-related keys under organizations.profile JSONB
comment on column organizations.profile is $$
Brand profile JSON schema (selected keys):
  name            text
  tagline         text
  description     text
  publicUrl       text (website)
  newsletter      text (URL)
  twitter         text (URL)
  facebook        text (URL)
  linkedin        text (URL)
  instagram       text (URL)
  youtube         text (URL)
  tiktok          text (URL)
  github          text (URL)
  logoUrl         text (URL to logo image)
  boilerplate     text (reusable about text)
  brandPrimary    text (hex color, e.g., #0055FF)
  brandColors     text[] (array of hex colors)
Other keys may be present; JSON is additive and backward-compatible.
$$;

-- Broaden allowed image formats for org-media bucket to include SVG logos
update storage.buckets
set allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]
where id = 'org-media';

