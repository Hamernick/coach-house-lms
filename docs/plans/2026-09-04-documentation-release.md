# Documentation release preparation

Branch: `feat/documentation-marketplace-design-20260904`.
Worktree: `/Users/calebhamernick/Development/coach-house-platform-documentation-20260831`.
Local review: http://localhost:3010/documentation.

## Proposed PR description

The public library now connects reading, planning, resource discovery, and people.
It includes 20 authored library pages, 14 browser-local planners, the Brand Identity
Builder, and documentation search. The redesign makes tools immediately accessible,
groups inputs into steps, removes duplicate status panels, and puts the useful
brief or calculation beside its export. Drafts survive navigation and reload;
loading examples or Ad Grants starters asks before replacing existing work.

Marketplace has Tools & resources and People views, 23 unique resources, individual
resource pages, saved-resource CSV exports, and 10 practical workflow guides.
Google Ad Grants has eligibility and activation steps plus campaign starters for
fundraising, volunteer recruitment, and service access. The verified offer is up
to USD 10,000 per month in Search advertising for eligible organizations.

People starts with Joel Hamernick, Paula Hamernick, and Franklin Ballenger.
Joel and Paula use the existing joint coaching route. Franklin links to the
published Coach House contact page. Opt-in public member profiles appear
separately and link to their existing canonical profile URLs; private accounts
and unpublished profiles are excluded.

Search covers 43 authored documents, including resource guides and section links.
Public profile data and browser drafts are excluded from the search corpus.
Intentional visual changes follow the supplied references: a compact hierarchy,
rounded panels and controls, a dark quickstart section, illustrated task covers,
and a restrained gradient for the featured Ad Grants offer.

Index headings use 24px, body text 14px, desktop controls 32px, and desktop tabs
28px. Tighter panel spacing and smaller horizontal coach headers fit more content
on screen. Mobile retains 44px touch targets and 16px input text.
Standalone field groups, review panels, tables, guide links, callouts, and Brand
Identity containers use consistent rounded corners, with child backgrounds clipped
to the outer shape. The compact spacing and control sizes remain intact.
Home task cards give the illustrations more space: 16:9 assets with rounded
corners and an 8px top/side inset, shorter captions, and two columns at medium
widths before the full three-column desktop layout.

Documentation search now occupies the main header beside Login, using the same
compact `SearchInput` as public resource search. The icon submits from inside
the rounded field. The duplicate in-content rail is removed; mobile keeps the
field beside Login, and account shells receive the same search through a header
slot. Query clearing, browser history, and Ctrl/Cmd+K remain supported.

Collect/Build navigation stays centered over the main canvas. Dropdowns render
above the sidebar and canvas, remain open while moving into their links, and
support keyboard activation and dismissal. Search remains beside Login.

Guide, tool, and resource headers use centered 28px mobile / 34px desktop titles,
15–16px subtitles with 1.4 line height, sentence-case eyebrows, and wide abstract
artwork. All 41 pages have an individual original image, using heavily defocused
color fields and subtle grain based on the supplied reference. Compositions and
palettes vary by page; an explicit slug registry replaces the shared palette
fallback, with acceptance coverage for missing and duplicate assets. Hero
and task-card images have four rounded corners and an 8px inset. Documentation
sidebar and planner labels also use normal casing and tracking. Sidebar group
labels are bold, and their links have an additional 8px left inset. The contents rail
shares Core Documents' animated indicator and follows section links, scrolling,
and browser history while respecting reduced motion.

Home task cards use heavily blurred blue, coral/peach, and lavender/rose artwork
with flat white centered graphics and no shadows:
a megaphone for campaigns, a planning chart and coins for funding, and people
with a resource card for the directory. The graphic stays inside the image asset.

Text groups now share a 4px eyebrow/title/subtitle gap. Related content starts
8px below its heading group, with 16px between sections. The standard lives in
`docs/design.md`, is required by the UI rubric, and is implemented by the shared
Documentation `.heading` rule. Page, search, article, Marketplace, and tool
headings follow it; duplicated parent/child spacing is removed.

Implementation commits: `6b86fb3a` (Marketplace and people) and `7aa7d19c`
(documentation design and planner workflows), plus `9149b9f6` (optional sitemap
link guard), after core checkpoint `3d404002`.
Scope and rationale: [redesign plan](2026-09-04-documentation-marketplace-redesign.md).
No issue was supplied.

## Review paths

- `/documentation`: home, navigation, keyboard search, and task shortcuts.
- `/documentation/quickstart`: centered hero, typography, and contents indicator.
- `/documentation/marketplace`: filter, save, reload, and export resources.
- `/documentation/marketplace?view=people`: coaches and published-member state.
- `/documentation/marketplace/google-ad-grants`: source-backed setup guidance.
- `/documentation/tools/campaigns?template=ad-grants#sandbox`: explicit starter
  selection, draft replacement confirmation, and campaign export.
- `/documentation/best-practices/fundraising#sandbox`: funding mix and calculations.
- `/documentation/tools/brand-identity`: existing local asset and ZIP workflow.

## Validation and visual artifacts

The complete gate passed after the header menus, original hero, typography, and contents
indicator changes: all 21 stages in 438.79 seconds, 2,344 acceptance tests with
one intentional skip, seven deterministic RLS suites, production build/TypeScript,
all 82 browser tests, and performance budgets. This gate predates the subsequent
abstract-artwork replacement; rerun it before release. Reviewed baselines live in
`tests/visual/documentation.visual.spec.ts-snapshots/`: documentation home,
search, guide/tool, Marketplace, People, Ad Grants, completed campaign and funding
plans, and Brand Identity. Mobile coverage includes both themes and all 14 planners.

The abstract-artwork replacement separately passed static quality in 42.72 seconds
and all 16 Documentation browser journeys in 1.5 minutes. Ten affected baselines
were intentionally refreshed. Manual review confirmed desktop/mobile image
loading, crop ratios, rounded corners, and preserved insets without page errors.

The subsequent centered-white-graphic task cards passed final static quality in
46.26 seconds and all three affected responsive browser journeys in 26.4 seconds.
Only the three home baselines changed. Card geometry and link reachability were
also checked at 390/1440px. The first run's unchanged CRM route returned normally
after restarting the local preview; the clean rerun passed without route changes.

The softer multicolor revision and green Quickstart label passed static quality
in 46.07 seconds and the three affected browser journeys in 29.9 seconds. Only
home baselines changed; desktop/mobile review confirmed 8px image insets, 10px
corners, working links, and 11.18:1 contrast for the green label in both themes.

The text-spacing standard passed static quality in 36.65 seconds, final lint,
and all 16 Documentation browser journeys in 1.5 minutes. Nineteen baselines
were refreshed for the compact headers, article sections, and result headings.
Manual checks across 21 page/viewport combinations confirmed 4px title/subtitle
gaps without overflow; first tool content measures 8px and guide content starts
16px after its hero. An intermittent history-indicator failure passed three
focused repeats and the final full Documentation run without navigation changes.

The header-copy pass rewrote all 41 article subtitles, reducing each to at most
half its previous word count and a maximum of 15 words (628 words to 267 total).
Quickstart now reads “Start and grow your nonprofit”; resource headers use concise summaries
while catalog and search descriptions retain the full offer details. Static
quality passed in 48.89 seconds, all 53 focused acceptance checks passed, and all
16 Documentation browser journeys passed in 1.6 minutes. Eight affected baselines
were refreshed; the final desktop check passed after the last two wording edits.
Desktop/mobile review preserved the 4px title/subtitle gap without overflow.
Standalone TypeScript still reports 143 errors confined to existing test files,
with no application-source errors. The full release gate remains pending.

The individual hero-artwork pass passed static quality in 47.24 seconds, all 54
focused acceptance checks, and all 16 Documentation browser journeys in 2.0
minutes. Browser review verified 41 distinct loaded image URLs across all article
pages plus six mobile page families, with rounded corners, 8px insets, 4px text
gaps, and no page errors or overflow. Seven hero baselines changed intentionally.
The 41 optimized images total 1,197,568 bytes; generation prompts are recorded in
`src/features/nonprofit-documentation/assets/heroes/prompts.json`.

The shared article header now centers its eyebrow, title, and subtitle directly
over the original artwork. The user rejected the initial dark scrim; the final
preview has no tint, brightness filter, or shadow. Metadata stays below the image,
and print retains black text while hiding the decorative image. Static quality
passed in 51.20 seconds, final focused lint and ownership checks passed, and all
16 Documentation browser journeys passed in 2.2 minutes. Seven hero baselines
changed intentionally. A final audit checked 47 page/viewport combinations and
six print layouts, including all 41 articles at 320px. Long titles wrap without
shifting the centered text. The full release gate remains pending.

Image geometry, keyboard destinations, and React Grab ownership were verified
separately. The header-search pass also checked icon containment, Login adjacency,
and viewport overflow at 320/390/768/1024/1440px. New interaction coverage checks
dropdown centering and link reachability at 768/1024/1440px, contents indicator
alignment after scroll and history navigation, and reduced motion. Hero geometry
and light/dark rendering were manually reviewed at 390/1440px; photographic
desktop baselines use 1280px to remain within the repository's file-size budget.
Evidence is recorded in
`test-results/quality-gate/full.json` and the current monthly runlog.

Acceptance checks cover published-only profile projection, missing data, resource
contracts, old TechSoup saved-ID/link compatibility, and campaign starter behavior.
Browser checks cover every planner's edit/step/export/reload journey, history,
overwrite cancellation, storage failure, keyboard search, mobile navigation,
account-shell fixtures, resource saving, and member-profile links.

## Deployment notes

- No push, PR, deployment, profile publication, or provider changes were performed.
- Local port 3010 has React Grab enabled again for component review. Screenshot
  validation used `NEXT_PUBLIC_ENABLE_REACT_GRAB=0`; restore that flag when
  restarting this local server for future visual-baseline checks.
- Apply `supabase/migrations/20260904220000_reserve_documentation_public_handle.sql`
  before deploying this branch. It reserves the route name and fails explicitly
  if an existing public handle already owns `documentation`; resolve such an
  ownership conflict before release. The migration has not been applied remotely.
- If rolling back both this documentation route and its application-level handle
  reservation, remove only the reservation with `handle = 'documentation'` and
  `reason = 'Public documentation route'`. Do not remove an existing public handle.
- The anonymous live check on September 4 returned zero published member profiles.
  Positive directory rendering uses a guarded fixture; no example member is
  included in the public catalog. This isolated worktree has no Supabase env files,
  so the normal local People view reports directory unavailability honestly.
  Verify an actually published member in the configured deployment after release.
- Local RLS suites are deterministic. The reservation SQL separately passed
  disposable PostgreSQL checks for initial application, repeat application, and
  refusing an existing handle without changing ownership. Credentialed live RLS and real authenticated
  account journeys are separate from the fixtures and require release verification.
- Standalone `tsc --noEmit` has pre-existing test-fixture type errors. No app-source errors were reported, and the required production build passed
  its TypeScript check. The build retains an existing presenter-audio file-tracing
  warning unrelated to Documentation.

## Release checklist

- [ ] Rerun the complete release gate after the artwork, spacing, and header-copy refinements.
- [x] Graphify updated; plan, monthly runlog, and review artifacts current.
- [x] Implementation committed on the prepared branch; main refreshed at
  `67501039`, zero behind. No upstream, remote branch, or PR was created.
- [ ] After push: review CI, apply the reservation migration, deploy, and verify
  public routes, coach destinations, and published-member behavior live.
