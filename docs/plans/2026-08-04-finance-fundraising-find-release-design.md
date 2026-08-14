# Finance, Fundraising, Find, And Safe Release Plan

Status: active production stabilization; wave rollout in progress

Created: 2026-08-04

Last reviewed: 2026-08-11

Primary owners: product, platform engineering, fiscal sponsorship operations

### 2026-08-11 Find And Build Product Clarification

This is a settled product decision, not a new implementation wave or a plan to
split the application into separate personas, routes, onboarding systems,
permission systems, metrics, or test suites.

Coach House is one product with two independent loops:

- **Find:** anyone can discover and collect nonprofits and resources in My Map.
- **Build:** organization users can use the existing Accelerator, Workspace,
  people, documents, programs, funding, fiscal sponsorship, and Finance tools.

Builders can use Find and My Map. Using Find does not make someone a Builder or
require Builder onboarding. The existing account, navigation, security, and
data architecture remain shared. Existing ownership rules remain intact:
personal map preferences belong to the account, while organization work remains
organization-owned and role-protected.

The current Builder loop is already substantially built. It is not scheduled
for a rebuild. Remaining Builder work is limited to live QA and fixing verified
gaps. Paid billing is also treated as existing baseline behavior and is not an
active rebuild project; reopen it only for a verified regression.

Finance displays source-labeled external activity. Stripe or another approved
provider manages the money. Coach House provides the useful view: a simple
graph, activity list, history, export, and board sharing.

### 2026-08-10 Production Stability Override

This is the current execution contract. It supersedes the earlier seven-batch
sequence, completion language, weather priority, and stale release-tree status
where they conflict. The product boundaries below remain in force, including
the separation between Coach House subscription billing and Finance records.

The immediate outcome is a stable, secure, well-designed live product for paid
and free users. Existing work is finished and verified before optional feature
expansion. NWS weather and cooling-center promotion are deferred. Work never
starts automatically on `main`.

#### Progress contract

Report the current PRD completion percentage only from the fixed 35-item
current-wave completion checklist below: five equally weighted criteria for
each of seven waves. Percentage is checked criteria divided by 35, rounded to
the nearest whole percent. In-progress work remains unchecked until its named
production evidence is complete. Do not calculate progress from the historical
37-item batch tracker, merged branches, Prototype Lab nodes, or partial preview
work.

Track each wave as `queued`, `active`, `code complete`, `preview verified`, or
`production verified`. A wave is complete only after its focused PR is merged,
the production deployment succeeds, the named live journeys pass, monitoring
is clean, and rollback remains available. Prototype Lab is a presentation of
this source document; it never determines delivery status.

#### Verified production baseline

The following work is merged on `main`; live quality must still be proven by
the relevant wave rather than inferred from merge status:

| Release      | Merged scope                                                |
| ------------ | ----------------------------------------------------------- |
| PR #118      | Durable organization-setup recovery                         |
| PR #119      | Organization and workspace foundation                       |
| PR #120      | Fiscal sponsorship and project operations                   |
| PR #121      | Integrated workspace and Finance release                    |
| PR #122      | Finance drawer deep-link entry                              |
| PR #123      | Core documents open in the workspace data drawer            |
| PRs #124-125 | Workspace foundation enabled for all users                  |
| PR #126      | Organization render-loop and stale Stripe-link error repair |
| PR #127      | Production font-build repair                                |
| PR #128      | Production-readiness waves and release gates                |
| PR #130      | Self-hosted Inter build dependency                          |
| PR #131      | Find and Build product and rollout clarification            |
| PR #132      | Public Find light-mode contrast repair                      |
| PR #133      | Parallel organization-detail server reads                   |
| PR #134      | Revision-safe organization document writes                  |
| PR #135      | Read-only Workspace and Roadmap rendering                   |
| PR #136      | Read-only People page synchronization                       |
| PR #137      | Revision-safe Workspace board saves                         |
| PR #138      | Workspace production-deployment evidence                    |

The baseline is `origin/main` commit `fa25b38d` on 2026-08-11. A production
read of `/api/public/resource-map/items` returned `853` records in a
`2,519,484`-byte response. That is a live endpoint snapshot, not a performance
guarantee or proof that all records rendered correctly.

A local curated-preview audit found `5,046` candidate records but only `741`
currently publishable under the repository contract. The largest blockers are
missing verified enrichment (`4,305`), source-comparison evidence (`3,378`),
eligibility (`3,294`), provider sources (`2,925`), public summaries (`1,992`),
access instructions (`1,955`), and actionable contact paths (`1,421`). The
remaining candidates cannot be inserted into `/find` merely to reach 5,000.

#### Ranked live risks

| Priority | Risk                                                                | Current evidence                                                                                                                                      | Release requirement                                                                                       |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0       | User data could be lost or appear stale                             | Workspace autosave, organization updates, Finance records, subscriptions, onboarding state, and cache invalidation cross server and client boundaries | Retry, concurrency, stale-write, rollback, refresh, and reconnect proof with no silent overwrite          |
| P1       | Signup lacks current legal acceptance                               | No canonical Terms or Privacy pages and no versioned signup acceptance record                                                                         | Reviewed pages, linked required checkbox, version/hash/UTC evidence, and every signup entry covered       |
| P1       | Existing features need role-complete live proof                     | Finance/documents drawers and organization fixes were released through several hotfixes                                                               | Paid/free/admin/coach/member browser journeys with data continuity                                        |
| P1       | `/find` sends a large monolithic payload and shows stale loading UX | `853` records currently produce about `2.52 MB`; the client fetch uses `no-store` and “Loading the full resource directory…” skeletons                | Compact index, bounded queries, detail on demand, stable cached refresh, and explicit performance budgets |
| P1       | Light-mode contrast and profile surfaces are inconsistent           | Some map overlays force dark descendants and organization/resource surfaces require browser review                                                    | WCAG contrast, transparent/correct page background, and light/dark/mobile visual proof                    |
| P2       | Public guides lack useful variety                                   | Current guide content is concentrated on cooling centers                                                                                              | Basic location-connected guides across several service categories after map stability                     |
| Deferred | NWS promotion and weather ranking                                   | Valuable but not required to stabilize the live product                                                                                               | Reassess after launch; do not block launch readiness                                                      |

#### Execution waves

Each wave is separately scoped and integrated only after its own evidence is
green. A critical production fix may use a smaller branch within the active
wave, but unrelated scope does not accumulate in one PR.

| Wave                                      | Status on 2026-08-11 | Scope                                                                                                                                                          | Exit evidence                                                                                                                                      | Rollback                                                                                   |
| ----------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1. Live stability and existing work close | Production verified  | Verify the existing Builder, Workspace, Documents, Finance, organization, role, deep-link, light-mode, mobile, stale-data, and error paths; fix only real gaps | Free/paid/member/coach/admin browser proof; refresh and cross-account isolation; no data loss, console errors, contrast failures, or broken routes | Disable or revert the narrow failed surface; preserve all stored data                      |
| 2. Signup, recovery, and legal            | Active               | Direct and contextual signup, verification, login, recovery, Terms, Privacy, required acceptance, and safe return intent                                       | Every signup surface works; consent version/hash/UTC is stored; denial and retry work; legal text is approved                                      | Disable new signup while preserving accounts and consent evidence                          |
| 3. `/find` speed and loading              | Active               | Compact index, bounded or paginated loading, detail on demand, stable cached refresh, current loading UI, empty/error/retry states, and collected-item lookup  | Fast first useful render; payload/LCP/TTI budgets; complete results; offline/stale/retry proof                                                     | Restore the prior compatible endpoint; retain published records                            |
| 4. Collect / My Map completion            | Active               | Reuse the existing saved-organization foundation; rename the experience, collect/uncollect nonprofits and resources, show them in My Map, and persist them     | Visitors can collect locally; signed-in accounts persist across devices; Builders have the same My Map; no lists, notes, tags, ordering, or import | Disable new resource collection writes; preserve existing saved organizations              |
| 5. Finance reporting completion           | Queued, partly built | Read-only external activity connection, simple graph, activity list, History, source/freshness labels, CSV/PDF export, and board sharing                       | Connected/loading/empty/stale/error states; graph has a text equivalent; reports reconcile; sharing is explicit and revocable                      | Disable sync or reporting entry points; retain read-only records and existing CSV fallback |
| 6. Qualified resources and varied guides  | Queued               | Promote verified cohorts toward 5,000+ useful records, then publish category- and location-varied guides after `/find` is stable                               | Exact complete/verified/publishable/promoted/public parity; cohort canary; relevant current guides and working links                               | Unpublish a cohort or guide without deleting evidence                                      |
| 7. Integrated production release          | Queued               | Security review, support runbook, monitoring, rollback rehearsal, production smoke checks, and gradual rollout                                                 | Full quality gate; connected RLS where changed; hosted previews; production browser proof; clean monitoring                                        | Wave-specific flags and forward repair; never use a destructive data rollback              |

#### Current-wave completion checklist

Only checked criteria count toward the percentage. Criterion IDs and the
35-item denominator are stable; changing either requires an explicit PRD
revision. Current progress: **22/35 complete (63%)**, **7 in progress**, and
**6 not started**.

**Wave 1 — Live stability and existing work close**

- [x] `wave-1-criterion-1` **Complete:** Verify authenticated Find in light and dark mode on desktop and mobile with no contrast regression — Evidence: PR #132 merged and production-verified.
- [x] `wave-1-criterion-2` **Complete:** Verify organization detail rendering and recoverable missing Stripe-subscription links in production — Evidence: PR #133 merged and production-verified.
- [x] `wave-1-criterion-3` **Complete:** Verify revision-safe organization document writes and storage rollback behavior — Evidence: PR #134 merged and production-verified.
- [x] `wave-1-criterion-4` **Complete:** Verify Workspace, Roadmap, and People reads preserve stored organization data — Evidence: PRs #135 and #136 merged with authenticated production read-safety proof.
- [x] `wave-1-criterion-5` **Complete:** Complete revision-aware Workspace save smoke and the paid, free, member, coach, and admin journey matrix — Evidence: PRs #137 and #138 merged; production paid/member, free/admin, and tester-coach journeys passed without browser errors; the Workspace card save advanced its board revision, survived refresh, recorded the correct actor, and was restored exactly to its original position.

**Wave 2 — Signup, recovery, and legal**

- [x] `wave-2-criterion-1` **Complete:** Provide canonical Terms and Privacy pages with required acceptance on every signup surface — Evidence: PR #156 merged as `9cacf375`; both production projects deployed, `/privacy` and `/terms` return canonical `200` pages with version `2026-08-12.1`, and the 43-test signup matrix proves required acceptance across direct and contextual entry surfaces.
- [ ] `wave-2-criterion-2` **In progress:** Persist immutable consent version, content hashes, user, and UTC acceptance time under RLS — Evidence: migration `20260811160000` is applied in production; the table exists with zero rows, public-schema lint passes, and anonymous reads return `401`; one controlled signup record remains required to prove the live trigger end to end.
- [ ] `wave-2-criterion-3` **In progress:** Verify direct and contextual signup, email verification, safe return, denial, retry, and recovery — Evidence: 43 focused acceptance tests pass across direct signup, homepage and pricing entry, required denial, confirmation redirects, safe return, retry, and password recovery; hosted and production proof remain.
- [x] `wave-2-criterion-4` **Complete:** Obtain qualified legal approval for Terms and Privacy copy — Evidence: the product owner reported legal review complete and the current copy approved for release on 2026-08-12.
- [ ] `wave-2-criterion-5` **In progress:** Merge, deploy, production-smoke, monitor, and retain a tested signup rollback — Evidence: PR #156, main CI, both Vercel production deployments, canonical route probes, migration parity, schema lint, and anonymous denial pass; the controlled signup smoke and tested rollback remain.

**Wave 3 — `/find` speed and loading**

- [x] `wave-3-criterion-1` **Complete:** Serve a compact anonymous resource index without private or detail-only fields — Evidence: PRs #143-#146 merged through production commit `648b0885`; the live anonymous index returned all 853 records in compact responses of 25,990-97,986 bytes.
- [x] `wave-3-criterion-2` **Complete:** Add bounded or paginated loading with stable cached refresh behavior — Evidence: production returned all 853 unique records exactly once across five stable cursor pages of 200/200/200/200/53 records, and `/find` visibly progressed from 618 to 871 combined results without losing its map or directory context.
- [x] `wave-3-criterion-3` **Complete:** Load resource details on demand while preserving selected and collected records outside current bounds — Evidence: the live exact-item endpoint returned the selected index ID in a 2,783-byte sanitized response; focused selection/refresh coverage proves later-page records remain resolvable during progressive reconciliation.
- [x] `wave-3-criterion-4` **Complete:** Verify loading, empty, error, offline, stale, and retry states without losing map context — Evidence: PR #148 merged through production commit `a149d763`; focused component coverage passed 51/51 for progressive loading, filtered and unfiltered empty states, unavailable and offline recovery, stale-result preservation, reconnect revalidation, and manual retry while retaining the map shell.
- [ ] `wave-3-criterion-5` **In progress:** Meet payload, first-useful-render, LCP, and interaction budgets in preview and production — Evidence: production `/find` preserves the 1,900 KB route budget and returned a 1.7s first contentful paint on 2026-08-13, but the bounded mobile Lighthouse run still measured 4.7s LCP and 35.0s time to interactive, with Mapbox script evaluation dominating main-thread work. The criterion remains open pending a focused interactive-map loading correction and production rerun.

**Wave 4 — Collect and My Map completion**

- [x] `wave-4-criterion-1` **Complete:** Let visitors collect and remove nonprofits and resources locally — Evidence: PR #158 merged as `8f5196ab`; main quality and deployment passed, production `/find` returned `200`, and focused plus full release gates cover local collect, remove, persistence, and hydration.
- [ ] `wave-4-criterion-2` **In progress:** Persist signed-in collections across devices with safe idempotent replay — Evidence: PR #159 merged as `6b2ac883`; production authenticated Builder/admin collect survived reload, appeared in My Map, removed cleanly, and remained removed after reload. Route tests prove bounded account-backed idempotent replay; one independent second-client observation remains before cross-device completion.
- [x] `wave-4-criterion-3` **Complete:** Build My Map on the existing saved-organization foundation without separate Finder onboarding — Evidence: PR #158 renamed and extended the existing saved-organization rail and drawer for nonprofits and resources, retained shared account/navigation behavior, and added no Finder onboarding.
- [x] `wave-4-criterion-4` **Complete:** Keep collected records resolvable through loading, empty, stale, and error states — Evidence: PR #160 merged as `ae0deda7`; both production deployments passed, production My Map retained the collected resource through progressive reload, and 78 focused plus 2,079 full acceptance tests cover loading, empty, stale, error, retry, and confirmed unpublishing behavior.
- [x] `wave-4-criterion-5` **Complete:** Verify guest, account, and Builder journeys with RLS, production monitoring, and rollback proof — Evidence: guest acceptance and production route proof pass; an authenticated Builder/admin completed a reversible production collect-reload-remove journey with the account restored to zero collected resources; all RLS suites pass, application console errors are empty, both deployments succeeded, and non-destructive rollback is `git revert ae0deda7 6b2ac883 8f5196ab` in reverse dependency order.

**Wave 5 — Finance reporting completion**

- [x] `wave-5-criterion-1` **Complete:** Connect read-only external activity with explicit source and freshness labels — Evidence: PR #121 released the bounded read-only Stripe activity connection and source-labeled records; PR #162 merged as `09810abd`, main quality passed, both Vercel production deployments succeeded, and production serves the Finance route with the released read-only source plus never-synced, running, successful, and failed freshness states covered by 70 focused Finance tests.
- [x] `wave-5-criterion-2` **Complete:** Provide a simple accessible graph, text equivalent, Activity list, and History — Evidence: PR #121 merged as `a6016231` and deployed to both production projects; the source-composition rail exposes an accessible description plus visible labeled amounts, focused coverage passes, and authenticated production verification opened both Activity and History.
- [x] `wave-5-criterion-3` **Complete:** Reconcile visible reporting to authorized external records and correction history — Evidence: merged reporting counts only verified, non-corrected USD inflows while retaining corrected originals and replacements in History; immutable correction storage, organization-scoped reads, focused correction coverage, and the connected Finance RLS matrix passed with PR #121 and its production deployment.
- [x] `wave-5-criterion-4` **Complete:** Verify accurate CSV and PDF exports — Evidence: PR #164 merged as `f6ceb0c4`; main quality and both production deployments passed, and authenticated production displays the released CSV/PDF Export control. Nine focused tests parse the PDF and verify exact CSV fields, authorization, route behavior, formula neutralization, pagination, and bounded failures.
- [ ] `wave-5-criterion-5` **In progress:** Verify explicit revocable board sharing, role isolation, failure states, and production rollback — Evidence: PR #165 merged as `2387591e`; main quality, the production migration, and both production deployments passed. Owners can explicitly assign Viewer, Manager, or No access to existing board members; RLS requires current board membership and removes grants across membership changes so stale access cannot revive. Eight focused action, loader, failure, and UI tests, 30 existing Finance tests, and Finance RLS pass; one authenticated production grant/revoke journey and a forward database rollback remain.

**Wave 6 — Qualified resources and varied guides**

- [x] `wave-6-criterion-1` **Complete:** Report exact candidate, complete, verified, publishable, promoted, and public counts — Evidence: the 2026-08-13 read-only count refresh reports the expanded local curated snapshot separately at `5,046` candidates and `741` complete/verified/publishable records. Exact production aggregates report `2,184` staged and parity at `853` verified, administrator-approved, publishable, promoted, and anonymous public rows; artifact hashes and reproduction steps are recorded.
- [x] `wave-6-criterion-2` **Complete:** Fix resource listings missing provider proof, eligibility, a clear summary, access steps, contact details, or a second source — Evidence: PRs #167-#171 repaired the selected housing, food, and immigrant/refugee cohorts; #171 hosted quality and both deployments passed. Housing two-source coverage increased from `92/106` to `99/106`; food contact or intake coverage increased from `644/752` to `748/752` and access-plus-comparison coverage from `615/752` to `647/752`; immigrant/refugee two-source identity coverage increased from `68/84` to `79/84`, including `74/79` service-eligible listings. Records blocked by real provider evidence failures remain explicitly held. Nothing was approved or published.
- [x] `wave-6-criterion-3` **Complete:** Publish toward 5,000 useful resources without raw intake, synthetic seeds, or unverified discovery records — Evidence: PRs #174-#175 refreshed existing staging and stored bounded live verification without importing, reviewing, or publishing unverified records. On 2026-08-13, the product owner reviewed and approved only Bremen Township, Brookfield Library, and Calumet Township; all three still matched the current 33-row official Cook County source. The guarded production canary selected exactly those three with zero accepted duplicate matches and promoted them atomically. Anonymous public parity increased only from 853 to 856, all three exact detail routes returned the intended records, and their three contacts plus six links remained private. Removed Markham and Maywood courthouse rows remain held. PR #177 and production CI also closed the obsolete bulk-detail endpoint before publication.
- [ ] `wave-6-criterion-4` **In progress:** Publish current location-connected guides across multiple service categories — Evidence: the current production catalog has 394 Chicago resources spanning food (201), community (114), housing (69), legal (31), family (23), and health (7). A focused implementation derives six Chicago guides from those public location and category fields, requires at least five current matching records per guide, preserves cooling-center guides, and changes no resource data. Merge, deployment, live guide counts, link checks, and production browser proof remain.
- [ ] `wave-6-criterion-5` **Not started:** Complete cohort canary, count parity, broken-link checks, production monitoring, and reversible unpublish proof.

**Wave 7 — Integrated production release**

- [ ] `wave-7-criterion-1` **Not started:** Pass the full quality gate, connected RLS where changed, and migration parity.
- [ ] `wave-7-criterion-2` **Not started:** Complete security review, support runbook, ownership, and monitoring setup.
- [ ] `wave-7-criterion-3` **Not started:** Verify hosted paid, free, member, coach, and admin journeys in light, dark, desktop, and mobile.
- [ ] `wave-7-criterion-4` **Not started:** Rehearse rollback and complete controlled paid and free canaries with gradual rollout.
- [ ] `wave-7-criterion-5` **Not started:** Verify production deployment, smoke checks, clean monitoring, and no unresolved P0 risk.

#### Wave 1 current evidence

- PR #132 is merged and production-verified for authenticated light/dark Find
  surfaces on desktop and mobile.
- PR #133 is merged and production-verified for organization-detail rendering
  and recoverable missing Stripe-subscription links.
- PR #134 is merged and production-verified for revision-safe organization
  document writes. The authenticated production Documents index rendered its
  existing files after deployment without a mutation.
- PR #135 is merged and production-verified for read-only Workspace and
  Roadmap rendering. Legacy content remains normalized in memory, both routes
  render, and their production reads leave the organization revision unchanged.
- PR #136 is merged and production-deployed for read-only People-page member
  synchronization. Account-derived display data is still shown, but opening
  People no longer persists it over organization directory fields. Explicit
  People add, edit, invite, remove, and position actions remain available.
- PR #137 is merged and deployed through both production projects for
  revision-aware Workspace board and node-position saves. Concurrent saves
  retry against the latest board state instead of silently replacing it.
  Focused concurrency coverage, the full quality gate, hosted CI, and both
  Vercel previews pass.
- Authenticated production proof completed the paid/member, free/admin, and
  tester-coach journeys with no browser warnings or errors. A Workspace card
  save advanced the stored board revision, recorded the correct actor, and
  persisted from `(866, 82)` to `(907, 107)` across refresh. The card was then
  restored exactly to `(866, 82)`, the original session was restored, and the
  temporary coach token session was revoked.

#### Wave 2 current evidence

- Branch `feat/legal-policy-consent-20260812` replaces the deleted and
  conflicted PR #139 branch. It adds canonical public Terms and Privacy routes
  plus explicit required acceptance on the shared normal, contextual, and
  tester signup form.
- Consent evidence is bound to the exact document content by version and
  SHA-256 hashes, with an acceptance timestamp. A new append-only acceptance
  table preserves that evidence behind RLS.
- The documents now disclose the product's account, organization, document,
  financial, location, analytics, email, CAPTCHA, map, payment, AI, public-data,
  retention, security, communications, and privacy-rights practices. They also
  state service, resource-directory, advice, billing, warranty, liability, and
  acceptable-use boundaries.
- The legal text remains pending qualified legal approval. The exact entity
  details, postal address, retention schedule, vendor agreements, and state-law
  applicability must be confirmed before production release.

#### Wave 5 current evidence

- PR #121 merged as `a6016231` with the Finance workspace release. GitHub
  quality passed, and both Vercel production deployments completed
  successfully on 2026-08-09.
- The authenticated production rollout verified that Finance opens its Activity
  and History views. The shipped source rail has a programmatic text equivalent
  and visible source labels and amounts.
- Raised, source composition, and program progress derive only from authorized,
  verified, non-corrected USD inflows. Corrected originals and their verified
  replacements remain linked and visible in History behind organization-scoped
  RLS; the connected Finance matrix passed.
- Branch `feat/finance-reporting-wave5-20260812` exposes the already-loaded
  Stripe sync timestamp as explicit freshness copy and preserves the read-only
  source label across connected, never-synced, syncing, and failed states.
- PR #164 merged as `f6ceb0c4`; main quality and both production deployments
  passed, and authenticated production shows the released CSV/PDF Export
  control. Focused tests parse the PDF and verify exact CSV fields and safety.
- Branch `feat/finance-board-sharing-20260813` adds explicit owner-managed
  Viewer, Manager, and No access states for existing board members. Database
  authorization requires current board membership and prevents stale grants
  from surviving or reviving across membership changes.

#### Wave 6 current evidence

- The [2026-08-13 count refresh](./2026-08-13-resource-map-count-refresh.md)
  separates local artifacts from production instead of combining unlike
  snapshots into a false funnel.
- The expanded local curated snapshot has `5,046` candidates and `741`
  contract-complete, independently verified, publishable records.
- Production has `2,184` staged records and exact parity at `853` verified,
  administrator-approved, publishable, promoted, and anonymous public rows.
- The first Chicago housing repair raised listings with two sources from
  `92/106` to `99/106`. The remaining seven stay hidden pending usable provider
  evidence; no record was imported, approved, or published.
- Three food repairs raised contact or verified intake coverage from `644/752`
  to `748/752` and access-plus-comparison coverage from `615/752` to `647/752`.
  Unresolved listings remain held.
- The Cook County immigrant/refugee repair raised listings with two-source
  identity evidence from `68/84` to `79/84`. `74/79` service-eligible listings
  now have that evidence; five remain held behind provider-page failures.
- Criterion 2 is complete because every selected cohort record now has either
  repaired evidence or an explicit hold backed by a concrete source failure.
  Completion does not override a hold or authorize publication.
- No raw intake queue, synthetic seed, local preview, or unverified discovery
  record was added to `/find`.

#### Wave branch rules

1. Before every wave, fetch and inspect branches, open PRs, worktrees, upstream,
   dirty state, and overlap.
2. Reuse an existing branch only when it is current, narrowly relevant, clean,
   and safer than a new branch. Never reuse a stale or overbroad branch merely
   because its name is related.
3. Otherwise create a focused `feat/*`, `fix/*`, or `chore/*` branch in an
   isolated worktree from current `origin/main`.
4. If work changes direction or becomes independently releasable, split it to
   a new branch. Do not create branches for inseparable edits.
5. Preserve dirty worktrees. Never reset, clean, force-push, rewrite applied
   migrations, or work directly from `main` by default.
6. After a merge, fetch current `origin/main` before selecting the next wave's
   branch.

#### Existing billing baseline

Paid billing is treated as working baseline behavior, not an active PRD wave.
Do not rebuild it, update PR #129, or run a new full billing project from this
plan. Monitor the existing flow and open focused work only when a verified
production regression exists. Any such repair must preserve the existing
subscription, customer, invoices, entitlements, and webhook history.

#### Free-user and legal acceptance contract

- Signup works from the direct auth route and every in-map or contextual entry,
  preserves safe return intent, verifies email as configured, and resumes once.
- Terms of Service and Privacy Policy are canonical public pages linked from
  signup. Acceptance is required, accessible, unbundled from marketing consent,
  and stored with document version, content hash, user, and UTC timestamp.
- Legal copy is a product draft until reviewed by qualified counsel; shipping a
  checkbox does not substitute for that approval.
- Authentication, authorization, organization membership, and account recovery
  are tested independently. Navigation visibility never grants access.

#### Finder acceptance contract

- The current saved-organizations feature is the implementation foundation; do
  not replace it with a new collection system.
- Every visitor can browse and collect locally. Every signed-in account,
  including a Builder, can persist My Map across devices.
- Collect works for public nonprofits and resources, supports removal, and uses
  clear loading, empty, stale, and error states.
- The alpha does not add lists, notes, tags, manual ordering, guest import, or a
  separate Finder onboarding system.

#### Existing Builder baseline

Organization setup, Accelerator progress, people, documents, programs, board
work, funding opportunities, fiscal sponsorship, and Finance already exist.
Do not schedule a new “finish the Builder loop” build. Verify the current live
journey and fix only observed gaps. Builders retain Find and My Map.

#### Data, cache, and interface acceptance contract

- Organization, workspace, Finance, billing, and onboarding writes are scoped
  to the authenticated organization, revision-aware, retry-safe, and observable.
- Refresh, focus, reconnect, back/forward navigation, and another-tab changes
  cannot resurrect stale UI or hide a successful write.
- `/find` first renders a compact useful index. It does not download every
  detail field or show obsolete full-directory skeletons before interaction.
- Selected and collected records remain resolvable outside the current bounds;
  public details load on demand and private contacts never enter anonymous list
  payloads.
- Light and dark themes use the same semantic tokens. Organization and resource
  profile shells do not force a dark background in light mode, and all text and
  controls meet contrast and focus requirements.

#### Resource and guide release contract

The target is more than 5,000 useful resources, not 5,000 markers. Publish only
records that identify a specific actionable service, provider evidence,
location or service area, category, access instructions, eligibility or an
explicit source omission, contact or intake path, completed comparisons, and
verified status. Promote in source cohorts with exact count parity and rollback.

After `/find` is stable, restore basic guides with real variety: food access,
health care, housing or shelter, libraries/community space, youth/family
support, and funding/nonprofit support where verified inventory exists. Guides
must connect to real locations or bounded service areas, use current public
records, and degrade safely when a location has sparse coverage. Cooling-center
guides may remain available, but weather-driven promotion is not part of the
current launch path.

#### Production release gate

No wave ships on local green checks alone. Required evidence includes focused
tests, full repository quality where product code changed, connected RLS where
data access changed, hosted preview, paid/free browser journeys, responsive
light/dark proof for UI changes, migration parity, rollback rehearsal,
deployment success, production smoke checks, monitoring, and a runlog entry.
Any unresolved P0 stops release. A known P1 requires explicit product-owner
acceptance, a contained blast radius, monitoring, and a tested rollback.

### 2026-08-07 Current Product Override

The current Finance implementation is one existing workspace drawer with only
`Activity` and `History`. It has no campaigns, public fundraising pages, new
Finance pages, payment processing, custody, disbursement, transfers, payouts,
or in-app money movement.

Activity contains one Raised metric, a compact source-composition rail, and one
paginated feed combining transactions with Opportunities. History contains the
complete table of views, clicks, conversions, donations, and imported external
finance records. Stripe, if separately approved, is read-only external data for
display; every imported income record requires explicit classification.

Raised is not an opportunity pipeline total. Connected records make it the sum
of non-draft, explicitly categorized USD inbound funding; until that provider
is released, existing program `raised_cents` values are the fallback estimate.
Opportunities, engagement events, outbound records, and other currencies never
inflate it. The source rail and Activity feed reuse those same read models.

This override controls implementation wherever older sections below describe
four Finance views, campaigns, public fundraising, Payment Links, Connect
provisioning, or transaction execution.

## Decision Summary

Do not force-push or release the stale staged tree. The original seven batches
below are retained as historical design and release evidence. Active work now
follows the 2026-08-11 execution waves above, with each branch starting from the
latest `origin/main`.

The recommended product architecture is:

- Keep Finder available to everyone and preserve Collect / My Map when Builder
  access is added.
- Treat Builder as an added organization track, never as the required next step
  for Finder users.
- Create Finance as its own workspace card and canonical identity. Do not reuse,
  rename, or replace `economic-engine`.
- Add Finance to the existing workspace drawer with Overview, Opportunities,
  Fundraising, and Reporting views.
- Treat Finance as a records and workflow system. Money moves only through
  external bank and accounting processes; the application never initiates,
  receives, transfers, refunds, or disburses funds.
- Store signed documents, requests, approvals, manually entered or imported
  external transaction records, reconciliation status, and reporting evidence.
  Every financial value identifies its source and verification state.
- Keep `/find/[slug]` as the canonical organization profile. Extend it with
  public programs and campaigns instead of creating a second profile system.
- Keep anonymous map context mounted during signup, replay the pending action
  after authentication, and never send private contact data in public payloads.
- Elevate verified cooling centers during heat conditions, but never hide them
  from search or claim that weather data proves a site is currently open.
- Grow public resources in verified cohorts. Never publish raw candidates,
  generated previews, or incomplete records to reach a numeric target.

## Approved Scope Boundary

The product owner confirmed on 2026-08-07 that counsel approved the current
fiscal sponsorship document. That approved document remains the canonical legal
source and is not rewritten by this plan.

The application is limited to:

1. applications, documents, signatures, reviews, and immutable audit evidence;
2. grant requests, approval decisions, and supporting documentation;
3. staff-recorded external deposits, fees, payments, corrections, and status;
4. source-labeled summaries, exports, and reporting; and
5. public campaign or program information that does not imply the application
   processed a payment.

The application does not connect bank accounts, create charges, accept
donations, issue refunds, move money, calculate bank balances, or execute grant
payments. “Disbursement” in older planning material means an external bank
payment recorded by authorized staff after it occurs.

Any later section that describes Stripe Connect, Payment Links, payment
webhooks, merchant-of-record configuration, custody-account implementation, or
in-app transfers is superseded by this boundary and retained only as rejected
historical research. It is not active implementation scope.

## Visual Reference Protocol

No image files were present in the supplied attachment directory on 2026-08-04.
Do not infer visual details that were supposed to come from them.

When references are attached:

1. Review all images before component work and record the layout hierarchy,
   density, typography, chart treatment, states, and explicitly rejected ideas.
2. Review them again after the Finance wireframe to remove duplicated metrics,
   repeated controls, and information shown before it is needed.
3. Review them again in desktop/mobile, empty/connected/error, and
   light/dark/reduced-motion browser passes before Batch 7 approval.
4. Keep the existing shadcn and Coach House design tokens. Images inform
   hierarchy; they do not justify copying inaccessible or incompatible chrome.

## Current-State Audit

### Release tree

Read-only checks on 2026-08-04 found:

| Condition                                       |                            Result |
| ----------------------------------------------- | --------------------------------: |
| Branch                                          | `agent/production-merge-20260804` |
| Commits behind `origin/main`                    |                                50 |
| Staged status entries                           |                               989 |
| Staged additions                                |                           157,525 |
| Staged deletions                                |                            41,927 |
| Delta from current `origin/main`                |                         710 files |
| Paths changed both upstream and locally         |                               684 |
| Divergent files requiring manual review         |                               405 |
| Origin-only changes missing from the index      |                               102 |
| Staged paths already identical to `origin/main` |                               381 |

A literal force-push now would push only the current commit, not the staged
index. It would rewind `main` by 50 commits and lose the staged work. Committing
the index first and then force-pushing would still regress released features,
rewrite already-applied migrations, restore stale `/find` profile caching, and
delete current coach, fiscal review, and page-health behavior.

The staged snapshot also contains a generated Python bytecode file, edits to
immutable migrations, whitespace errors, and failing structure, route,
feature-scaffold, and TypeScript gates. Full acceptance currently has 1,694
passes, one skip, and seven failures across resource-map, fiscal, People,
roadmap, and workspace contracts. It is not a release artifact.

Additional release contradictions include 117 TypeScript errors, 17 hard
structure violations, an oversized Accelerator route, broken feature/scaffold
sync, 82 explicit upstream-file deletions, rewritten resource-map migrations,
and removal of the released `/find` profile-cache invalidation. Passing narrow
guardrails do not outweigh these failures.

Current GitHub protection disallows force pushes and requires strict `quality`,
one approval, and CODEOWNER review. Administrators are not enforced by that
rule, so an admin bypass remains a human risk and must not be used here.

### Product and code

- The workspace already has a saved card ID named `economic-engine`, displayed
  as Fundraising. Finance must use a separate identity and leave those saved
  layouts untouched.
- The workspace drawer currently exposes Organization, People, Documents, and
  Accelerator. Roadmap exists as a routable drawer state.
- Existing Fundraising totals are user-editable values on programs. They are
  not verified bank totals and must remain visibly distinct from reconciled
  external records.
- Existing Stripe code handles Coach House subscriptions and billing only. It
  is not part of the Finance records workflow.
- Fiscal sponsorship already has applications, budgets, documents, signing,
  reviews, tasks, and audit events. It does not have restricted-fund or grant
  disbursement accounting.
- `/find/[slug]` already has canonical organization details and social metadata.
- Guest saves are local; signed-in map preferences use auth metadata. Neither
  is a durable typed collections model.
- The public resource endpoint returned 500 records during a 2026-08-04 live
  read. This is an endpoint snapshot, not proof of the database's total verified
  inventory.

### Karissa onboarding incident

Production evidence showed the organization saved successfully several times,
but the Accelerator had no durable module-progress record. The UI therefore
kept “Create your organization” active even though the organization existed.

The contained recovery fix must:

- mark organization setup complete after a successful save;
- reconcile existing saved organizations on Accelerator and organization load;
- advance the next step when recovered progress is found;
- clear conflicting completion metadata when onboarding is reactivated; and
- cover the behavior with focused acceptance tests.

This belongs in the first small release batch, not inside Finance.

## Goals

1. Give organizations a truthful, minimal view of money in, money out, funding
   readiness, opportunities, fundraising progress, and reporting work.
2. Let organizations record and report fundraising activity processed through
   their existing external bank and accounting systems.
3. Give fiscally sponsored projects a request, approval, external-payment
   record, and reporting workflow that matches the approved document.
4. Turn public profiles into useful, shareable program and campaign pages while
   protecting private contacts and preserving map context.
5. Make `/find` fast, relevant, location-aware, weather-aware, and scalable to
   thousands of verified resources.
6. Replace the unsafe giant release with seven reviewable merges and explicit
   rollback points.

## Non-Goals

- No payment processing, Stripe Connect, Payment Links, bank-account linking,
  transfers, payouts, refunds, or automated disbursement.
- No storage of routing numbers, full bank account numbers, or online-banking
  credentials.
- No general ledger, automated bank reconciliation, payroll, accounts payable, tax
  filing, or replacement for an accounting system in the first release.
- No AI-dependent public resource publication.
- No automated grant application submission without human review.
- No public donor identities by default.
- No exact user-location storage by default.
- No raw discovery candidate, synthetic seed, or local preview on `/find`.
- No generic ledger/accounting UI. External activity records cannot determine
  Finance tabs, naming, layout, or workflow.
- No hCaptcha.

## Product Principles

- Reconciled external records and manual estimates are visibly separate.
- Every amount identifies its external source, as-of time, and verification
  state; the application never claims to be the money source.
- Public aggregates are derived projections; donor details stay private.
- One concept has one canonical route, data model, and saved canvas identity.
- Finance starts empty and useful at `$0.00`; it does not fabricate activity.
- Every mutation has optimistic feedback, durable persistence, rollback, and an
  auditable server result.
- Safety-critical resources remain discoverable even when weather or freshness
  services fail.
- The map carries minimal list and geometry payloads; details load on demand.

## Personas And Permissions

| Persona                              | Finance access                                                    |
| ------------------------------------ | ----------------------------------------------------------------- |
| Organization owner                   | Manage finance roles, records, campaigns, and reports             |
| Organization admin with finance role | Manage campaigns, external records, and exports                   |
| Organization editor                  | Edit public program content; no financial-record controls         |
| Board or member                      | Read only when explicitly granted                                 |
| Coach                                | Read assigned-project progress, not donor PII or bank references  |
| Fiscal sponsor operator              | Manage requests, approvals, external-payment records, and reports |
| Platform admin                       | Operational support; no implicit finance authority                |
| Anonymous visitor                    | Public profile and approved campaign information                  |
| Signed-in map member                 | Saves, lists, notes, gated contact actions                        |

`canEditOrganization` is too broad for financial records. Add explicit
capabilities such as `finance_view`, `finance_manage`, and
`fiscal_record_external_payment`. Platform and coach roles must not inherit
write authority.

## Recommended Information Architecture

### Workspace

Create a distinct persisted Finance card ID. Do not rename or reuse
`economic-engine`; its existing saved layouts, connections, tutorial targets,
and shortcuts continue to resolve unchanged.

The compact canvas card shows:

- a large source-labeled recorded total;
- two quiet statistics: Money in and Money out;
- a small 30-day activity line when real data exists;
- reconciliation status as a small status pill;
- up to three next actions; and
- one primary action: Add record, Create campaign, or Review report.

No chart renders without recorded activity. Empty and loading states never
fabricate `$0.00`. A reconciled zero includes its source and as-of time; a stale
state shows the last reconciled amount and timestamp.

Organization records and sponsored-project records are separate reporting
buckets. They must never be added into one “Available” number. The card defaults
to the active organization’s recorded activity; a sponsored-project section
shows its separately reconciled external amount and source.

Storage is not a UI specification. Finance surfaces may read approved,
role-scoped summaries, but database rows cannot add tabs, change the approved
visual hierarchy, or expose raw accounting details by default.

The workspace drawer adds Finance and uses four nested views:

| View          | Responsibility                                                                            |
| ------------- | ----------------------------------------------------------------------------------------- |
| Overview      | Source-labeled totals, separate sponsored records, activity, reconciliation, next actions |
| Opportunities | Matches, saved opportunities, applications, deadlines                                     |
| Fundraising   | Programs, campaigns, source composition, public visibility                                |
| Reporting     | External transaction records, fiscal requests, approvals, exports                         |

External records are a section and drill-down inside Overview and Reporting,
not a fifth top-level tab. There is no bank setup or payment control.

The record control supports manual entry and approved file import. It records
the external source, effective date, amount, type, reference, reconciliation
state, and evidence without collecting bank credentials. A public-visibility
switch appears once per campaign or approved summary, beside its preview; the
same switch is not repeated on the card, Overview, and public profile.

Next-action rows use compact status pills for blocked, ready, due soon, in
progress, and complete. Clicking an opportunity action opens the reusable
opportunity node. Clicking a fiscal request deep-links to its existing fiscal
workflow. Recording an external payment opens a source-and-evidence form. The UI
does not turn inferred next actions into saved tasks unless the user explicitly
assigns or creates one.

### Opportunity progression

Reuse the Accelerator's animated-frame and segmented-progress language. Opening
an opportunity creates or reuses one ephemeral `finance-opportunity` detail
node. It must not create a new permanent node for every selection.

Stages:

1. Review fit
2. Save or dismiss
3. Prepare requirements
4. Draft application
5. Submit externally
6. Track decision
7. Record award and restrictions

The list, reusable detail node, and drawer read the same persisted workflow
record. Motion uses transform and opacity only and respects reduced motion.
Adopt the existing `opportunities` and `organization_opportunity_matches`
design in `docs/briefs/workspace-ai-opportunity-intelligence-plan.md`; add a
separate application-stage record instead of creating a second finder schema.

### Public map and profiles

- Keep `/find/[slug]` canonical for organizations.
- Add `/find/[orgSlug]/programs/[programSlug]` for a shareable public program or
  campaign. Redirect any future alias to this route.
- Add `/find/resources/[publicId]` and `/find/lists/[shareSlug]` for direct
  resource and explicitly shared-list previews.
- Add one circular identity/avatar trigger on the left side of map search.
- Top-level map tabs remain Find and Guides. Signed-in Saves and Lists live
  within My Map, avoiding a duplicate Saved navigation system.
- Guest save, list, note, or gated-contact actions open the same in-map auth
  overlay. Keep the map and selected drawer mounted behind it.
- Persist a signed return intent containing only safe IDs and UI state. After
  authentication, verify authorization, replay the pending action once, and
  return to the same profile, zoom, bounds, filters, and drawer state.

Public program pages include description, location/service area, goal, an
approved source-labeled aggregate, source composition, progress, updates, and
an optional externally managed campaign link. They never include donor PII or
imply that Coach House processed a payment.

The guest avatar opens the fast in-map sign-in/signup overlay. The signed-in
avatar opens a compact private My Map profile with Lists, Saved, recent items,
and optional lightweight milestones. Member identity is private in v1; only a
list the member explicitly publishes or unlists receives a share route.

Every canonical organization, program/campaign, resource, and shared-list route
has server-rendered title, description, canonical URL, Open Graph/Twitter image,
and safe fallback. Preview images use the organization's approved branding and
public fields only. Revoking a campaign or shared list invalidates its metadata
and share access. Messaging/social crawlers receive the public preview without
causing a protected contact reveal or consuming a one-time signup intent.

Anti-scraping is risk reduction, not a promise that public data cannot be
copied. Keep representative phone/email out of anonymous list, search, HTML,
RSC, and JSON payloads; reveal eligible fields only through authenticated,
rate-limited, audited detail requests. Emergency and provider intake contacts
remain public when public access is the service's purpose.

## System Architecture

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
flowchart LR
  Visitor[Public visitor] --> Find[Find and public profiles]
  Member[Organization member] --> Workspace[Workspace Finance]
  Workspace --> FinanceAPI[Finance server actions and APIs]
  Find --> PublicProjection[Public aggregate projection]
  FinanceAPI --> Postgres[(Supabase Postgres and RLS)]
  Bank[External bank and accounting systems] --> Evidence[Statement, receipt, or reference]
  Evidence --> Entry[Authorized entry or file import]
  Entry --> FinanceAPI
  Entry --> Review[Validation and review]
  Review --> Records[(Finance activity records)]
  Records --> Aggregates[Source-labeled finance summaries]
  Aggregates --> PublicProjection
  NWS[NWS weather API] --> WeatherCache[Coarse weather cache]
  WeatherCache --> Relevance[Map relevance, never publication]
  Postgres --> Relevance
  Relevance --> Find
```

### External record flow

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
flowchart LR
  External[External bank or accounting activity] --> Evidence[Source evidence]
  Evidence --> Record[Authorized finance record]
  Record --> Review[Reconciliation review]
  Review --> Summary[Private reporting summary]
  Summary --> Public[Optional approved public projection]
  Request[Grant request] --> Approval[Sponsor approval]
  Approval --> BankPayment[External bank payment]
  BankPayment --> PaymentRecord[Recorded external payment]
  PaymentRecord --> Summary
```

Existing Coach House subscription billing stays isolated from Finance. No
subscription webhook or payment object supplies Finance activity.

## Finance Records Design

```mermaid
sequenceDiagram
  participant Staff as Authorized staff or importer
  participant Source as Source evidence
  participant External as External bank or accounting system
  participant Entry as Record entry or import
  participant Review as Review queue
  participant Record as Reconciled finance record
  participant Summary as Finance and approved public summary
  Staff->>Source: Attach evidence
  External->>Source: Supply external activity reference
  Source->>Entry: Enter or import
  Entry->>Review: Validate and stage
  Review-->>Entry: Request correction
  Review-->>Staff: Return review result
  Review->>Record: Approve and reconcile
  Record->>Summary: Aggregate and invalidate
```

### Planned server contracts

Use authenticated server actions that repeat organization, role, and project
authorization. Browser clients never write authoritative summaries directly.

| Contract                       | Responsibility                                              | Authorization                              |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| `createFinanceRecordAction`    | Record one external activity item and its source            | `finance_manage`                           |
| `importFinanceRecordsAction`   | Validate and stage an approved CSV import                   | `finance_manage`                           |
| `reviewFinanceImportAction`    | Approve or reject a staged import                           | `finance_manage` plus separation of duties |
| `reconcileFinanceRecordAction` | Mark a record reconciled with evidence and as-of time       | `finance_manage`                           |
| `createGrantRequestAction`     | Submit a documented request without moving funds            | authorized fiscal applicant                |
| `decideGrantRequestAction`     | Approve, modify, defer, or deny a request                   | authorized sponsor operator                |
| `recordExternalPaymentAction`  | Record an externally executed bank payment and reference    | authorized sponsor operator                |
| `publishFinanceSummaryAction`  | Publish an approved aggregate without private record detail | `finance_manage`                           |

All organization and project IDs come from validated input and active access,
never a client-trusted cookie alone. Mutations use expected revisions, stable
error codes, structured sanitized logs, and immutable audit events. No route
returns bank credentials, full account numbers, or private supporting evidence.

### Campaign contract

Each campaign belongs to one organization, optionally one existing program or
fiscal project, one currency, one funding model, and one legal recipient.

Required fields and rules:

| Field          | Rule                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| Title and slug | Nonempty; slug unique within organization                                         |
| Budget         | Integer minor units, zero or greater                                              |
| Goal           | Integer minor units, greater than zero                                            |
| Currency       | Supported ISO currency; immutable after activity is recorded                      |
| Dates          | Start is not after end; timezone-independent date semantics                       |
| Visibility     | Draft, private, unlisted, or public                                               |
| Status         | Draft, setup, active, paused, ended, funded, or archived                          |
| External link  | Optional approved URL managed outside Coach House; never treated as payment proof |

Store campaign identity, organization/project scope, public state, goal, external
link, and schema version. Raised, refunded, fee, net, and as-of values come only
from authorized external records. They are never inferred from a link or edited
as unsourced campaign totals. Visual progress clamps at 100%, while text can show
over-goal activity accurately.

## Fiscal Sponsorship Records

The application extends the approved signing workflow without moving money:

1. Staff records an externally received contribution or award with source
   evidence.
2. Corrections, fees, and reversals are separate records; history is never
   rewritten.
3. The project submits a grant request with amount, purpose, budget lines, and
   supporting documents.
4. Sponsor staff approves, modifies, defers, or denies the request.
5. Authorized staff records the external bank payment only after it occurs,
   including date, amount, method, reference, evidence, and reconciliation state.
6. Project reporting links expenditures and outcomes to the approved period.

The application may calculate a display summary from reconciled records, but it
must label the source and as-of time and must never present that summary as a
bank balance. Every request, decision, external-payment record, correction, and
reporting event emits an immutable audit event.

Finance metrics are explicit:

- Recorded total: source-labeled external activity through the selected as-of
  time; never called a bank or available balance.
- In: reconciled external inflow records for the selected period.
- Out: reconciled external fee, reversal, or payment records for the selected
  period.
- Source composition: direct donations, grants, earned revenue, and other. It
  reuses the accessible segmented visual primitive, not Accelerator completion
  meaning.

## Data Model

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
erDiagram
  ORGANIZATIONS ||--o{ FUNDRAISING_CAMPAIGNS : creates
  ORGANIZATIONS ||--o{ FINANCE_RECORD_SOURCES : defines
  PROGRAMS ||--o{ FUNDRAISING_CAMPAIGNS : funds
  ORGANIZATIONS ||--o{ FINANCE_RECORDS : records
  FINANCE_RECORD_SOURCES ||--o{ FINANCE_RECORDS : labels
  FUNDRAISING_CAMPAIGNS ||--o{ FINANCE_RECORDS : categorizes
  FUNDRAISING_CAMPAIGNS ||--o| PUBLIC_CAMPAIGN_AGGREGATES : projects
  ORGANIZATIONS ||--o{ FINANCE_IMPORT_BATCHES : imports
  FINANCE_IMPORT_BATCHES ||--o{ FINANCE_RECORDS : contains
  FINANCE_RECORDS ||--o{ FINANCE_RECORD_EVIDENCE : supports
  FINANCE_RECORDS ||--o{ PRIVATE_DONORS : references
  FISCAL_SPONSORSHIP_PROJECTS ||--o{ FINANCE_RECORDS : scopes
  FISCAL_SPONSORSHIP_PROJECTS ||--o{ GRANT_REQUESTS : requests
  GRANT_REQUESTS ||--o{ EXTERNAL_PAYMENT_RECORDS : documents
  GRANT_REQUESTS ||--o{ REPORTING_PERIODS : requires
  ORGANIZATIONS ||--o{ ORGANIZATION_OPPORTUNITY_MATCHES : receives
  OPPORTUNITIES ||--o{ ORGANIZATION_OPPORTUNITY_MATCHES : creates
  ORGANIZATION_OPPORTUNITY_MATCHES ||--o| OPPORTUNITY_APPLICATIONS : tracks
  MAP_LISTS ||--o{ MAP_LIST_ITEMS : contains
  ORGANIZATIONS ||--o{ MAP_LISTS : owns
```

Recommended private tables:

- `fundraising_campaigns`
- `finance_records` and `finance_record_evidence`
- `finance_import_batches`, `reconciliation_runs`, and
  `reconciliation_findings`
- `program_budget_versions` and `program_budget_lines`
- `grant_requests` and `external_payment_records`
- `reporting_periods` and `reporting_submissions`
- the existing planned `opportunities` and `organization_opportunity_matches`,
  plus a separate application-stage table
- `map_lists` and `map_list_items`

Every fiscal `finance_records` and `external_payment_records` row carries
immutable `organization_id` and `fiscal_sponsorship_project_id` ownership. Composite
foreign keys ensure the project belongs to that organization; the ownership
columns and every RLS lookup foreign key are indexed. Organization members can
read only their permitted organization aggregates or rows. Direct browser
writes are denied. Only explicitly authorized sponsor operators may cross an
organization boundary, and every mutation is audited.

Create a deliberately narrow public campaign view or security-definer RPC with
title, slug, description, approved source-labeled aggregate, goal, progress,
image, public update, and optional externally managed campaign URL. It must not
expose record evidence, donor identity, email, phone, fees, internal notes,
references, or grant records.

All monetary columns are integer minor units with an ISO currency. All event
times are UTC `TIMESTAMPTZ`. Import fingerprints prevent duplicate external
records within an organization, source, and reporting period.
Foreign keys restrict deletion once financial history exists. Organizations,
programs, campaigns, imports, finance records, and fiscal records archive or
detach display relationships without cascading away audit evidence. Source,
scope, amount, currency, and effective-date fields become immutable after
reconciliation; corrections use linked replacement records.

Existing `programs.raised_cents` remains explicitly manual/legacy until retired.
Reconciled UI reads only source-labeled record aggregates.

### Financial truth layers

The user may combine external donations with grants, earned revenue, and other data,
but the provenance stays visible:

| Layer                       | Source                                   | Editable                               | Display treatment                  |
| --------------------------- | ---------------------------------------- | -------------------------------------- | ---------------------------------- |
| Reconciled finance records  | External evidence plus authorized review | Corrections use linked records         | Source and as-of time required     |
| Sponsored-project records   | External evidence plus sponsor review    | Corrections use linked records         | Shown separately by project        |
| Draft/imported records      | Manual entry or validated CSV import     | Yes until reconciled, with audit trail | Never labeled reconciled           |
| Legacy program raised value | Existing editable program field          | Yes                                    | Manual estimate; migrate or retire |

CSV imports require a preview, column mapping, currency/date validation,
duplicate fingerprinting, source label, import batch, actor, and rollback before
commit. Imported rows never become reconciled without authorized review. Public source
composition is a derived aggregate with per-source visibility controls; a
single organization-level switch may publish the approved composition and
campaign total, but never private rows, donors, grant notes, or bank data.

Recorded net activity is derived from reconciled inflow, fee, reversal, and
external-payment records in one currency and period. Draft, rejected, duplicate,
unsupported-currency, missing-source, or out-of-period records never count.

## Security, Privacy, And RLS

- Enable RLS on every table in its creating migration.
- Anonymous users read only the public campaign projection and approved public
  resource fields.
- Organization finance viewers read approved summaries and allowed record fields.
- Fiscal finance records enforce indexed organization/project ownership with
  RLS; no organization member can read or mutate another organization's records.
- Donor PII requires a separate permission and is never available to coaches by
  default.
- Only finance owners/admins create finance records, campaigns, exports, and reports.
- Only sponsor operators approve grants or record external payments.
- Server actions repeat authorization; UI visibility is not authorization.
- Browser clients cannot mark records reconciled, mutate summaries, cross
  organization/project scope, or write review results directly.
- Service-role financial writes are confined to authorized import,
  reconciliation, summary, and audit paths.
- Membership RLS prevents self-assignment, role escalation, cross-organization
  record assignment, and cross-project reuse.
- Bank credentials are never collected; evidence access remains server-authorized
  and private.
- Enforce trusted origins and CSRF protection; validate currency, dates,
  references, evidence, and scope before writes.
- Retain file hashes and minimal source metadata rather than bank credentials or
  complete statements when narrower evidence is sufficient.
- Rate-limit signup, contact reveal, save replay, record imports, and
  exports by user and IP risk signal.
- Redact protected contact data before public JSON serialization. CSS hiding is
  not protection.
- Log contact reveal events without logging the revealed value.
- CSV exports neutralize cells beginning with `=`, `+`, `-`, or `@` before
  normal CSV escaping.

## Public Signup And Contact Flow

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
sequenceDiagram
  participant Guest
  participant Map
  participant Auth as In-map auth overlay
  participant Server
  participant DB

  Guest->>Map: Save, add to list, or reveal protected contact
  Map->>Auth: Open with safe pending intent
  Auth->>Server: Sign up or sign in
  Server->>DB: Create or verify session
  Server-->>Auth: Authenticated
  Auth->>Server: Replay pending action once
  Server->>DB: Authorize and persist
  Server-->>Map: Result and restored context
  Map-->>Guest: Same profile, map bounds, drawer, and completed action
```

Pending intent is short-lived and signed. It contains action type, canonical
public object ID, selected slug, filters, coarse viewport, and drawer state. It
contains no contact value, secret URL, exact user location, or arbitrary return
URL. Replay uses an idempotency key and rechecks that the object is still public.

## Lists, Saves, And Lightweight Progress

Replace the split localStorage/auth-metadata model with typed tables:

- user-owned lists with title, description, visibility, and sort order;
- polymorphic list items for public organization and external resource IDs;
- private note and lightweight state such as saved, contacted, visited, or done;
- optional shared public lists containing public item IDs only.

These capabilities belong to Finder and are available to every signed-in
account, including Builders. Rows are owned by the person, not by an
organization. Adding or removing Builder access does not migrate or delete
them. No collection creates Builder work without a separate explicit action.

Do not gamify urgent resource access. Progress is useful for voluntary journeys
such as “saved three opportunities” or “completed a neighborhood guide,” but
must never discourage or rank people seeking food, housing, legal, or safety
services.

## Location Permission Repair

Model browser permission as `unsupported`, `prompt`, `requesting`, `granted`,
`denied`, or `error`.

- If browser permission is already granted, update location without another
  prompt.
- If it is `prompt`, explain the value and request only after a user action.
- If denied, stop prompting automatically and provide settings/retry guidance.
- Never spin or recenter the globe before the user acts.
- Store only prompt-seen and user-choice preferences by default. Keep exact
  coordinates in memory for the session unless the user explicitly saves a
  location.
- Provide a typed city/ZIP alternative and a clear “Search this area” action.

## Cooling Centers And Weather

The measured implementation contract is
[`2026-08-06-public-map-location-weather-contract.md`](./2026-08-06-public-map-location-weather-contract.md).
It records the permission-state defects, coarse-area privacy boundary, current NWS
event names, cache TTLs, heat threshold, test corpus, and provider-freshness gate.
Production currently has zero public cooling-center rows, so weather promotion
must remain inert until reviewed records pass Batch 4.

Use the free National Weather Service API for US points. Requests require a
descriptive User-Agent with contact information. Weather affects relevance,
not resource publication or operational truth.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
flowchart LR
  Viewport[Coarse map area] --> Grid[NWS point and forecast grid]
  Grid --> Forecast[Forecast temperature]
  Grid --> Alerts[Heat alerts]
  Forecast --> Cache[Short coarse-area cache]
  Alerts --> Cache
  Cache --> Rule{Heat condition?}
  Rule -->|Yes| Promote[Elevate verified cooling centers]
  Rule -->|No or unavailable| Neutral[Normal resource ranking]
  Promote --> Map[Map and list]
  Neutral --> Map
```

Recommendation:

- Always allow search/filter access to approved cooling centers.
- Elevate them when an official Heat Advisory, Extreme Heat Watch/Warning, or
  defined forecast threshold applies to the coarse area.
- Show the alert source, observation time, and “confirm hours before visiting.”
- Do not say “open now” unless current provider evidence independently supports
  it.
- Cache point-to-grid metadata longer than forecasts; cache alerts and forecasts
  briefly with stale-if-error behavior. On NWS failure, keep normal ranking.
- Never persist exact user coordinates in the shared weather cache key.

## Resource Publication And 5,000-Record Path

The read-only Research 4 inventory baseline is
[`2026-08-06-resource-map-inventory-baseline.md`](./2026-08-06-resource-map-inventory-baseline.md).
It reports local discovery and enrichment separately from production staging,
verification, approval, promotion, and public counts so unlike snapshots are
never combined into a false funnel.

The measured payload, latency, marker, pagination, bbox, and vector-tile
contract is
[`2026-08-06-public-map-performance-budget.md`](./2026-08-06-public-map-performance-budget.md).
It requires a bbox-scoped marker index, cursor-paginated list/search results,
and detail-on-demand before the 5,000-record path can pass Gate 4.

The target is 5,000 useful, current, publishable resources, not 5,000 markers.
Every source cohort follows:

1. Discover an authoritative provider or agency source.
2. Retain source provenance and raw evidence privately.
3. Normalize deterministic fields and taxonomy.
4. Verify a specific actionable service and provider website.
5. Complete required address, service, eligibility, contact, and freshness data.
6. Compare duplicates and record the decision.
7. Require admin review.
8. Promote atomically to canonical records.
9. Publish only after every public gate passes.
10. Report exact discovered, normalized, complete, verified, approved,
    publishable, promoted, and public counts.

Scale the client by separating:

- a compact spatial/search index containing ID, type, category, coordinates,
  label, status, and rank signals;
- on-demand profile detail by canonical ID or slug;
- bounding-box and cursor queries instead of a single all-record payload;
- server-side text/category/location filtering;
- ETag or equivalent revalidation for stable index pages; and
- vector tiles only after measured bbox/index performance requires them.

Saved items, explicit search results, selected items, and safety promotions can
override normal zoom suppression. Low zoom shows aggregates and a small diverse
sample; closer zoom reveals more category representatives; neighborhood zoom
reveals individual eligible results. The list always offers complete filtered
results through pagination, so marker relevance never hides discoverability.

## Caching And Consistency

| Data                         | Strategy                                               |
| ---------------------------- | ------------------------------------------------------ |
| Auth and finance permissions | `no-store`; never shared cache                         |
| Finance record details       | `no-store` for writes and sensitive evidence           |
| Finance summaries            | tagged server cache after record/review commit         |
| Public organization/profile  | tagged cache invalidated after approved save           |
| Public campaign aggregate    | tagged cache invalidated after approved summary change |
| Map spatial index            | short public cache with ETag/stale-while-revalidate    |
| Resource details             | longer tagged cache, invalidated on promotion/update   |
| NWS point metadata           | coarse-area cache, longer TTL                          |
| NWS alerts/forecast          | short TTL and stale-if-error                           |

Do not invalidate public tags until the database transaction commits. Record,
review, correction, and summary changes commit atomically before invalidating
affected organization, campaign, and Finance tags.

## Opportunity Data And Future AI

The first opportunity engine uses structured source ingestion and deterministic
fit rules: geography, organization type, focus area, budget range, stage,
deadline, fiscal status, and required documents. Users can explain, correct, or
dismiss each match.

Future AI may summarize requirements, explain fit, compare saved organization
evidence, and draft application sections. It runs asynchronously behind a job
boundary, cites source text, records model/version/cost, and requires human
approval. Public resource publication and finance-record truth never depend on a
model.

## Failure And Empty States

- No records: show Add record or Import records, never a fabricated `$0.00`.
- Importing records: disable repeat submission and show durable progress.
- Missing source or evidence: keep the record in Draft or Needs review.
- Review overdue or evidence invalid: show the exact issue and recovery action.
- Reconciled zero: show `$0.00` with source and as-of time.
- External campaign URL missing/inactive: omit the public action and show an
  internal repair action.
- Campaign active, ended, funded, paused, or archived: show distinct public and
  private states.
- Import source unavailable: retain the last reconciled state without claiming
  freshness.
- No transactions: show campaign readiness, not an empty chart.
- No opportunities: explain filters and profile fields that improve matching.
- Import delayed: show “Updating” with last successful import, not a false zero.
- Reconciliation mismatch: freeze the affected summary, flag operators, and
  retain the previous reconciled display with timestamp.
- Weather unavailable: keep centers normally ranked and show no weather claim.
- Public detail failure: retain list/map context with Retry.
- Auth replay failure: keep the user signed in and present Retry without losing
  the selected object.

## Accessibility And Responsive Behavior

- Drawer tabs remain keyboard reachable and horizontally scroll on small widths.
- Finance values have full screen-reader labels, including sign, currency, and
  verification timestamp.
- Charts are supplementary and include text summaries.
- Status does not rely on color alone.
- All motion respects reduced motion.
- Map actions have a list equivalent.
- Dialog focus is trapped in the auth overlay and restored to the originating
  map action after close or completion.
- Minimum touch targets and visible keyboard focus follow the UI rubric.

## Observability And Operations

Track:

- finance records by draft, review, reconciled, corrected, and rejected state;
- import batches by validation and review state;
- campaigns by activation state;
- import validation latency, duplicate rate, failures, and review age;
- external-source reconciliation differences;
- public aggregate age;
- recorded inflows, fees, reversals, external payments, and corrections;
- grant request age and last reconciled project summary;
- auth overlay conversion and pending-action replay success;
- map index/detail payload size, latency, cache hit rate, and marker count;
- location prompt, grant, denial, and error rate without storing coordinates;
- NWS latency/failure/stale-cache use; and
- resource counts at every verification gate.

Alert on invalid imports, cross-organization references, stuck reviews,
aggregate drift, stale public fundraising totals, and safety-resource
publication failures.

The provisional Research 7 SLOs, alert thresholds, cohort sequence, owner and
support matrix, drills, rollback order, public-cache limit, and approval record
are defined in the
[`2026-08-06-finance-operations-cutover-contract.md`](./2026-08-06-finance-operations-cutover-contract.md).
This is an unsigned implementation contract, not evidence that monitoring,
owners, drills, or production readiness already exist. Screenshot research and
product-facing `/find` proof remains open. Finance UI may use the existing Coach
House design system while reference-driven polish remains optional.

## Planned Repository Ownership

Start the new domain with `pnpm scaffold:feature finance`. Keep routes thin,
domain logic inside the feature, workspace composition in the owning canvas
files, and public-map composition in the owning public components.

### Batch 2 ownership audit

The 2026-08-05 audit used `origin/main` at `9843650` as the canonical baseline.
The dirty branch remains a donor, not a merge target.

#### Reconciliation disposition

| Donor area                                                                                                                                        | Disposition                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Organization profile, brand voice, brand kit, MVV, programs, and editor deep links                                                                | Extract narrow behavior that is absent from current main; retain current optimistic concurrency and public-cache invalidation |
| Organization, Accelerator, and Roadmap drawer routing; snap-point and tab preferences                                                             | Extract into the existing workspace drawer and route owners with focused route, persistence, fullscreen, and overflow tests   |
| Canvas ontology, viewport, geometry, and optimistic position persistence                                                                          | Retain only changes that preserve the canonical board row and existing node IDs                                               |
| People segments, tags, links, and table preferences                                                                                               | Retain against the existing typed, organization-scoped tables and RLS; do not restore profile-JSON storage                    |
| `economic-engine`                                                                                                                                 | Preserve its ID, metadata, connections, shortcuts, and saved layouts unchanged                                                |
| Formatting-only moves, deleted current-main owners, prototypes without production acceptance, generated artifacts, and applied-migration rewrites | Exclude                                                                                                                       |

#### Owner map

| Boundary                                     | Canonical owner                                                                                                | Rule                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Route composition                            | `src/app/(dashboard)/workspace/page.tsx` and `my-organization-page-content.tsx`                                | Routes compose one workspace; no second Finance workspace                                                   |
| Card identity and canvas composition         | `workspace-board-constants.ts`, `workspace-board-copy.ts`, `workspace-card-policy.ts`, and workspace renderers | Add a stable `finance` ID later; never rename or reuse `economic-engine`                                    |
| Board persistence                            | `workspace-board-layout.ts`, `workspace-actions.ts`, and `organization_workspace_boards`                       | Store layout only; never store balances, transactions, capabilities, or restricted-fund truth in board JSON |
| Viewer UI preferences                        | `workspace-board-ui-preferences.ts`, drawer tabs, and workspace route helpers                                  | Core drawer owns the `finance` destination; `src/features/finance/**` owns its nested view state            |
| Active organization and server authorization | `active-org.ts`, `resolveActor`, and future `src/features/finance/server/authorization.ts`                     | Repeat server authorization; `canEditOrganization` is insufficient for financial capabilities               |
| RLS                                          | Append-only migrations for each organization-scoped table                                                      | Enforce organization and fiscal-project isolation in SQL; service-role use never replaces authorization     |
| People persistence                           | Typed People tables/actions and their RLS                                                                      | Board JSON contains placement only, not People records, segments, or tags                                   |
| Public organization projection               | `organization.ts`, `public-map-index.ts`, and the `public-map-organizations` cache tag                         | Publish approved projections only; never expose private Finance or donor rows                               |
| Finance domain                               | New `src/features/finance/**` feature                                                                          | Own capabilities, campaigns, external records, reconciliation, and summaries independently of workspace UI  |

#### Saved-state migration and rollback matrix

| State                                 | Forward behavior                                                                                                             | Rollback behavior                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Existing board with `economic-engine` | Preserve the node and connections byte-for-byte through normalization                                                        | Remains readable and unchanged                                                   |
| Existing board without `finance`      | Add the default Finance node only after its feature flag is enabled; do not reposition existing nodes                        | Hide Finance; preserve the saved row                                             |
| Future board read by older code       | First ship a compatibility reader/writer that round-trips unknown node IDs and connections; current normalization drops them | Roll back only to that compatibility release so Finance layout survives          |
| Finance disabled after use            | Stop rendering and opening the card; retain its opaque layout state                                                          | Re-enable without rebuilding the layout                                          |
| Existing drawer preference            | Normalize current tabs through the shared route contract and keep current snap points unchanged; an explicit URL wins        | Continue using the stored tab only when the route does not request one           |
| Finance drawer route                  | Use `drawer=finance` with a validated nested view defaulting to `overview`                                                   | Unknown Finance routes fall back to the workspace without deleting Finance data  |
| Finance nested view preference        | Keep it in Finance-owned, organization/viewer-scoped UI state, not board JSON                                                | Preference may fall back to Overview; domain data remains intact                 |
| Finance tables and public aggregates  | Add schema and RLS before enabling reads; publish sanitized aggregates through a separate cache contract                     | Disable mutations and public rendering; retain ledger, audit, and aggregate rows |

The compatibility reader/writer is the first Batch 2 implementation slice. It
is implemented and focused-test verified locally: unknown nodes, connections,
and hidden-card IDs now round-trip without entering the current canvas, and
concurrent whole-board saves preserve the newest opaque state. It is not yet a
released production contract.

The second local Batch 2 slice now gives Organization, People, Documents,
Accelerator, and Roadmap one shared drawer-tab contract. Canonical workspace
URLs resolve through one parser, explicit route requests take priority over a
saved tab, and Roadmap opens correctly without requiring a section slug. No
Finance route, card, or visible UI was added. This contract is focused-test
verified locally and is not released.

The third local Batch 2 slice reconciles active organization editor deep-link
producers with the canonical workspace route. Accelerator readiness actions,
the organization snapshot, program full-view links, and active/fallback search
results now target `/workspace?view=editor` directly, while legacy aliases
remain readable. Search logo enrichment now follows the organization result ID
instead of depending on the retired `/organization` URL. Focused route, search,
drawer, and readiness tests verify the contract locally; it is not released.

The fourth local Batch 2 slice reconciles Brand Kit and MVV persistence behind
one shared server validation contract. Brand voice, palette, typography, MVV,
and narrative-revision constraints are now enforced before organization reads
or writes instead of relying on client validation. Brand Kit-only saves retain
MVV and unknown future profile keys; MVV-only saves retain Brand Kit and unknown
future keys. Existing organization-row optimistic concurrency, MVV revision
checks, and public-cache invalidation remain in place. Focused persistence,
Brand Kit, organization-story, primary-object, and public-cache tests verify the
contract locally; it is not released.

The fifth local Batch 2 slice reconciles activity and primary-object
persistence. Program builder snapshots now merge onto the stored JSON contract
so future keys and unchanged media metadata survive edits. The server accepts
only the existing activity-wizard taxonomy; Campaign, Fundraiser, Grant
application, and Re-grant request remain readable primary-object types but
cannot be written through the activity wizard. Snapshot and media writes use
the program row's `updated_at` value, preventing a stale autosave from
overwriting newer work or deleting the winning version's assets. Focused
program persistence, taxonomy, wizard-flow, and budget tests verify the contract
locally; it is not released.

The sixth local Batch 2 slice completes the Organization work-item audit.
Retained scope includes profile and Brand Kit editing, MVV persistence, editor
deep links, program entry points, and primary-object persistence. Canonical
`/workspace` and `/my-organization` views now revalidate after profile saves.
The existing JSONB profile column already supports additive Brand Kit keys, so
the comment-only migration and unrelated visual-only donor churn are excluded
from the scoped release extraction. The migration remains untouched in the
dirty root. The complete focused Organization gate passes `108/108` tests. This
work item is complete locally and is not released.

The seventh local Batch 2 slice reconciles successful canvas saves with the
canonical state returned by the server. When a whole-board save preserves a
newer manual position or opaque future layout record, the latest client now
adopts that result instead of retaining only the returned timestamp. A stale
response cannot replace newer local edits, and personal ontology exploration
remains outside shared board persistence. Focused workspace storage and ontology
tests pass `128/128`; the workspace work item remains in progress and this slice
is not released.

The eighth local Batch 2 slice reconciles workspace drawer fullscreen geometry.
The full-height state no longer replaces the established `20px` top radius with
sharp corners; container-relative insets, full canvas coverage, saved snap
points, overflow boundaries, and the fullscreen stacking state are unchanged.
This follows the design system's consistent radius-family guidance. Focused
drawer, route, preference, viewport-control, and viewport-command tests pass
`36/36`. Automated browser proof remains pending because the local workspace
requires authentication and no safe Playwright auth state is available. The
workspace work item remains in progress and this slice is not released.

The ninth local Batch 2 slice protects roadmap calendar edits from lost updates.
Both calendar editors now send the event revision they loaded. The server rejects
an already-stale revision and also conditions the database update on the row's
current `updated_at`, closing the race between its read and write. Workspace
calendar payloads retain that revision through the loader and mapper. The full
roadmap/calendar acceptance set passes `64/64`; focused ESLint, TypeScript
filtering, import-boundary, and threshold checks pass. No visible UI changed,
the workspace work item remains in progress, and this slice is not released.

The tenth local Batch 2 slice reduces the global-search database critical path
without changing result order or destinations. Organization and admin context,
entitlements and ranked search, active-organization programs and profile, self
and community logos, and analytics and result enrichment now load concurrently
where they are independent. The RPC fallback also loads its five independent
sources concurrently and merges them in the prior deterministic order. Existing
client debounce and obsolete-request cancellation remain intact. Focused route,
query-source concurrency, canonical-route, and helper tests pass `19/19`;
focused ESLint, Prettier, import-boundary, and threshold checks pass. No visible
UI changed, the workspace work item remains in progress, and this slice is not
released.

The eleventh local Batch 2 slice reconciles the Accelerator progress rail and
canonical fullscreen fallback. Checkpoint inputs are normalized so all three
interactive segments remain measurable, positive-width, and total exactly
`100%`, including malformed custom inputs. Fullscreen links now default to the
shared workspace route constant, and ontology modules with no openable step use
that same route instead of an undefined fallback. The existing segmented
visuals, milestone tooltips, access paywall, progress persistence, and runtime
navigation remain unchanged. The complete focused Accelerator and ontology set
passes `156/156`; focused ESLint, TypeScript filtering, import boundaries,
thresholds, interaction locks, workspace surfaces, React Grab, and raw-button
checks pass. The workspace work item remains in progress and this slice is not
released.

The twelfth local Batch 2 slice reserves the future Finance identity without
activating Finance UI. The stable card ID is `finance`, the reserved drawer tab
is `finance`, and both remain intentionally excluded from the active card and
drawer registries. Current code therefore cannot render or open them. Opaque
Finance node, connection, and hidden-state records continue to round-trip
through the forward-compatibility envelope. Contract tests also lock the
existing `economic-engine` metadata and Accelerator connection and prove no
active Finance edge exists. The focused identity, layout, persistence, route,
shortcut, connection, and canvas-contract set passes `95/95`; focused ESLint,
TypeScript filtering, import boundaries, thresholds, workspace storage,
interaction locks, and React Grab checks pass. No feature scaffold or UI was
added; the workspace item remains in progress pending its integrated proof, and
this slice is not released.

The thirteenth local Batch 2 slice completes the Workspace work-item audit.
Integrated browser verification exposed one remaining drawer defect: partial
snap points translated a full-height content tree below the canvas without
constraining its internal viewport, so clipped content could not scroll. The
drawer now sizes its content viewport to the active snap height minus the fixed
header, and every tab panel participates in the constrained flex column. The
partial People drawer owns a scrollable `318/733px` viewport; fullscreen still
covers the canvas with zero inset gaps, preserves `20px` top corners, hides the
canvas controls, restores them afterward, and produces no document overflow or
console warnings/errors. The combined Workspace, calendar, search, Accelerator,
Finance-identity, and progress-view suite passes `290/290`; focused ESLint,
TypeScript filtering, thresholds, import boundaries, workspace storage,
interaction locks, React Grab, workspace surfaces, and raw-button checks pass.
The Workspace work item is complete locally, People consolidation is now in
progress, and this slice is not released.

The fourteenth local Batch 2 slice begins People consolidation. Runtime segment
and tag loaders and actions now use only the typed organization-scoped tables;
the append-only migrations retain their one-time legacy backfills, but profile
JSON is no longer a runtime taxonomy fallback. People table widths, row heights,
row sizing, wrapping, and saved layouts now share one preference record scoped
to the active organization and viewer. One legacy unscoped layout can be claimed
once by its current workspace without leaking into later scopes. The focused
People regression passes `37/37`; ESLint, Prettier, touched-file TypeScript
filtering, thresholds, import boundaries, workspace storage, interaction locks,
React Grab, workspace surfaces, and raw-button checks pass. Authenticated browser
verification confirmed a row-height preference survives reload, restores to the
prior default, and produces no warnings or errors. The route guard remains
blocked only by the unrelated existing Accelerator page line budget. The People
work item remains in progress, and this slice is not released.

The fifteenth local Batch 2 slice makes People optimistic persistence ordered
and rollback-safe. Writes for the same segment or tag now run sequentially while
unrelated records remain concurrent. Confirmed state advances only after a
successful server result, stale failures cannot overwrite a newer edit, and the
latest failed intent reconciles to the last confirmed label, color, membership,
or deletion state. Prop refreshes invalidate obsolete optimistic tokens without
reordering queued server writes. The complete focused People set passes `40/40`;
ESLint, touched-file TypeScript filtering, thresholds, import boundaries,
workspace storage, interaction locks, React Grab, workspace surfaces, and
raw-button checks pass. An authenticated read-only browser smoke check rendered
the People table after reload with no warnings or errors; failure-path browser
mutation was intentionally not run against connected organization data. The
People work item remains in progress for its links audit, and this slice is not
released.

The sixteenth local Batch 2 slice validates People social links at every save
and render boundary. LinkedIn, Instagram, Facebook, X, YouTube, and TikTok now
accept only their own HTTPS domains or normalized platform handles; unsafe
schemes and mismatched hosts are rejected server-side, shown inline, and never
rendered as clickable badges. Partial updates still preserve omitted links.
Authenticated browser verification confirmed an invalid LinkedIn host disables
save without mutating data. The People work item remains in progress, and this
slice is not released.

The seventeenth local Batch 2 slice prevents interactive People profile writes
from silently overwriting concurrent changes. CRUD, role, tag, delete, canvas
position, and position-reset writes now use bounded compare-and-retry updates
against the organization revision, re-read the latest profile after conflicts,
and preserve unrelated keys and concurrent People changes. The focused People
set passes `51/51`; ESLint, thresholds, import boundaries, workspace storage,
interaction locks, React Grab, workspace surfaces, and raw-button checks pass.
Full TypeScript remains blocked by
unrelated dirty-worktree errors and reports none in these files. Automatic
onboarding, invite, and member-directory synchronization writers remain under
audit, so People stays in progress and this slice is not released.

The eighteenth local Batch 2 slice completes People consolidation locally.
Onboarding organization setup, accepted invitations, and member-page self
synchronization now use the same bounded conflict-retry contract as interactive
People writes. Retries rebuild from the latest organization profile, preserve
existing links, tags, images, placement, and unknown fields, and cannot silently
replace concurrent People changes. The complete People proof gate passes
`68/68` across `15` files; ESLint, thresholds, import boundaries, workspace
storage, interaction locks, React Grab, workspace surfaces, and raw-button
checks pass. Full TypeScript remains blocked only by unrelated dirty-worktree
errors and reports none in these files. People is locally complete; progress is
`9/38` complete, `0` in progress, and `29` not started, leaving `29` steps. This
slice is not released.

The nineteenth local Batch 2 slice completes the prototype/demo exclusion work
item and Batch 2 implementation scope locally. A production-boundary regression
now permits Prototype Lab imports only from its `requireAdmin()` route and the
two owned admin-sidebar navigation modules; any future production-feature import
fails. Existing starter data, tutorial presentation data, and simulated
communication adapters remain outside this extraction decision because they
already have separate production acceptance contracts. The focused exclusion
set passes `15/15`; ESLint, Prettier, and diff checks pass. Progress is `10/38`
complete, `0` in progress, and `28` not started, leaving `28` steps. Batch 2 is
locally complete but unmerged and unreleased.

The twentieth local slice verifies the released fiscal review and native
signing behavior before continuing Batch 3. The complete fiscal acceptance set
passes `57/57` across `15` files, covering assigned applicant and authorized
Coach House signing, private storage, immutable evidence, hashes, versioning,
W-9 redaction and review, transactional locking, and service-only finalization.
The audit also repaired budget precedence: structured line items remain the
canonical total while existing saved drafts retain priority over prefill data.
Progress is `11/38` complete, `0` in progress, and `27` not started, leaving
`27` steps. This slice is not released.

The progress view now keeps the current execution target visible across every
graph: Batch 3, its next incomplete work item, `11/38` complete, and `27`
remaining. `Open current batch` switches to and focuses that roadmap node.
Status color is stateful and explicit: green means complete, orange means needs
information or in progress, blue means planned or reference architecture, and
red is reserved for risks and guardrails. Counts and PRD scope are unchanged.

The twenty-first local slice starts the remaining Batch 3 applicant and project
operations integration. Application submission now locks the current row,
allows only draft or needs-information transitions, clears superseded review
state, writes the submission and immutable audit event together, and treats an
already-submitted retry as successful without repeating notifications.
Assigned-coach review now locks and revision-checks the application, enforces
review notes for needs-information and declined decisions in both server and
database layers, and writes the review, application status, and audit event in
one service-only transaction. Concurrent or stale decisions cannot overwrite a
newer state. The fiscal and member-workspace proof set passes `60/60` across
`16` files; ESLint, thresholds, and import boundaries pass. Final-schema RLS and
browser role journeys remain pending because the local Supabase stack is not
running. Progress is `11/38` complete, `1` in progress, and `26` not started,
leaving `27` steps. This slice is not released.

The twenty-second local slice makes fiscal document connection and review
transactional. Connecting a project asset now locks the application, allocates
one collision-safe document version, returns the latest identical connection
idempotently, and writes the document plus immutable audit event together.
Assigned-coach review now revision-checks and locks both application and
document rows, writes review state plus its audit event together, and safely
allocates a new tax-form version when accepting an uploaded W-9 PDF. The final
schema removes direct authenticated document insert and update policies, so
those audit and version invariants cannot be bypassed through the data API.
The fiscal and member-workspace proof set passes `65/65` across `17` files;
ESLint, thresholds, import boundaries, and diff checks pass. Local database RLS
execution and browser role journeys remain pending. Progress stays `11/38`
complete, `1` in progress, and `26` not started, leaving `27` steps. This slice
is not released.

The twenty-third local slice makes fiscal application draft and selected-program
budget persistence atomic. One service-only transaction locks the project,
application, and linked program, rejects stale revisions and invalid lifecycle
states, preserves unrelated program snapshot fields, and commits the application
plus budget target together. Direct authenticated application inserts and updates
are removed so callers cannot bypass lifecycle or revision checks through the data
API. The fiscal, project, budget, and task proof set passes `96/96` across `21`
files; focused ESLint, thresholds, and import boundaries pass. Local database RLS
execution remains pending because Docker/Supabase is unavailable. Progress stays
`11/38` complete, `1` in progress, and `26` not started, leaving `27` steps. This
slice is not released.

The twenty-fourth local slice makes project-task creation atomic. One
service-only transaction locks the target project, validates the assignee,
allocates the next order, creates the task and assignment, and recalculates the
project task count from canonical rows. Direct authenticated task inserts are
removed, so the UI cannot leave a partial task, missing assignment, or stale
project count. The fiscal/project/task proof set passes `101/101` across `24`
files; focused ESLint, thresholds, and import boundaries pass. Local database
RLS execution remains pending because Docker/Supabase is unavailable. Progress
stays `11/38` complete, `1` in progress, and `26` not started, leaving `27`
steps. This slice is not released.

The twenty-fifth local slice makes project-task edits and moves atomic. One
service-only transaction locks the task and both affected projects in stable
order, validates the new assignee, moves or edits the task, replaces its
assignment, allocates destination order, and recalculates both project counts.
Direct authenticated task updates are removed, so task details cannot diverge
from assignment or project totals. The fiscal/project/task/plan proof set passes
`137/137` across `26` files; focused ESLint, thresholds, import boundaries, and
diff checks pass. Local database RLS execution remains pending because
Docker/Supabase is unavailable. Progress stays `11/38` complete, `1` in
progress, and `26` not started, leaving `27` steps. This slice is not released.

The twenty-sixth local slice makes project-task deletion atomic. The
service-only transition revision-checks the task's authorized organization and
project, locks both rows, deletes the task with cascade-owned assignments, and
recalculates the canonical project count in one transaction. Direct
authenticated task deletes are removed, so deletion cannot strand assignments
or decrement the wrong project after a concurrent move. The
fiscal/project/task/plan proof set passes `139/139` across `26` files; focused
ESLint, thresholds, import boundaries, and diff checks pass. Local database RLS
execution remains pending because Docker/Supabase is unavailable. Progress
stays `11/38` complete, `1` in progress, and `26` not started, leaving `27`
steps. This slice is not released.

The twenty-seventh local slice makes task reordering atomic. The service-only
transition validates a unique ordered set, locks the project and every current
task, rejects stale or partial sets, and performs one bulk ordinal update. A
failed row can no longer leave only part of a project reordered. The
fiscal/project/task/plan proof set passes `141/141` across `26` files; focused
ESLint, thresholds, import boundaries, and diff checks pass. Local database RLS
execution remains pending because Docker/Supabase is unavailable. Progress
stays `11/38` complete, `1` in progress, and `26` not started, leaving `27`
steps. This slice is not released.

The twenty-eighth local slice makes native Form B generation transactional.
The service-only transition revision-checks and locks the approved application,
re-verifies the accepted executed W-9, validates the generated PDF evidence,
allocates its document version, and commits document, agreement-ready status,
and immutable audit event together. A rejected transition removes the uploaded
PDF, so stale state cannot leave an orphaned signing artifact. The broader
fiscal, signing, project, task, and plan proof set passes `201/201` across `40`
files; focused ESLint, thresholds, import boundaries, and diff checks pass.
Full TypeScript stalled on the dirty worktree and was stopped; local database
RLS execution remains pending because Docker/Supabase is unavailable. Progress
stays `11/38` complete, `1` in progress, and `26` not started, leaving `27`
steps. This slice is not released.

The twenty-ninth local slice makes native Form B send setup transactional. The
service-only transition locks and revision-checks the application and agreement,
rejects conflicting signing packets, validates the canonical template and
fields, and commits the packet, applicant draft, document status, and immutable
audit event together. Identical retries return the existing packet without
repeating notifications; direct authenticated packet inserts and updates are
removed. The broader fiscal, signing, project, task, and plan proof set passes
`205/205` across `41` files; focused ESLint, thresholds, import boundaries, and
diff checks pass. Full TypeScript and local database RLS execution retain the
limitations recorded above. Progress stays `11/38` complete, `1` in progress,
and `26` not started, leaving `27` steps. This slice is not released.

The thirtieth local slice makes standard project creation transactional. The
server sanitizes and derives plain text from the optional rich overview before
one service-only transition creates both the scoped project and overview row.
An overview failure can no longer leave a partially created project. The broader
fiscal, signing, project, task, and plan proof set passes `209/209` across `42`
files; focused ESLint, thresholds, import boundaries, and diff checks pass.
Full TypeScript and local database RLS execution retain the limitations recorded
above. Progress stays `11/38` complete, `1` in progress, and `26` not started,
leaving `27` steps. This slice is not released.

The thirty-first local slice makes full project edits transactional. The
service-only transition revision-checks and locks the scoped project, updates
its canonical fields, and upserts the optional sanitized rich overview in the
same transaction. Stale edits now require a refresh, and an overview failure
cannot leave project fields partially updated. The broader fiscal, signing,
project, task, and plan proof set passes `213/213` across `43` files; focused
ESLint, thresholds, import boundaries, and diff checks pass. Full TypeScript and
local database RLS execution retain the limitations recorded above. Progress
stays `11/38` complete, `1` in progress, and `26` not started, leaving `27`
steps. This slice is not released.

The thirty-second local slice protects quick project status changes from stale
overwrites. The service-only transition validates status, locks the scoped
project, checks its expected revision, and updates status plus actor metadata
together. The broader fiscal, signing, project, task, and plan proof set passes
`217/217` across `44` files; focused ESLint, thresholds, import boundaries, and
diff checks pass. Full TypeScript and local database RLS execution retain the
limitations recorded above. Progress stays `11/38` complete, `1` in progress,
and `26` not started, leaving `27` steps. This slice is not released.

The thirty-third local slice protects quick project date changes from stale
overwrites. The service-only transition validates the date range, locks the
scoped project, checks its expected revision, and updates start date, end date,
and actor metadata together. The broader fiscal, signing, project, task, and
plan proof set passes `221/221` across `45` files; focused ESLint, thresholds,
import boundaries, and diff checks pass. Full TypeScript and local database RLS
execution retain the limitations recorded above. Progress stays `11/38`
complete, `1` in progress, and `26` not started, leaving `27` steps. This slice
is not released.

The thirty-fourth local slice makes standard project deletion revision-safe.
The service-only transition locks the scoped project and rechecks its revision,
standard-project kind, and absent canonical organization link before cascade
deletion. A concurrent canonical conversion or edit can no longer pass an old
preflight check. The broader fiscal, signing, project, task, and plan proof set
passes `225/225` across `46` files; focused ESLint, thresholds, import
boundaries, and diff checks pass. Full TypeScript and local database RLS
execution retain the limitations recorded above. Progress stays `11/38`
complete, `1` in progress, and `26` not started, leaving `27` steps. This slice
is not released.

The thirty-fifth local slice hardens project asset batches. Every file is now
validated before link, row, or storage creation begins; if a later upload,
database insert, or unexpected route step fails, the route removes all rows and
storage objects created by that request. The broader fiscal, signing, project,
task, and plan proof set passes `227/227` across `47` files; focused ESLint,
thresholds, import boundaries, and diff checks pass. Full TypeScript and local
database RLS execution retain the limitations recorded above. Progress stays
`11/38` complete, `1` in progress, and `26` not started, leaving `27` steps.
This slice is not released.

The thirty-sixth local slice makes native W-9 completion transactional. The
service-only transition locks and revision-checks the application, validates
the redacted signed-document evidence, allocates its tax-form version, advances
the application revision, and commits the document plus immutable audit event
together. Concurrent submissions fail stale, and rejected transitions remove
the uploaded PDF. The broader fiscal, signing, project, task, and plan proof set
passes `231/231` across `48` files; focused ESLint, thresholds, import
boundaries, and diff checks pass. Full TypeScript and local database RLS
execution retain the limitations recorded above. Progress stays `11/38`
complete, `1` in progress, and `26` not started, leaving `27` steps. This slice
is not released.

The thirty-seventh local slice prevents orphaned native-signing files. An
applicant PDF is removed when applicant finalization fails; Coach House signing
tracks both executed-agreement and audit-certificate uploads, removes the first
if the second upload fails, and removes both when transactional finalization is
rejected. Files are retained after a committed transaction even if response
parsing or notification later fails. The broader fiscal, signing, project,
task, and plan proof set passes `234/234` across `49` files; focused ESLint,
thresholds, import boundaries, and diff checks pass. Full TypeScript and local
database RLS execution retain the limitations recorded above. Progress stays
`11/38` complete, `1` in progress, and `26` not started, leaving `27` steps.
This slice is not released.

The thirty-eighth local slice preserves project-operation audit history.
Project and task content, schedule, status, completion, and deletion changes now
emit system-owned activity events. Project deletion nulls only the historical
project reference instead of cascading away immutable history, and deletion
events retain the requesting actor. A temporary PostgreSQL 14 runtime confirmed
that nine project/task events survived individual task and cascading project
deletion with the expected three deletion records. The focused fiscal,
project, task, and plan proof set passes `229/229` across `48` files; focused
ESLint, thresholds, import boundaries, and diff checks pass. Full TypeScript and
final-schema Supabase RLS execution retain the limitations recorded above.
Progress stays `11/38` complete, `1` in progress, and `26` not started, leaving
`27` steps. This slice is not released.

The thirty-ninth local slice adds deterministic browser proof for the four
fiscal roles without external writes. A development-only route renders the
production fiscal workbench through its public feature entrypoint; Playwright
confirms that an applicant can resume and save a draft, an assigned coach can
approve without editing applicant data, a sponsor operator can prepare an
approved agreement, and an unassigned role receives no workbench controls. The
route returns not found in production. Playwright passes `4/4`, and the focused
role-contract and authorization set passes `16/16` across `3` files. Prettier,
ESLint, import boundaries, thresholds, and diff checks pass. Full structure and
route checks retain unrelated dirty-tree line-budget failures; authenticated
production-route accounts and final-schema Supabase RLS still require their
separate runtime proof. Progress stays `11/38` complete, `1` in progress, and
`26` not started, leaving `27` steps. This slice is not released.

The fortieth local slice proves the final-schema fiscal role boundary in a real,
temporary PostgreSQL runtime. A final hardening migration limits sponsor access
to developers and organization-assigned coaches, preserves organization-role
and W-9 visibility rules, revokes authenticated direct writes to authoritative
fiscal tables, and retains resumable applicant signing drafts. The executable
matrix passes for owner, staff, board, sponsor operator, assigned coach,
unassigned coach, and unrelated user. The connected Supabase suite now expects
service-owned authoritative writes but was not run against production. All `81`
fiscal tests across `21` files and `159` member-workspace tests across `40`
files pass; focused ESLint, import boundaries, and thresholds pass.
Authenticated production-route proof and counsel/operations approval remain
open. Progress stays `11/38` complete, `1` in progress, and `26` not started,
leaving `27` steps. This slice is not released.

The forty-first local slice proves the actual authenticated fiscal routes
against a data-free Supabase preview branch. Signed-out users return to login
with the signing destination preserved; the applicant loads Form B, a rendered
PDF with a response SHA-256, and the W-9; the assigned coach and sponsor
operator load the reviewer state; and an unassigned coach receives no signing
session. Playwright passes `5/5`. The routes now redirect unauthenticated users
explicitly, and preview builds allow both the configured branch storage host
and the known production storage host used by existing static assets. The
fiscal acceptance set passes `87/87` across `23` files; focused ESLint, import
boundaries, thresholds, and diff checks pass. Global route and structure checks
retain unrelated dirty-tree line-budget failures. The disposable branch and
its temporary credentials were deleted after proof. Gate 3 now shows `3/5`
verified, `1/5` collecting for the remaining PDF download proof, and `1/5` not
started for counsel/operations approval. Progress stays `11/38` complete, `1`
in progress, and `26` not started, leaving `27` steps. This slice is not
released.

The forty-second local slice completes the PDF render, hash, and download gate
against another data-free Supabase preview branch. A private stored PDF returns
only to the applicant, assigned coach, and sponsor operator with attachment,
no-store, PDF MIME, and SHA-256 headers matching the downloaded bytes. A
signed-out request returns `401`, an unassigned coach returns `404`, and a row
whose stored hash does not match the object returns `409`. This exposed and
closed a server-side authorization bypass where any platform staff member could
previously select a fiscal document through the service client; staff downloads
now recheck developer or organization-assigned-coach authority before storage
access. Playwright passes `5/5`, and the fiscal acceptance set passes `88/88`
across `23` files. Focused ESLint, import boundaries, thresholds, and diff checks
pass; global route and structure checks retain the same unrelated dirty-tree
line-budget failures. The disposable branch and temporary test copy were
deleted after proof. Gate 3 now shows `4/5` verified with only counsel and
operations approval open. The technical integration and no-premature-Stripe
scope items are complete; legal copy is orange/in progress. Progress is now
`13/38` complete, `1` in progress, and `24` not started, leaving `25` steps.
This slice is not released.

The forty-third local slice prepares the remaining Batch 3 legal decision for
counsel and fiscal operations without changing production copy. Primary IRS,
NNFS, and Stripe sources establish the control, discretion, recordkeeping,
receipt, project-accounting, and charge-liability questions that reviewers must
resolve. Draft 1 identifies a material conflict: the current handbook charges
7% when contributions are received, while the approved product rule applies 7%
only to a fiscally sponsored grant allocation. The packet supplies replacement
copy, open fee mechanics, an illustrative ledger sequence, go/no-go evidence,
and a sign-off record. The graph now distinguishes the approved fee scope from
three pending human decisions and shows `10/28` research items verified. The
Batch 3 legal work item and Gate 3 remain orange/open until counsel and
operations sign. Progress stays `13/38` complete, `1` in progress, and `24` not
started, leaving `25` steps. No public handbook, agreement, Stripe, ledger,
commit, push, merge, deployment, or production change occurred.

The forty-fourth local slice completes the first Resource 4 inventory question
without advancing Batch 4 past the open Batch 3 gate. The local engine contains
`4,249` discovered rows and `741` contract-complete, independently verified
rows. Read-only aggregate database checks show `2,184` staged rows and exact
parity at `853` verified, administrator-approved, promoted, and public rows.
The provider gap report also measures local duplicate fingerprints, unresolved
review states, and all 30 source-fetch freshness records. It keeps a separate
942-row draft preview at zero verified/public rows and corrects stale local
documentation that implied the intake queue loaded automatically. Research now
shows `12/28` items verified. Overall progress stays `13/38` complete, `1` in
progress, and `24` not started, leaving `25` steps. No source fetch, import,
review, promotion, public-data change, commit, push, merge, deployment, or
production mutation occurred.

The forty-fifth local slice completes Research 4 by measuring current
public-map transport, query, search, marker, and browser-side transformation
costs and converting them into release budgets. The explicit local 5,046-item
preview produces a 9,210,384-byte response, a 4,248,843-byte GeoJSON source,
and feature/relevance passes that each exceed a 16 ms frame. The production API
currently returns only 500 of 853 public rows, so production parity is a named
Gate 4 failure even though the worktree query already paginates past 1,000.
The implementation contract now requires a minimal bbox marker projection,
50-result cursor list pages, detail-on-demand, stale-request cancellation,
saved/selected overrides, and measured escalation to vector tiles rather than
an arbitrary catalog-count trigger. Research now shows `14/28` items verified;
overall implementation progress remains `13/38` complete, `1` in progress, and
`24` not started. No `/find` UI, source, database, production, commit, push,
merge, or deployment change occurred.

The forty-sixth local slice completes the contact/privacy half of Research 5.
The [public-map contact and auth threat model](./2026-08-06-public-map-contact-auth-threat-model.md)
measures current anonymous contact exposure, separates intentionally public
provider intake from protected representative contacts, specifies minimal
payloads and authenticated reveal, replaces unsigned auth replay with a
10-minute one-time intent, and sets shared atomic bootstrap limits. Research now
shows `16/28` items verified; location, NWS, and cooling-center policy remain
open. Overall implementation stays `13/38` complete, `1` in progress, and `24`
not started. No `/find` UI, source, database, production, commit, push, merge,
or deployment change occurred.

The forty-seventh local slice completes Research 5 with a measured location,
NWS, coarse-cache, and cooling-center contract. It identifies the current
auto-spin, revoked-permission, missing city/ZIP, and missing same-origin
Permissions-Policy defects; keeps exact coordinates in browser memory; defines a
0.05-degree weather cell; uses current NWS heat event names; sets bounded
cache/stale rules; and adds a 100°F-for-two-hours soft relevance threshold. The
production public catalog has zero cooling-center rows; all 3,542 local candidates
remain unverified, so weather promotion is explicitly inert until Batch 4 review
and promotion gates pass. Research now shows `18/28` items verified with three
open research tracks. Overall implementation remains `13/38` complete, `1` in
progress, and `24` not started. No `/find` UI, resource promotion, database,
production, commit, push, merge, or deployment change occurred.

The forty-eighth local slice completes Research 6 with an Accounts v1,
full-Dashboard, direct-charge Connect contract. It confirms the controller,
capability, Account Link, custom-unit Price, Payment Link, connected-context,
event, deduplication, return URL, secret, and environment rules against the
installed SDK and current primary sources. The installed `stripe@18.5.0` and
CLI `1.23.3` are behind stable `stripe@22.4.0` and CLI `1.45.1`; an isolated
upgrade and existing-billing compatibility pass is now a Batch 6 prerequisite.
The typed fixture and 24-case matrix add no live or sandbox objects. Research now
shows `22/28` items verified with two open research tracks. Overall implementation
remains `13/38` complete, `1` in progress, and `24` not started. No Stripe
configuration, key, account, event, source, database, production, commit, push,
merge, or deployment change occurred.

The forty-ninth local slice completes the operational answer for Research 7
without closing its evidence or screenshot work. The source-backed contract
defines zero-tolerance financial/privacy invariants, six provisional SLOs,
three alert severities, six monitoring views, five independent server controls,
a six-stage organization canary, ten rollback drills, role-based support, a
15-minute public-cache hard limit, and signed advance/rollback records. The
current optional OTEL, structured logs, coarse flags, unverified backup/alert
configuration, and hard-coded `/status` page are recorded as gaps rather than
claimed capabilities. Research now shows `23/28` verified, `1/28` collecting,
and `4/28` not started across two open tracks. Overall implementation remains
`13/38` complete, `1` in progress, and `24` not started. Operations evidence
stays orange until dashboards, alerts, named owners, drills, and signatures
exist; visual research stays orange until screenshots arrive. No UI, Stripe,
database, production, commit, push, merge, or deployment change occurred.

The fiftieth local slice verifies Gate 2’s focused Organization, People, canvas,
drawer, future-Finance, prototype-isolation, persistence, concurrency, and
optimistic-rollback contracts. The exact current-worktree suite passes `192/192`
tests across `34/34` files and is recorded in
[`2026-08-06-workspace-gate-2-focused-proof.md`](./2026-08-06-workspace-gate-2-focused-proof.md).
Only the focused-test evidence is green. Gate 2 is now collecting at `1/3`;
guardrails are orange/collecting, and authenticated desktop/mobile, light/dark,
fullscreen, overflow, and reduced-motion browser evidence remains not started.
Overall implementation remains `13/38` complete, `1` in progress, and `24` not
started.
No product UI, database, production, commit, push, merge, or deployment change
occurred.

The fifty-first local slice verifies Gate 2’s desktop/mobile, light/dark,
fullscreen, overflow, and reduced-motion browser evidence. Authenticated
`/workspace` checks preserve the People tab and prior snap, fit the fullscreen
drawer exactly to the canvas with `20px` top corners, hide and restore viewport
controls correctly, and create no document overflow. A `390x844` reduced-motion
React Flow browser fixture passes with `0s` transition duration. Responsive
reflow also exposed and repaired a missing accessible description on the mobile
app-shell details sheet; focused source guards and a clean reflow now produce no
new warnings. Gate 2 is collecting at `2/3`; only full guardrails remain open.
Overall implementation remains `13/38` complete, `1` in progress, and `24` not
started. No database, production, commit, push, merge, or deployment change
occurred.

The fifty-second local slice closes Gate 2. All eleven required workspace
storage, interaction-lock, React Grab, workspace-surface, raw-button, route,
feature, scaffold, structure, boundary, and threshold checks pass. Oversized
route, public-map, shared-audio, workspace drawer/People, canvas, API, and page
orchestration files were split by responsibility without weakening any budget
or allowlist. The exact focused suite passes again at `195/195` across `35/35`
files. Gate 2 is now green/proven at `3/3`; gate evidence is `12/36` verified,
`0/36` collecting, and `24/36` not started, with `2/7` gates proven, `1/7`
collecting, and `4/7` not started. Overall implementation remains `13/38`
complete, `1` in progress, and `24` not started. No database, production,
commit, push, merge, or deployment change occurred.

The fifty-third local slice makes every pending human approval criterion
directly answerable from the existing compact response dock. Six pending fiscal
and visual criteria now expose a Reply pill; selecting one targets the dock,
while saved notes remain orange and Confirm, Deny, or Agree responses resolve
green without changing source-backed gate evidence automatically. Approved
criteria stay deduplicated and do not add controls. Authenticated browser proof
confirms all six controls, the 7% grant-allocation-only rule, action buttons,
target selection, and no horizontal overflow. Focused plan and response tests
pass `47/47` across `3/3` files. Gate 3 remains `4/5` verified pending counsel
and fiscal-operations sign-off; overall implementation remains `13/38`
complete, `1` in progress, and `24` not started. No policy, database,
production, commit, push, merge, or deployment change occurred.

```text
src/features/finance/
  README.md
  types.ts
  schemas.ts
  actions.ts
  server/
    authorization.ts
    stripe-accounts.ts
    campaigns.ts
    payment-links.ts
    connect-events.ts
    ledger.ts
    reconciliation.ts
    public-aggregates.ts
    imports.ts
    fiscal-funds.ts
  components/
    finance-card.tsx
    finance-drawer.tsx
    finance-overview.tsx
    finance-opportunities.tsx
    finance-fundraising.tsx
    finance-reporting.tsx
    stripe-connection-status.tsx
    campaign-editor.tsx
    opportunity-detail-node.tsx

src/app/api/stripe/connect/
  account/route.ts
  onboarding/route.ts
  return/route.ts
  refresh/route.ts
  status/route.ts
  payment-links/route.ts
  payment-links/select/route.ts
  reconcile/route.ts
  webhook/route.ts

src/app/(public)/find/
  [slug]/programs/[programSlug]/page.tsx
  resources/[publicId]/page.tsx
  lists/[shareSlug]/page.tsx

supabase/migrations/<next_timestamp>_add_finance_connect_foundation.sql
supabase/migrations/<next_timestamp>_add_finance_public_projections.sql
supabase/migrations/<next_timestamp>_add_fiscal_fund_accounting.sql

tests/acceptance/finance-*.test.ts
tests/acceptance/stripe-connect-*.test.ts
tests/visual/finance-*.visual.spec.ts
supabase/tests/rls.test.mjs
docs/runbooks/stripe-connect-finance.md
```

Migration timestamps are chosen after reconciling current remote history. Never
reuse or edit an applied migration. Generated Supabase types are refreshed only
after the final schema is established.

Existing files expected to receive narrow composition changes include a new
Finance renderer, the workspace drawer tab contract and surface,
`/find/[slug]`, public map search/member rail, and environment schema. Do not
put Finance domain rules into those UI owners or modify `economic-engine`.

The current repository has no reusable distributed application rate limiter.
Add an atomic shared limiter before sensitive endpoints launch; do not use
Vercel-instance memory. Prefer a small Supabase RPC-backed limit keyed by a
one-way IP risk hash plus user/action, with short retention, explicit bypass for
signed Stripe webhooks, and observable deny reasons.

## Rejected Payment-Rail Research

The material in this section records the discarded Stripe Connect approach for
historical traceability only. Do not implement its routes, environment
variables, account setup, webhooks, or tests under the approved records-only
scope.

### Former Stripe dashboard, environment, and local setup plan

### Environment contract

Reuse existing validated API-key variables and add one Connect webhook secret
for each existing Stripe runtime:

```text
STRIPE_SECRET_KEY
STRIPE_TEST_SECRET_KEY
STRIPE_CONNECT_WEBHOOK_SECRET
STRIPE_TEST_CONNECT_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

Do not add OAuth client IDs or secrets. Extend `src/lib/env.ts` and the existing
Stripe runtime rather than constructing a second unvalidated client. The
installed `stripe@18.5.0` pins `2025-08-27.basil`; stable `stripe@22.4.0` pinned
`2026-07-29.dahlia` when rechecked on 2026-08-06. Upgrade and rerun the existing
billing compatibility suite before implementing Connect, then match the Connect
event destination to the tested SDK API version.

Local, preview/sandbox, and production records carry `livemode` and an
environment identity. A preview must fail closed if given a live Stripe secret,
live connected account, production return URL, or live Connect event. Production
must reject test events from public totals. The platform billing webhook secret
and Connect webhook secret remain separate in every environment.

### Stripe configuration checklist

1. Confirm Connect is activated for the platform's legal entity and supported
   countries.
2. Configure Coach House branding for Stripe-hosted onboarding.
3. Enable Stripe-hosted collection of payout bank details; Coach House never
   collects them manually.
4. Create separate sandbox/test and live Connect event destinations scoped to
   connected accounts.
5. Subscribe only to implemented events and record their API version.
6. Store each signing secret in the matching Vercel environment.
7. Configure trusted HTTPS return and refresh URLs from
   `NEXT_PUBLIC_SITE_URL`; add no arbitrary redirect wildcard.
8. Verify direct-charge Payment Links show the connected legal recipient's
   branding and merchant information.
9. Document support ownership for requirements, refunds, disputes, payout
   failures, deauthorization, and account closure.

### Local Stripe commands

The installed CLI remained `1.23.3` on 2026-08-06 and reported `1.45.1` available.
Upgrade and recheck syntax before implementation. The intended workflow is:

```bash
brew upgrade stripe/stripe-cli/stripe
stripe version
stripe login
stripe listen --forward-connect-to localhost:3000/api/stripe/connect/webhook
stripe trigger payment_intent.succeeded --stripe-account acct_TEST
```

Use the signing secret printed by the local listener only for local Connect
webhooks. It differs from sandbox and production secrets. Add exact commands for
refund, dispute, async payment, Payment Link, account update, and payout failure
to the runbook after confirming them against the then-current CLI. The installed
CLI currently exposes `--forward-connect-to`, `--stripe-account`, fixture
overrides, and event resend. The exact subscribed-event and sandbox proof matrix
lives in the Research 6 contract linked above.

## Test And Edge-Case Matrix

| Area             | Required cases                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Record entry     | Retry, double-click, concurrent editors, stale revision, missing source, invalid reference, and partial failure          |
| Imports          | Preview, mapping, duplicate rows, mixed currencies, invalid dates, oversized files, and rollback                         |
| Review           | Approve, reject, correct, stale decision, separation of duties, and cross-organization denial                            |
| Campaigns        | Invalid goal/budget/dates/currency, external link inactive/replaced, and public-summary approval                         |
| Validation       | Invalid source, duplicate, out of period, timeout, partial database failure, wrong organization/project/currency         |
| Finance records  | Draft, needs review, reconciled, rejected, corrected, above-goal, and unrelated external activity                        |
| Corrections      | Partial, multiple, full reversal, replacement, and immutable history                                                     |
| Evidence         | Missing, replaced, hash mismatch, unauthorized download, and retention                                                   |
| Reconciliation   | Pagination, duplicate reference, missing evidence, stale source, mixed period/currency, and unrelated activity exclusion |
| Fiscal funds     | Project scope, allocation, over-request, approval, rejection, correction, external-payment record, and reporting         |
| Imports/exports  | Mapping, duplicate rows, mixed currencies, invalid dates, rollback, formula injection, role denial                       |
| Public data      | Draft leakage, donor/contact PII, stale aggregate, disabled link, cache invalidation, social metadata                    |
| Signup/map       | Context preservation, one-time replay, expired intent, denied action, guest-save merge, rate limit                       |
| Location/weather | Permission prompt/deny/revoke/error, NWS timeout/stale data, alert start/end, coarse-cache privacy                       |
| Resource scale   | Bbox/cursor correctness, selected/saved override, exact publication counts, payload/performance budgets                  |
| Resilience       | Import, Supabase, NWS, and Vercel failures; safe retry; no false zero or lost financial history                          |

Tests cover validation and summary units, route authorization, final-schema RLS,
concurrent idempotency, import scoping, reconciliation, correction history,
Playwright journeys, accessibility, visual states, build, and performance.
Fixtures contain synthetic external records only; they never require live bank
or payment-provider access.

## Historical Seven Merge Batches

This section records the original release decomposition. It is not the active
TODO order. The merged work remains valid evidence; all unfinished work follows
the 2026-08-11 execution waves at the top of this document.

### Batch 1: Baseline Reconciliation And Onboarding Recovery

Scope:

- preserve every current upstream release;
- restore immutable applied migrations and remove generated artifacts;
- reconcile package, lockfile, tooling, agent docs, and runlog structure;
- ship the Karissa organization-setup durable completion and recovery fix;
- include an idempotent backfill/reconciliation path for other affected users;
- retain current public-profile cache invalidation.

Gates:

- clean diff and install;
- supply-chain and large-file checks;
- all structural guardrails;
- focused onboarding, organization save, cache, authz, and RLS tests;
- authenticated browser test for new and recovered users.

Rollback: revert application logic; keep append-only corrective progress rows.

### Batch 2: Organization And Workspace Foundation

Scope:

- organization profile, brand kit, MVV, program/primary-object, and deep-link
  work that remains valid after upstream reconciliation;
- workspace ontology, canvas persistence, drawer geometry, roadmap/calendar,
  global search, accelerator rail, and a separate future Finance identity;
- People segments, tags, links, table sizing, and optimistic persistence where
  they share the workspace schema and interaction contract;
- exclude prototype/demo work without an owned production acceptance case.

Gates:

- workspace storage, interaction-lock, React Grab, workspace-surface, raw-button,
  route, feature, structure, boundary, and threshold checks;
- focused Organization, People, canvas, drawer, and optimistic rollback tests;
- desktop/mobile, light/dark, fullscreen, overflow, and reduced-motion browser
  checks; visual baselines only for intentional changes.

Rollback: feature flags or route-level disablement for new surfaces; preserve
saved board and people rows.

### Batch 3: Fiscal Sponsorship And Project Operations

Scope:

- retain the released fiscal review and native signing behavior from main;
- integrate remaining applicant, coach, project, budget, document, task, Form B,
  W-9, review, and audit work;
- retain the counsel-approved document and records-only operating boundary;
- obtain non-author review and merge PR #120.

Gates:

- fiscal and member-workspace acceptance suites;
- final-schema RLS;
- PDF render/hash/download verification;
- applicant, assigned-coach, sponsor-operator, and denied-role browser journeys;
- product confirmation that the counsel-approved document remains canonical and
  the application does not move money.

Rollback: disable new fiscal entry points while retaining signed artifacts and
audit events.

### Batch 4: Resource Data And Publication Pipeline

Scope:

- deterministic source ingestion, evidence, normalization, duplicate review,
  admin review, atomic promotion, and freshness checks;
- append-only schema changes rebuilt after current migrations;
- exact cohort count reporting;
- no raw intake queue, generated corpus, or discovery preview in public output.

Gates:

- data-engine, enrichment, admin, deduplication, promotion, and RLS tests;
- provider verification dry run;
- complete/verified/publishable/promoted/public count parity;
- migration immutability and remote-history comparison;
- canary one source cohort before broader promotion.

Rollback: unpublish the new cohort without deleting evidence or canonical rows.

### Batch 5: Public Find, Signup, Location, And Weather

Scope:

- drawer, search, empty/loading/error states, zoom relevance, clustering, saved
  override, and on-demand detail payloads;
- canonical public profile and program/campaign route shells;
- in-map auth overlay and idempotent pending-action replay;
- server-redacted sensitive contact fields;
- typed lists/saves migration with safe guest import;
- repaired browser location state machine;
- NWS weather cache and cooling-center promotion;
- public resource index/detail split and pagination.

Gates:

- full public-map, profile metadata, auth replay, privacy, list, location,
  weather, and caching tests;
- anonymous/authenticated browser journeys at desktop/mobile sizes and zooms;
- denial/retry/offline/stale-weather scenarios;
- payload, marker, LCP/TTI, visual, and accessibility budgets.

Rollback: disable weather promotion and auth replay independently; preserve
normal map search and existing saves until migration is verified.

### Batch 6: Finance Records And Reporting Foundation

Scope:

- finance capabilities and RLS;
- campaign, finance-record, source-evidence, and import persistence;
- grant requests, decisions, and externally executed payment records;
- review, correction, reconciliation, summaries, donor privacy, and public
  projections;
- no bank credentials, payment processing, transfers, refunds, or automated
  disbursement.

Gates:

- source, amount, date, currency, reference, evidence, organization/project scope, and
  forbidden bank-field tests;
- owner/admin/operator allow and all other roles deny;
- concurrent edit, duplicate import, stale review, correction, cross-project,
  mixed-currency, and reconciliation tests;
- end-to-end manual entry, CSV import, grant request, approval, external-payment
  record, correction, and reporting journeys;
- no bank credentials, payment processing, transfers, refunds, or automated
  disbursement paths;
- final-schema RLS and security review.

Rollback: disable Finance entry points and new mutations while retaining every
record, source artifact, decision, correction, and audit event.

### Batch 7: Finance Experience, External Records, And Production Cutover

Scope:

- create Finance as its own card without changing `economic-engine`;
- add Finance drawer Overview, Opportunities, Fundraising, and Reporting;
- add campaigns, source-labeled progress, source composition, public toggle, exports,
  and rich public sharing;
- add opportunity source/match/workflow and reusable opportunity detail node;
- add organization/project-isolated finance records, grant requests, approvals,
  recorded external payments, and reporting periods without letting storage
  dictate UI;
- run production backfills, canary records/campaigns, monitoring, support
  playbook, and final integrated release verification.

Gates:

- empty, draft, importing, needs-review, reconciled, corrected, rejected, and
  mismatch UI states;
- Finance role matrix and donor-PII isolation;
- fiscal request, decision, external-payment record, and correction-history
  tests;
- public aggregate and cache invalidation tests;
- opportunity progression persistence and reduced-motion visuals;
- CSV formula-neutralization tests;
- full `pnpm check:quality` from a clean release artifact;
- production canary with one internal organization, then one approved real
  organization, followed by monitored gradual enablement.

Rollback: deactivate record/campaign creation and public Finance UI, preserve
all recorded history, and restore the previous public/profile presentation.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor": "#f4f4f5", "primaryTextColor": "#18181b", "primaryBorderColor": "#a1a1aa", "lineColor": "#71717a", "secondaryColor": "#fafafa", "tertiaryColor": "#ffffff", "fontFamily": "Geist, ui-sans-serif, system-ui"}}}%%
flowchart LR
  B1[1 Baseline and onboarding] --> B2[2 Organization and workspace]
  B1 --> B3[3 Fiscal operations]
  B1 --> B4[4 Resource pipeline]
  B2 --> B5[5 Public Find and signup]
  B4 --> B5
  B1 --> B6[6 Finance records foundation]
  B2 --> B7[7 Finance experience and cutover]
  B3 --> B7
  B5 --> B7
  B6 --> B7
```

## Production Cutover Rules

- Never force-push `main`.
- Never deploy from the current stale branch.
- Never alter an already-applied migration; add a new corrective migration.
- Use a clean worktree and clean release artifact for every PR.
- Keep environment changes additive until rollback is proven.
- Validate record imports in preview fixtures before any production import.
- Apply migrations before code only when the old code safely tolerates the new
  schema. Remove old paths only after the new path is verified.
- Run staff canary, one approved organization canary, gradual enablement, then
  broader release.
- Do not claim production success until CI, preview, deployment, database,
  browser, monitoring, and rollback checks are all verified.

## Objective Traceability

This table records the original design request. The 2026-08-11 product-model
override and active execution waves supersede its combined-journey and release
order language where they conflict.

| Requested outcome                       | Planned evidence                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Talk before acting                      | Approved scope recorded before implementation                                      |
| Seven clean merges                      | Exactly seven batches with dependencies, gates, and rollback                       |
| Explain hard-push damage                | Current-state Git, migration, cache, feature, and test audit                       |
| Improve onboarding                      | Batch 1 durable completion, reconciliation, backfill, browser proof                |
| Finance drawer and canvas node          | Separate Finance card plus the approved Finance drawer architecture                |
| Minimal `$0.00`, In/Out, graph          | Explicit disconnected/loading/verified/stale states and metric definitions         |
| To-do/status pills and opportunity node | Derived next actions plus one reusable progression node                            |
| External banking boundary               | No bank setup or money movement in the application; external records only          |
| App transaction tracking                | Source-labeled external records, review, corrections, and reconciliation           |
| Fundraiser profile, progress, Donate    | Canonical public campaign route and sanitized aggregate projection                 |
| Reporting plus other data               | Separate reconciled, sponsored-project, draft/imported, and legacy layers with CSV |
| Segmented source bar and public switch  | Source composition with one contextual visibility control                          |
| Finance subtabs without clutter         | Overview, Opportunities, Fundraising, Reporting                                    |
| Images revisited                        | Three-pass visual protocol; currently blocked because none were attached           |
| Scalable backend and stale-cache safety | Transactional ledger, tagged invalidation, bbox/index/detail split                 |
| Future AI funding matches               | Deterministic first, cited async AI later, human review                            |
| Weather-aware cooling centers           | NWS coarse cache; weather changes relevance only                                   |
| Circle profile button and map signup    | Left-side avatar, in-map auth overlay, one-time action replay                      |
| Sensitive-contact protection            | Server payload redaction, auth, rate limit, audit, no false guarantees             |
| Member collections and light progress   | Typed saves/lists, private profile, explicit sharing, ethical milestones           |
| Rich social/text previews               | Canonical routes and server-rendered branded Open Graph metadata                   |
| Location permission repair              | Browser permission state machine and no default exact-location storage             |
| Path to 5,000 public resources          | Verified source cohorts and exact gate counts; no raw candidates                   |
| Fiscal sponsorship journey              | Approved document, requests, decisions, external-payment records, reporting        |
| Allocation tracking and coach/user CSV  | Record-linked allocations, role-scoped exports, formula neutralization             |
| Full logic and loose-end scan           | Routes, schema, RLS, security, failure states, observability, setup, cutover       |
| Shadcn-style Mermaid PRD                | Neutral Geist Mermaid theme and seven architecture/journey diagrams                |

Anything marked awaiting approval is not silently assumed during implementation.
If images arrive, their review becomes an additional evidence gate rather than
an excuse to expand the product beyond this traceability table.

## Definition Of Done

- All four approval decisions are recorded.
- Seven PRs merge in the stated order without force-pushes.
- Karissa and a second preexisting affected user advance past organization setup
  without losing organization data.
- The application never moves money or stores bank credentials.
- Finance summaries reconcile to source-labeled external records.
- No donor PII or private contact data appears in anonymous responses.
- The counsel-approved document remains canonical; fiscal records, requests,
  decisions, and externally executed payments remain isolated by
  organization/project and never imply in-app disbursement.
- Finance is useful and truthful at zero and under delayed/error states.
- Map auth preserves context and replays one authorized pending action.
- Cooling centers stay searchable and weather only adjusts relevance.
- Resource publication reports exact gate counts and includes no raw candidates.
- Full repository quality, visual, performance, RLS, and production canary gates
  pass from a clean release artifact.

## Decision Log

| Date       | Decision                                                                 | Status                                      |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| 2026-08-04 | Do not hard-push the staged tree                                         | Recommended                                 |
| 2026-08-05 | Create a separate Finance card; do not reuse `economic-engine`           | Approved                                    |
| 2026-08-05 | Keep four Finance drawer views for now                                   | Approved                                    |
| 2026-08-07 | Money movement stays in external bank and accounting systems             | Approved product boundary                   |
| 2026-08-05 | Keep restricted funds organization/project isolated and UI-neutral       | Approved boundary                           |
| 2026-08-07 | Keep the counsel-approved fiscal document canonical                      | Counsel approval confirmed by product owner |
| 2026-08-07 | Record external payments; never execute disbursement in the app          | Approved product boundary                   |
| 2026-08-05 | Do not use hCaptcha                                                      | Approved                                    |
| 2026-08-04 | Keep `/find/[slug]` canonical                                            | Recommended                                 |
| 2026-08-04 | Weather promotes but never hides cooling centers                         | Recommended                                 |
| 2026-08-11 | Find is universal; Build is the existing organization workflow           | Approved product model                      |
| 2026-08-11 | Builders retain Find, Collect, and My Map                                | Approved product model                      |
| 2026-08-11 | Using Find never requires Builder work                                   | Approved product model                      |
| 2026-08-11 | Finance displays and exports external activity; it does not manage money | Approved product model                      |
| 2026-08-11 | Defer NWS promotion until after the current launch path                  | Approved priority                           |

## Primary References

- [Stripe controller-property configuration](https://docs.stripe.com/connect/migrate-to-controller-properties)
- [Stripe direct charges](https://docs.stripe.com/connect/direct-charges)
- [Stripe Payment Links with Connect](https://docs.stripe.com/connect/payment-links)
- [Stripe fee-payer behavior](https://docs.stripe.com/connect/direct-charges-fee-payer-behavior)
- [Stripe Connect authentication](https://docs.stripe.com/connect/authentication)
- [Stripe Connect webhooks](https://docs.stripe.com/connect/webhooks)
- [Stripe Account Link onboarding behavior](https://docs.stripe.com/connect/custom/hosted-onboarding)
- [IRS Revenue Ruling 68-489](https://www.irs.gov/pub/irs-tege/rr68-489.pdf)
- [IRS charitable-contribution substantiation](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-organizations-substantiation-and-disclosure-requirements)
- [NNFS pre-approved grant relationship guidelines](https://www.fiscalsponsors.org/nnfs-guidelines)
- [National Weather Service API](https://www.weather.gov/documentation/services-web-API)
- [National Weather Service alerts](https://www.weather.gov/documentation/services-web-alerts)
