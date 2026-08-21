# Find Drawer, Guides, Claims, and Search Design

Date: 2026-08-20
Status: Planning only; no implementation approved by this document
Branch: `feat/design-edits-20260820`

## Executive Decision

Build this as a progressive enhancement of the existing `/find` drawer, not as
a replacement map experience. Reuse the current Find / Guides / My Map tabs,
resource taxonomy, guide cards, URL filter state, and map-preference flow. Add a
new discovery home inside Find, improve the current client search, extend My Map
to saved guides, and isolate nonprofit claim intake in a server-owned feature.

Deliver the work in four small PRs:

1. Drawer discovery home and loading-state parity.
2. Search relevance, result layout, and performance.
3. Featured guide media, save, share, and My Map integration.
4. Nonprofit claim intake, anti-abuse controls, admin queue, notifications, and
   My Tasks delivery.

The Codex review finding about `src/app/(public)/find/loading.tsx` is already
resolved on current `main`. The route is synchronous and query-free. This work
must preserve that contract and update the layout-preserving fallback to mirror
the new drawer without adding Supabase or dashboard queries to `loading.tsx`.

## Goals

- Make the expanded mobile drawer useful before a search begins.
- Put essential nearby services first: food, water, shelter, emergency, and
  common health needs.
- Feature a small, truthful set of curated guides using the existing guide-card
  design.
- Let guests and members save and share guides; show saved guides in My Map.
- Give nonprofit representatives a safe, simple way to request ownership or
  management help.
- Make search feel immediate, produce better-ranked results, and remain usable
  while the public resource index loads progressively.
- Preserve accessibility, dark/light/system themes, mobile drawer behavior,
  public-data publication rules, and the existing stable total count.

## Non-goals

- No login, signup, hCaptcha, or auth-replay changes.
- No automatic ownership transfer from a public claim form.
- No fabricated guides, resources, coordinates, or category coverage.
- No external web search mixed into Coach House results.
- No new admin surface for guide creation in the first release.
- No new search dependency until profiling proves the current indexed approach
  cannot meet the performance targets.

## Current-State Evaluation

| Concern                 | Current owner                                                                                         | Current behavior                                                                                         | Gap                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Loading fallback        | `src/app/(public)/find/loading.tsx` and `src/features/find-map/components/find-map-loading-state.tsx` | Synchronous neutral shell with layout-preserving map and sidebar placeholders                            | Must visually track the new discovery drawer                                                                       |
| Drawer state and snaps  | `sidebar.tsx`, `sidebar-snap-points.ts`                                                               | Three snap points; search engagement expands the drawer                                                  | No distinct empty-query discovery home                                                                             |
| Find / Guides / My Map  | `member-rail.tsx`                                                                                     | Existing tab system and accessible tab semantics                                                         | Find defaults directly to search controls and results                                                              |
| Categories              | `category-filter.tsx`, `resource-categories.ts`                                                       | Top-level horizontal filter pills with counts                                                            | Screenshot-inspired nearby groupings need subcategory support                                                      |
| Guides                  | `resource-guides.tsx`, `resource-guide-model.ts`                                                      | Deterministic data-derived guides and reusable visual cards, currently derived from filtered map inputs  | No stable complete-catalog source, featured section, save action, share URL, or saved-guide view                   |
| Saved items             | `use-public-map-preferences.ts`, `/api/account/map-preferences`                                       | Guest local storage plus authenticated metadata sync for organizations, resources, searches, and recents | No guide IDs; object IDs need validation before persistence                                                        |
| Search                  | `search-index.ts`, `map-items-state.ts`, `public-map-index-filter-state.ts`                           | Cached lowercase substring matching and basic weighted organization ranking                              | Whole-query matching, limited intent handling, and one immediate-query path can cause poor relevance or input work |
| Result rows             | `organization-list-*.tsx`                                                                             | Uniform 80px rows, eight-item progressive rendering, `content-visibility`                                | Needs a tighter grouped search presentation and clearer match context                                              |
| Claim intake            | None                                                                                                  | No public claim workflow                                                                                 | Needs durable intake, anti-spam, admin review, notifications, and task delivery                                    |
| Admin review            | `src/features/resource-map-admin/**`                                                                  | Existing administrator-only resource review queue                                                        | Natural owner for a separate Claims section                                                                        |
| Notifications and tasks | `src/lib/notifications.ts`, member-workspace task server code                                         | Typed notification creation and organization/project-bound tasks                                         | Claim delivery needs an explicit internal project and assignee                                                     |

Important measured constraint: the last local production build placed `/find` at
approximately 1,882 KB against a 1,900 KB performance budget. The implementation
cannot casually add a search or carousel library. Prefer existing primitives and
small pure functions.

## Approach Comparison

### A. Progressive enhancement of the current system — recommended

Add a Find home state, improve the existing in-memory index, extend current guide
and preference models, and create a separate typed claim feature. This preserves
map behavior, minimizes bundle growth, and allows four independently reviewable
releases.

### B. Visual-only drawer clone

Recreate the screenshot, keep guide saves in local storage, and send claims as an
email. This is faster initially but produces unreliable intake, weak deduping,
no review history, no authenticated sync, and no durable task connection. Do not
use this approach.

### C. Fully server-driven search and guide platform

Create database-backed guide records, a dedicated search service, saved-item
tables, editorial tooling, and a full claims CRM immediately. This is the best
long-term model but is too large for one design batch. Use server search only if
the measured client-index targets fail, and treat guide editorial tooling as a
later product phase.

---

## Pass One: Product and UX Design

### 1. Drawer state model

The drawer needs explicit states instead of using one search panel for every
moment.

| State           | Entry condition                                     | Drawer content                                                   | Snap behavior                                                                     |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Find home       | Empty query, no selected category, guide, or detail | Find Nearby, Guides We Love, claim CTA                           | Opens at middle snap; compact snap keeps only handle, tabs, and search affordance |
| Category browse | User chooses a nearby category                      | Search field, selected category context, matching results        | Middle snap; full snap remains user-controlled                                    |
| Search active   | Input focused or query is non-empty                 | Search field with Cancel, intent shortcut, ranked results        | Compact snap advances to middle; keyboard can advance to full if needed           |
| Guide active    | User opens a guide                                  | Guide context, save/share actions, guide results on list and map | Middle snap; preserve selected guide in URL                                       |
| Details         | User opens an organization or resource              | Existing detail panel and actions                                | Middle snap; Back restores prior search or guide state                            |
| Guides tab      | User selects Guides                                 | Existing complete guide list                                     | Middle snap                                                                       |
| My Map          | User selects My Map                                 | Saved Organizations, Resources, and Guides                       | Middle snap                                                                       |

Back/Forward must restore the active tab, query, category, guide, and details
context without resetting the map unexpectedly. Dragging the drawer must not
clear state.

The drawer must also support tap-to-resize. Tapping its grabber or noninteractive
top chrome cycles predictably through compact, middle, and full-height snaps;
tapping at full height returns it to middle height. The whole content surface
must not be one resize target because that would interfere with scrolling,
links, controls, result selection, text selection, and assistive technology.
Expose the grabber as a real button with an accessible label that describes the
next height, keep swipe/drag resizing, and preserve the current drawer state and
scroll position across every height change.

### 2. Find home layout

Keep the existing tabs fixed at the top. Inside the scrollable Find body:

1. Search field.
2. `Find Nearby` heading.
3. Two compact category groups.
4. `Guides We Love` horizontal collection.
5. Claim/manage nonprofit CTA.
6. Bottom safe-area padding.

Use the screenshot's hierarchy, not its exact visual styling. Coach House should
retain its current surfaces, category colors, icon system, type scale, and
rounded geometry.

#### Basic needs

- Food → `food`
- Water → `food_water`
- Shelter → `housing_emergency_shelter`
- Emergency → `emergency`

#### Health

- Primary care → `health_primary_care`
- Dental → `health_dental`
- Mental health → `health_mental_health`
- Senior health → `health_senior_health`

Add `Urgent care`, `Injury and rehabilitation`, or `Emergency care` only after a
taxonomy and data-coverage audit establishes precise keys and verified public
records. Do not map injury searches to unrelated primary-care records. If new
keys are justified, update the category definitions, aliases, classifier,
fixtures, publication reports, and icons together.

Each category control is a native button with a 44px minimum mobile target,
consistent icon geometry, and an accessible name. Public controls with zero
verified results should not appear as dead ends. Keep the full existing taxonomy
available through an `All categories…` sheet or row below the priority groups.

### 3. Guides We Love

Reuse `PublicMapResourceGuides`; do not create a second guide card system. Add a
featured presentation option that renders the existing cards in a horizontal,
snap-aligned list on mobile and a compact grid in the desktop rail.

Recommended initial candidates, subject to the existing minimum-item gates:

- Chicago Food Access
- Chicago Housing and Shelter
- Chicago Health Care
- Cooling and Heat Relief

Only publish a featured guide when its resources are currently public,
publishable, and numerous enough to be useful. Build the guide catalog from the
complete loaded public corpus, not the user's active query, category, viewport,
or selected guide. The guide title, item count, and contents remain deterministic
outputs of current resource data.

Create original 4:5 guide images during implementation with the image-generation
tool. Images should contain no words, logos, provider marks, identifiable clients,
or unsupported claims. Export responsive AVIF/WebP assets with fixed dimensions,
use a dark/light-safe overlay, preload only the first above-fold card, and lazy
load the remainder. Keep prompts and asset rationale in the runlog.

### 4. Save and share guides

Every guide card and active-guide context gets:

- `Save to My Map` / `Remove from My Map` using a bookmark control.
- `Share guide` using the shared `ShareButton` behavior: Web Share API where
  available and clipboard fallback.
- A stable URL such as `/find?tab=guides&guide=chicago-food-access`.

Because the current guide card is itself a button, do not nest save/share buttons
inside it. Refactor the card to an article with one native primary button and a
sibling action control while preserving the current visual composition.

Guide IDs are deterministic and allowlisted against current guide definitions.
Guest saves use local storage. Authenticated saves extend the current map
preference payload with a bounded `savedGuideIds` array. Merge guest and remote
saves idempotently after session resolution. Do not save arbitrary query-string
IDs.

My Map gains an internal filter: `All`, `Organizations`, `Resources`, `Guides`.
The default `All` view preserves current organization/resource rows and adds
saved guide cards. A saved guide that temporarily has too few public items stays
listed with an `Unavailable right now` state and a remove action; it must not
silently disappear.

### 5. Claim/manage nonprofit entry point

Use the requested screenshot pattern near the bottom of Find home:

> Have an NFP on Coach House?
> Claim or manage it

`Claim or manage it` opens a short choice menu: `Claim an existing listing` or
`Add a missing nonprofit`. The selected choice opens a bottom sheet on mobile and
a dialog on desktop. From an organization detail, the same action skips the menu
and prefills that listing. From Find home, the form accepts a listing name or lets
the user choose a result.

Form fields:

- Name
- Email
- Message
- Hidden listing ID/kind when launched from a known result

The form uses plain text only, trims input, allows paste, uses autocomplete, keeps
the submit label visible while loading, focuses the first invalid field, and
warns before dismissing a dirty form. On durable success, clear the form and show
a manually dismissible polite toast with `closeButton: true`. Do not imply that
ownership was granted: `Request received. We’ll review the listing and contact
you.`

### 6. Search experience

The screenshot's useful pattern is a focused search mode with dense, predictable
rows. Keep Coach House's 80px uniform row system, but place results in one grouped
surface with subtle separators instead of separate floating cards.

Result anatomy:

- 44px logo or category marker.
- One-line ellipsized title.
- One-line primary category plus city/state, or `Online resource`.
- Optional highlighted matching phrase using semantic `<mark>` styling.
- No separate `View` label on narrow mobile if the whole native control is
  clearly actionable; keep an accessible action name.

Use an article row with a native main button/link and any save action as a sibling;
do not retain a clickable `article role="button"` or create nested buttons.

Search may return these result types in one ranked list:

1. Published organizations and resources.
2. One category-intent shortcut when the query matches a known category alias,
   such as `Food pantries nearby`.
3. A guide shortcut when the query matches a current guide title or its verified
   contents.

Do not mix unpublished candidates, admin-only rows, fabricated suggestions, or
external web results into the list.

Interaction requirements:

- Input text updates immediately; expensive filtering uses the deferred query.
- Clear resets the query but preserves focus.
- Cancel exits focused search and returns to Find home without clearing unrelated
  saved state.
- Escape clears the query first, then exits search when already empty.
- Up/Down moves an active result; Enter opens it; Tab remains normal browser
  navigation.
- The URL reflects committed query/category/guide state without a navigation on
  every keystroke.
- Loading, empty, offline, partial-index, and error states preserve row geometry
  and always offer recovery.

---

## Pass Two: Architecture, Data, and Ownership

### 1. UI ownership

Keep changes in the existing narrow owners:

| Work                           | Primary files                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Drawer home/search state       | `sidebar.tsx`, `sidebar-panels.tsx`, `use-public-map-drawer-search-handlers.ts`              |
| Tabs and My Map composition    | `member-rail.tsx`                                                                            |
| New discovery sections         | New `directory-home.tsx` and `nearby-category-grid.tsx` beside current public-map components |
| Category/subcategory selection | `category-filter.tsx`, `resource-categories.ts`, `filter-url-state.ts`                       |
| Guide display/actions          | `resource-guides.tsx`, `resource-guide-model.ts`, new `guide-actions.tsx`                    |
| Guide persistence              | `use-public-map-preferences.ts`, helpers/constants, `/api/account/map-preferences`           |
| Search indexing/ranking        | `search-index.ts`, `map-items-state.ts`, `public-map-index-filter-state.ts`                  |
| Result presentation            | `organization-list.tsx`, `organization-list-*-card.tsx`                                      |
| Loading parity                 | `find-map-loading-state.tsx`, visual-regression Find loading route/tests                     |

Do not move this work into shared Button, Drawer, Tabs, or Input primitives unless
a reusable primitive defect is proven.

### 2. Category data contract

The nearby controls require full category keys, not only top-level keys. Extend
the active filter contract from `PublicMapResourceTopLevelCategoryKey | "all"` to
the appropriate full `PublicMapResourceCategoryKey | "all"` contract while
preserving top-level matching semantics.

- Selecting a top-level key includes all descendants.
- Selecting a subcategory includes exact matches and any future descendants.
- Discovery-home counts derive from the complete loaded/public index, not the
  query, viewport, or currently rendered rows. Search facet counts may narrow to
  the active query, but must be maintained as a separate value.
- The selected category is encoded in the existing URL state and validated
  against the allowlist.
- Empty public categories are omitted from Find Nearby but remain visible to
  administrators through coverage reporting.

### 3. Guide state and sharing

Add `savedGuideIds` to the bounded preference contract with a limit of 40. Server
PATCH handling must validate each ID against the guide-definition allowlist.
Unknown and retired IDs are ignored, not persisted. Use field-level PATCH data or
a preference revision so a guide save cannot overwrite a concurrent organization
or resource save with stale client state.

Add `guide` and `tab` to the existing URL-state helpers. Opening a shared URL:

1. Validates the guide ID.
2. Opens the Guides or Find context.
3. Builds the guide from currently public data.
4. Fits the map to its items without storing exact user location.
5. Shows a recoverable unavailable state if the guide no longer meets its public
   minimum.

### 4. Claim feature boundary

Scaffold a new `src/features/public-map-claims/**` feature. Keep the public route
composition-only:

- `src/app/api/public/organization-claims/route.ts`
- `src/features/public-map-claims/components/**`
- `src/features/public-map-claims/server/**`
- `src/features/public-map-claims/lib/**`
- `src/features/public-map-claims/types.ts`

Create `public_map_claim_requests` as the source of truth. Minimum fields:

- `id` UUID
- `target_kind`: platform organization, resource-map organization, or new listing
- `target_id` nullable UUID
- `listing_name`
- `claimant_name`
- `claimant_email`
- `message`
- `status`: new, reviewing, verified, approved, rejected, spam
- `submission_key` and idempotency key
- `task_id` nullable
- `delivery_status` and last delivery error category
- `assigned_to`, `reviewed_by`, `reviewed_at`
- UTC created/updated timestamps

Enable and force RLS. Anonymous and normal member clients receive no direct table
policy. The public route validates and inserts with server-owned access; only
platform administrators can list, review, or mutate claims. Never place claimant
email or message in a URL, notification description, task title, analytics event,
or general log.

Apply explicit retention: delete spam submissions after 30 days, delete or
anonymize resolved claims after the approved operational retention window, and
keep only value-free audit history needed to prove review actions. Document the
chosen retention before production enablement.

The form submission proves only that a person can receive email at the supplied
address after later verification. It never adds an organization member, changes
publication, or grants management rights automatically.

### 5. Anti-abuse contract

Do not add hCaptcha. Use layered server controls:

- Same-origin check and JSON/form size limit.
- Server validation for field length and email shape.
- Hidden honeypot accepted by the UI but rejected silently by the server.
- Idempotency key so retries do not create duplicate claims/tasks.
- Atomic Supabase RPC rate limit keyed by action plus rotating HMAC-derived IP-risk
  hash; never store raw IP addresses.
- Separate normalized email + target dedupe window.
- Suggested bootstrap limits: 5 attempts per IP-risk key per hour, 10 per day,
  and 3 per email/target per day. Return generic `429` with `Retry-After`.
- Fail closed with a recoverable `503` when the shared limiter is unavailable.
- Plain-text rendering and output escaping in the admin queue.

Record value-free allow/deny telemetry for 14 days, then review the limits against
legitimate p99 volume and shared-network effects.

### 6. Admin queue, notifications, and My Tasks

Add a `Claims` section under `/admin/platform/resource-map`, protected by the
existing `requireAdmin` boundary. The queue shows status, listing, submitted time,
delivery state, and assignee. Detail view shows the claimant fields and provides
Reviewing, Verified, Approved, Rejected, and Spam transitions with an audit note.

After the claim row is durable:

1. Create one in-app notification for the configured intake owner. The
   notification contains the listing name and links to the admin claim detail;
   it does not contain claimant email or message.
2. Create one task in a dedicated internal `Public Map Claims` project and assign
   it to the configured intake owner.
3. Store the task ID on the claim and deep-link the task back to the claim.

Before release, choose and configure exactly one internal project ID and one
intake-owner user ID; the same owner receives the task and notification. Treat the
claim row as the source of truth. Use a durable delivery/outbox state and an
authenticated internal retry job. If notification or task delivery fails, keep
the claim, mark delivery pending/failed, and retry idempotently. A delivery
failure must not ask the public user to resubmit.

---

## Pass Three: Performance, Reliability, and Release Plan

### 1. Search pipeline

Improve the current no-dependency index before considering a server search
service.

1. Normalize Unicode, diacritics, punctuation, repeated whitespace, and category
   aliases once when building each document.
2. Tokenize the query and require all meaningful tokens across the document,
   while preserving exact-phrase boosts.
3. Weight fields in this order: exact title, title prefix, service/program title,
   category alias, city/state, short description, long narrative.
4. Use location only as a tie-breaker when permission and coordinates already
   exist. Search must never wait for location permission.
5. Keep online-only resources eligible and label them clearly.
6. Correct the immediate-query path so list filtering receives `deferredQuery`,
   while `query` remains the input value and `searchPending` reflects the gap.
7. Warm the index after each resource page without rebuilding unchanged documents.
8. Preserve selected rows and scroll anchors when progressive pages add results.

Benchmark the public resource endpoint at page sizes 50, 200, and 500 using the
minimal index projection. Prefer 200 if it materially reduces round trips without
causing a slow first response or oversized compressed payload. Do not add a
four-second inter-page delay.

If the local 5,000-item preview still exceeds the targets after these changes,
move index construction/filtering to a small Web Worker or add a bounded public
search endpoint. Do not add both preemptively.

### 2. Performance budgets

Required targets under a 4x CPU throttle and Fast 3G profile:

- Input keystroke to painted input value: p95 under 50ms.
- Loaded-index query to first result paint: p95 under 100ms.
- Drawer drag/settle: no repeated long task over 50ms; visually stable near 60fps.
- Claim submission: durable response target under 500ms; delivery retries may
  complete later.
- No cumulative layout shift when guide images or progressive results arrive.
- First guide image has explicit dimensions; noncritical images lazy-load.
- No new `/find` route budget regression. Because current headroom is small, any
  added client JavaScript must be offset or the budget deliberately reviewed.

Use React Profiler/React Scan to verify that typing does not rerender the map or
all guide cards. Memoize index documents and rows by stable item ID. Render eight
results initially and preserve progressive rendering; virtualize only if profiling
shows more than 50 mounted rows in a single scroll viewport.

Lazy-load the claim sheet and its form logic when the CTA is activated. Keep
nearby-category and guide-card enhancements dependency-free. Production search
measurement may record duration, query length, result count, and selected result
type, but must not store raw public-map queries without a separately approved
privacy contract.

### 3. Loading and partial-data behavior

`loading.tsx` remains synchronous. Update only its static composition and loading
artwork so it mirrors:

- the current drawer snap geometry;
- Find / Guides / My Map tabs;
- the Find Nearby category-grid footprint;
- two or three guide-card placeholders;
- the claim CTA footprint when visible.

Decorative placeholders remain `aria-hidden`. The loading surface exposes one
polite status and honors reduced motion. The resolved page may perform viewer and
dashboard work; the loading fallback may not.

During progressive resource loading:

- Show organizations and the first resource page immediately.
- Keep the complete public total stable when the API provides it.
- Label partial search results without blocking input.
- Merge later pages without clearing the query, active category, selection, or
  scroll position.
- Keep the last usable results on recoverable network errors.

### 4. Accessibility and content requirements

- Native buttons/links first; no clickable `div` result rows.
- Search input font size at least 16px on mobile.
- All interactive targets at least 44px on mobile.
- Visible `focus-visible` states and correct tab/sheet focus return.
- `aria-live="polite"` for result count, loading completion, and submission
  feedback; avoid announcing every keystroke.
- Category icons are redundant to text and decorative to assistive technology.
- Guide images have contextual alt text only when informative; background art is
  decorative.
- Safe-area insets and `overscroll-behavior: contain` on drawer/sheet scroll areas.
- A 44px minimum tap target for the drawer resize control, with keyboard
  activation and current/next-height semantics for assistive technology.
- Long organization, resource, guide, and location names truncate predictably.
- Dark/light/system contrast verification, including generated image overlays.
- Reduced-motion variants for drawer-adjacent transitions.

### 5. Test plan

#### Unit and acceptance

- Full/subcategory filter matching and complete-index counts.
- Search normalization, token matching, ranking, alias intent, and stable sorting.
- Deferred query use and immediate controlled-input behavior.
- Find home versus search state transitions and URL restoration.
- Guide allowlist, minimum-item gate, save/remove, guest/auth merge, and retired
  guide fallback.
- Guide share URL and clipboard/Web Share fallbacks.
- My Map mixed saved-item filtering.
- Claim validation, honeypot, origin check, idempotency, dedupe, `429`, `503`, and
  payload limits.
- Claim persistence when notification/task delivery fails.
- Admin-only claim queue and audited status transitions.
- Notification/task dedupe and safe payload redaction.

#### RLS

- Anonymous users cannot select, update, or delete claim rows.
- Members cannot read other claimants or claim queue data.
- Platform administrators can review through the authorized server boundary.
- Public submission cannot insert notifications or tasks directly.
- Task/notification delivery uses canonical configured recipients and project.

#### Visual and browser

- Find home: mobile/desktop, light/dark.
- Focused search with sparse, normal, and dense results.
- Guides We Love carousel/grid and image failure fallback.
- My Map with saved guides.
- Claim menu/sheet, validation, loading, success, and failure states.
- Tap, keyboard, and drag transitions among compact, middle, and full drawer
  heights without accidental activation from content interactions.
- Updated loading fallback matching the final geometry.
- 390×844 mobile, tablet, laptop, ultra-wide at 50% zoom, and browser zoom at
  200%.
- Keyboard-only, VoiceOver/Safari, reduced motion, offline recovery, and slow
  network/CPU.

### 6. Implementation sequence and gates

#### PR 1 — Discovery home and loader parity

- Add explicit Find home/search state.
- Add nearby category groups and full-category entry point.
- Preserve URL/category behavior; add tap-to-cycle resizing without changing
  the existing drawer snap geometry or drag interaction.
- Update synchronous loading artwork and visual baselines.

Gate: no dead categories, no drawer regressions, no async loading fallback.

#### PR 2 — Search quality and speed

- Correct deferred filtering.
- Add normalization, tokenized ranking, category/guide shortcuts, grouped rows,
  keyboard behavior, and partial-index feedback.
- Benchmark API page sizes and render work.

Gate: meet keystroke/result targets on production-sized and 5,000-item fixtures;
do not exceed the `/find` bundle budget.

#### PR 3 — Featured guides, media, save, share

- Generate and optimize original guide assets.
- Add Guides We Love presentation.
- Add stable guide URLs, save/share actions, preference validation, and My Map
  guide views.

Gate: guide contents remain publication-grounded; saved/shared unavailable states
are recoverable.

#### PR 4 — Claim intake and operations

- Scaffold feature, migration, shared limiter RPC, public route, and form.
- Add admin queue, notification delivery, task bridge, audit transitions, and
  retry behavior.
- Configure the internal project and assignee.

Gate: RLS, abuse, redaction, idempotency, failure-recovery, and admin authorization
tests pass before the CTA is enabled.

Each PR must pass focused iteration tests, then the repository's full static,
acceptance, RLS, build/performance, and visual gates before release. Update
Graphify and the current monthly runlog for every material implementation batch.

## Risk Register

| Risk                                            | Control                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Discovery tiles imply unavailable services      | Derive visibility/counts from the complete publishable index and hide zero-result shortcuts    |
| Guides change or disappear under filters        | Build one complete guide catalog independent of query, viewport, and active category           |
| Saved guide overwrites another preference       | Validate IDs and use field-level or revision-aware preference updates                          |
| Search typing rerenders the map                 | Separate immediate and deferred query state; profile component boundaries                      |
| Progressive pages reorder results aggressively  | Preserve selected IDs and scroll anchors; apply deterministic ranking and partial-index status |
| New client code breaks the route budget         | Reuse primitives, lazy-load claim UI, add no search/carousel dependency without measured need  |
| Public claim form becomes a spam channel        | Shared atomic limiter, HMAC risk keys, honeypot, dedupe, idempotency, and generic responses    |
| Claim data leaks through tasks or notifications | Put only listing name, claim ID, and internal link outside the protected claim queue           |
| Delivery failure loses a request                | Claim row is durable source of truth; outbox status and idempotent retry handle side effects   |
| A claim grants unauthorized access              | Manual identity review is mandatory; submission never mutates membership or ownership          |
| New drawer causes slow navigation               | Keep `loading.tsx` synchronous/query-free and mirror final geometry with static placeholders   |

## Request Traceability

| Requested outcome                            | Planned delivery                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Screenshot-inspired `Find Nearby` drawer     | Pass One sections 1–2; PR 1                                                                    |
| Basic-needs and health groupings             | Pass One section 2; full/subcategory filter contract                                           |
| `Guides We Love` using current card design   | Pass One section 3; PR 3                                                                       |
| Generated guide imagery                      | Original optimized assets in PR 3                                                              |
| Save guides in My Map                        | Pass One section 4; preference and My Map changes in PR 3                                      |
| Share guides                                 | Stable URL plus shared ShareButton behavior in PR 3                                            |
| Claim/manage nonprofit form                  | Pass One section 5 and typed claim feature in PR 4                                             |
| Name, email, message, closeable confirmation | Claim form and `closeButton` success toast in PR 4                                             |
| Prevent spam                                 | Pass Two section 5; RLS/rate-limit tests in PR 4                                               |
| Notify Caleb and create My Tasks follow-up   | One configured intake owner, notification, dedicated project task, and outbox delivery in PR 4 |
| Screenshot-inspired fast search results      | Pass One section 6 and Pass Three search pipeline; PR 2                                        |
| Keep loading fallback immediate              | Existing synchronous contract preserved and loading artwork updated in PR 1                    |

## Decisions Needed Before Implementation

1. Confirm the initial featured guides after checking their current publishable
   counts.
2. Decide whether the public copy remains `Have an NFP on Coach House?` or becomes
   the clearer `Is your nonprofit listed on Coach House?`.
3. Choose the internal Public Map Claims project and primary task assignee.
4. Approve any new urgent-care/injury taxonomy keys only after the coverage audit.

## Definition of Done

The feature is done when a mobile user can open `/find`, immediately browse useful
nearby categories and featured guides, search without input lag, open stable
results, save/share a guide, find it again in My Map, and submit a claim request
that is durably visible to an administrator with one deduplicated notification
and task. They can tap the drawer's resize control or drag it to move among its
three heights without losing context or triggering content accidentally. The
same experience must remain accessible, theme-safe, truthful to published data,
resilient to partial loading, and free of login or hCaptcha changes.
