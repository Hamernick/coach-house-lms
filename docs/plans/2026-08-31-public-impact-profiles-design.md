# Public Impact Profiles

## Product outcome

Coach House public identity becomes a shared layer for people, organizations,
programs, resources, and measurable community activity. The eventual canonical
URLs are `coachhouse.app/<handle>` for people and organizations,
`coachhouse.app/<organization>/<program>` for programs, and
`coachhouse.app/go/<code>` for tracked outbound resources.

The root route will eventually become the current Find experience. That route
cutover is intentionally last so existing public links remain stable while the
new namespace is introduced.

## Profile layout

The profile is centered, quiet, and single-column rather than a dashboard.

1. Identity header: circular avatar or organization mark, display name,
   `@handle`, short headline, location, and one primary action.
2. Affiliation row: compact organization marks and meaningful badges. Badges
   represent verified roles or participation, not points or levels.
3. Impact strip: three to five factual totals such as organizations, active
   programs, resources shared, resource opens, and donations received when the
   owner elects to show them.
4. Activity heatmap: the GitHub-style `CalendarHeatmap` from
   `shadcn-heatmap` (`https://heatmap.chingru.com/install`), showing days with
   visible public activity. It supports daily, weekly, and cumulative summaries
   without exposing private workspace activity.
5. Activity feed: chronological cards for public program participation,
   programs launched, resources shared, milestones, and verified donations.
   Each card links to the related organization, program, resource, or external
   destination.
6. Saved locations: optional public collections of Find resources. The owner
   chooses which collections are public; personal map preferences remain private.
7. Organization profiles use the same visual grammar, replacing affiliation
   emphasis with programs, locations, Apply, and Donate actions.

There is no X/Y contribution chart, score, level, leaderboard, artificial
streak pressure, or inferred impact. Empty sections are omitted.

## Publication and privacy

- Person profiles are private by default.
- Claiming a handle does not publish a profile.
- Publishing requires an explicit owner action and an existing handle.
- Only purpose-built public projection tables are readable anonymously.
- Internal profile, membership, workspace, map-preference, donor, and financial
  records are never exposed directly.
- Public activity is allowlisted and generated from source events with a public
  visibility decision; private activity is not inferred into the feed.
- Analytics use bounded, privacy-safe aggregates. Raw IP addresses are not
  retained as profile analytics.

## Namespace

`public_handles` is the single case-normalized namespace for people and platform
organizations. Handles use 2-48 lowercase letters and numbers separated by
single hyphens.
Application routes, including `find` and `go`, are reserved in the database.

Existing organization `public_slug` values are backfilled when valid and not
reserved. A database trigger keeps subsequent organization slug writes in sync
with the shared namespace. Existing slugs are retained during the transition;
the root resolver does not replace them in this slice.

## Delivery sequence

1. Foundation: global handles, private person projection, RLS, controlled writes,
   schema types, and deterministic tests.
2. Onboarding/settings: username availability, claim/change controls, public
   field editing, preview, and explicit publication.
3. Public route/UI: resolve `/<handle>`, add the centered profile composition,
   install the heatmap, and render public affiliations and activity.
4. Organizations/programs: program public links, Apply and Donate URLs, program
   activity, ownership controls, and organization profile management.
5. Sharing analytics: `/go/<code>`, privacy-safe view/open events, deduplication,
   abuse bounds, and owner-facing aggregate metrics.
6. Public saved collections: named Find collections with per-collection
   visibility and profile rendering.
7. Root cutover: move Find to `/`, preserve `/find` redirects, reserve every
   fixed route, add sitemap/canonical metadata, and monitor conflicts/404s.

## First-slice acceptance

- Person and organization handles cannot collide.
- Reserved application routes cannot be claimed.
- Person profiles and handles stay anonymous-invisible until explicitly published.
- Owners can read their unpublished handle/profile; anonymous users cannot.
- Direct client writes to handle tables are denied.
- Organization slug inserts and changes synchronize automatically.
- Types and feature ownership match the database contract.
