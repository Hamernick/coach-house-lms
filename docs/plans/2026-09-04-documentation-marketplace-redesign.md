# Documentation and Marketplace redesign

User direction: create a branch, prepare the documentation work for push, remove
generic/redundant UI, make tools useful, and build a Marketplace for software,
resources, and people beginning with Joel, Paula, and Franklin. Preserve the full
scope through continuation. Branch: `feat/documentation-marketplace-design-20260904`.
Baseline checkpoint: `3d404002`. Review worktree remains
`coach-house-platform-documentation-20260831`, port 3010.

## Design diagnosis

The previous pass improved spacing but left the underlying problems: long
introductions before tools, four stages of guidance shown at once, repeated
readiness counts followed by disclaimers explaining why the counts mean little,
large duplicate draft previews, and resource cards containing procurement forms.
The Marketplace buries useful offers and named people under several screens of
general advice. Rounded corners alone cannot fix this.

Use the three supplied references: compact documentation hierarchy, spacious
rounded feature panels, direct task links, and selected colorful covers. Keep the
Coach House shell and theme system. Use color for distinct pathways and people,
not decorative metrics. Short descriptive titles replace generated slogans.

## Requirements and evidence

- [x] Create a branch and preserve the current work in a local checkpoint.
- [x] Documentation home: clear starting tasks, compact navigation, rounded
  feature surfaces, purposeful color, and no duplicate home-page explanations.
- [x] Guide/tool relationship: make interactive work immediately accessible;
  keep reading, source material, and existing deep links available.
- [x] Planner UX: group work into understandable steps, preserve saved drafts,
  prevent accidental example replacement, and prioritize a useful output over
  repeated scoring, disclaimers, and AI-prompt text. Review every planner and
  materially improve the campaign/audience/fundraising journeys.
- [x] Marketplace: distinct Tools & resources and People views with URL state,
  effective search, filters, concise cards, useful details, saved resources,
  exports, and real empty/error states.
- [x] People: show Joel Hamernick, Paula Hamernick, and Franklin Ballenger with
  accurate public information and actionable links. Reuse the actual booking
  scope (currently Joel + Paula jointly); do not invent Franklin availability.
  Connect opt-in public member profiles and retain publication/privacy checks.
- [x] Resource discovery: expand the curated collection with verified software,
  nonprofit offers, creative help, resource banks, and peer communities, including
  Design Gigs for Good. Every entry needs an official source and specific next
  steps, not just another external link.
- [x] Google Ad Grants: correct the offer to up to USD 10,000/month in Search ads
  for eligible organizations; explain eligibility, activation, conversion setup,
  and a realistic first campaign for fundraising, volunteers, or program reach.
  Link the guide to a usable campaign planning workflow.
- [x] QA: preserve calculations, local storage and exports; cover public profile
  privacy, missing/unpublished data, back/forward state, keyboard, mobile, and
  both themes. Inspect real screenshots against the supplied references.
- [x] Release preparation: update Graphify, intentional visual baselines, the
  monthly runlog, and a clear PR/release description; commit reviewable changes
  and pass the full quality/pre-push gates. Actual push/deployment is separate.

## Implementation sequence

1. Research offers and coach/profile data; define public directory contracts.
2. Build useful resource details and the two Marketplace views with real people.
3. Rework the documentation home, article/tool navigation, and planner workflows.
4. Exercise complete journeys, refine screenshots, then validate and prepare
   local commits for push. Do not narrow completion to an attractive landing page.

## Initial evidence

- Google: https://www.google.com/grants/faq/ and
  https://support.google.com/google-ads/answer/57772?hl=en (2026-09-04).
- Design Gigs for Good: https://www.designgigsforgood.org/ links a free design
  and social-impact job board and a community; the user-supplied board is
  https://groups.google.com/g/design-gigs-for-good (2026-09-04).
- Coach House: https://www.coachhousesolutions.org/about documents Joel, Paula,
  and Franklin Ballenger. Existing coaching config and calendars support joint
  Joel/Paula meetings; public person profiles already have explicit `is_public`
  and canonical handles. No provider or profile publication writes are needed.
