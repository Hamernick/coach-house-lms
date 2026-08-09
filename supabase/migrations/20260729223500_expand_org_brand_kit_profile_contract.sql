set check_function_bodies = off;
set search_path = public;

-- Organization profile data remains additive JSONB. This contract documents the
-- Brand Kit keys written by the Organization editor and consumed by exports.
comment on column public.organizations.profile is $$
Organization profile JSON schema (selected keys):
  name                       text
  tagline                    text
  description                text
  publicUrl                  text (website URL)
  newsletter                 text (URL)
  twitter                    text (URL)
  facebook                   text (URL)
  linkedin                   text (URL)
  instagram                  text (URL)
  youtube                    text (URL)
  tiktok                     text (URL)
  github                     text (URL)

Brand Kit assets:
  logoUrl                    text (primary logo URL)
  brandMarkUrl               text (compact logo mark URL)
  headerUrl                  text (banner image URL)

Brand Kit colors and typography:
  brandPrimary               text (six-digit hex color)
  brandColors                text[] (Dark, Light, Accent, then optional supporting colors)
  brandThemePresetId         text
  brandAccentPresetId        text
  brandTypographyPresetId    text
  brandTypography            jsonb ({ headings, body, code })

Brand Voice:
  brandVoiceAudience         text
  brandVoiceTone             text
  brandVoiceStyle            text
  brandVoicePersonality      text
  brandVoiceGuidelines       text
  brandVoiceAvoid            text (newline-delimited guidance)

Legacy:
  boilerplate                text (retained for backward compatibility; no longer edited)

Other keys may be present. The profile object is additive and backward-compatible.
$$;
