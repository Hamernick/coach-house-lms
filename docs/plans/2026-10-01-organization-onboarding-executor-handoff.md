> Latest user instruction: finish onboarding only. Dialog/document scrolling is paused for another model to plan orchestration.

# Organization onboarding audit, recovery and prevention — executor handoff

Prepared and executed locally: 2026-10-01. Status: **read-only audit and focused local implementation complete; not deployed**.

Latest user direction supersedes the broad provider/manual matrix below: **complete local checks first; defer real signup/payment tests; implement according to the specific spec, protocols and documentation without extensive testing**. Reuse accepted simulator review and completed focused checks. Do not launch the 22-case matrix. Required hosted merge gates remain.

Current evidence: [production audit and implementation contract](2026-10-01-organization-onboarding-audit.md), [focused validation and deferred checks](2026-10-01-onboarding-validation.md). Private account inventory/recovery proposals are ignored under `test-results/onboarding-audit/`; never commit them.

**Superseded for execution by the [rigid release executor](2026-10-01-onboarding-release-executor.md).** This older handoff retains detailed audit/source background. Caleb now authorizes onboarding deployment after required CI/review, followed by resuming the two original UI fixes. Do not restart completed phases or ask for shipping permission again.

Copy-ready activation prompt for the next worker:

> Continue in `/Users/calebhamernick/Development/coach-house-platform-internal-updates-20261001` on `feat/internal-project-task-updates-20261001`. Read `AGENTS.md`, the current runlog, open-work index, then `docs/plans/2026-10-01-organization-onboarding-executor-handoff.md`. Execute its authorized phases in order. Preserve all uncommitted/untracked work and the separate root/server. Read completed audit/validation evidence first; do not repeat the audit or broad testing. Follow the new release executor for scoped release, required CI/review, authorized deployment and subsequent UI continuation. Human account decisions are a separate follow-up. Reuse completed local review evidence. Do not add a rename control, mutate customer records or contact customers. Onboarding deployment is authorized after required gates; normal GitHub review requests are part of the authorized review workflow. Complete independent authorized work while external decisions are pending. Update the handoff checklist, evidence documents and current runlog as you proceed.

## 1. Assignment and completion boundary

Answer these questions with evidence, then complete the appropriate scoped fixes:

1. Did Karen ever successfully save an organization name or other organization basics? If historical records cannot answer this, identify the exact coverage gap.
2. Can she still add/edit organization details through the existing Workspace interface, and do those edits survive save, reload, a new session and a second authorized viewer?
3. Exactly which other organizations display a fallback name or lack required setup? Classify each separately.
4. Can new or returning users still bypass required setup, or lose saved information through another save path?
5. Do all applicable onboarding/authentication/payment paths work with dedicated accounts and preserve existing customer data?
6. What specific recovery, if any, does each affected account need?
7. Have approved changes passed release gates and been verified after deployment?
8. Have the original task-dialog and Mission/Vision scrolling reports been reviewed and closed separately?

Do the phases below in order. Do not skip evidence gathering and declare that all unnamed accounts share Karen's cause. Do not interpret payment, a tutorial completion, or an organization row's existence as proof that organization setup was saved.

Caleb subsequently authorized execution; the read-only audit and local fixes are complete. **Deployment is now authorized after required CI/review. Resume the original UI fixes only after onboarding production verification. Customer repairs and provider provisioning remain unauthorized.** Follow the new release executor. Complete all independent work while any action-specific approval is pending.

## 2. Authorization and preservation rules

| Action | Current instruction |
| --- | --- |
| Inspect source/history; query relevant production records read-only | Authorized by the requested audit. Verify project/environment first. |
| Complete the existing-flow onboarding fix and local test setup | Authorized. Preserve saved work and paid access. |
| Continue in the existing isolated worktree | Already selected. Do not ask the branch-choice question again unless its state has changed materially. |
| Add a rename-organization control | Explicitly rejected. Do not recreate it. Existing profile/title editing must remain. |
| Change Karen's name, metadata, documents, subscription or membership | Not authorized. Prepare exact evidence and a narrow proposal first. |
| Bulk fix/delete/merge unnamed organizations | Not authorized. Produce a classification and reviewed repair manifest first. |
| Email/message customers, Paula or Joel | Not authorized. Prepare drafts/review packets only. |
| Real provider setup, test-account creation, externally delivered invitations or Stripe operations | DEFERRED by subsequent user instruction. No isolated Coach House test database or local Docker is available. Do not provision providers or run real signup/payment checks in this iteration. Never use live customers as fixtures. |
| Push a scoped draft PR | Within normal implementation workflow after preservation, diff review and scans. Never push the mixed root or private audit data. |
| Merge/deploy | AUTHORIZED by latest instruction after required current-head hosted CI and actual GitHub review/protection. Do not ask again; follow the new release executor. |
| Task-dialog and document-scroll candidates | QUEUED and authorized to resume after onboarding production verification; separate scoped change and focused user appearance/interaction review. |

Never reset a customer account, delete/recreate an organization, infer a name from an email domain, grant a stub subscription, cancel/rebill a subscription, or replace a whole saved profile to make onboarding pass. Do not automatically set everyone to complete or clear everyone's completion flag. Do not make private organizations public. Do not require approved 501(c)(3) status: `pre_501c3`, `in_progress`, and `approved` are all valid choices.

Do not execute a database backup restore against production. Reading backup availability is not permission to provision a restore environment. Never add an admin bypass, new role, new rename UI, or automatic customer notification as incidental work.

## 3. Exact workspace and startup

### 3.1 Use this worktree

```sh
cd /Users/calebhamernick/Development/coach-house-platform-internal-updates-20261001
export PATH="/usr/local/opt/node@22/bin:$PATH"
```

Expected branch: `feat/internal-project-task-updates-20261001`.
Recorded HEAD: `90830359812af48c5f837704942c99bf0ffd0d3b` (`[STEP S03] Open internal project and task update lane`).
Recorded starting main: `59b89421`.
Recorded upstream: none. Runtime fixes and the review feature are **uncommitted**, including untracked files; branch name/commit alone is not a complete handoff.

The root `/Users/calebhamernick/Development/coach-house-platform` is a separate dirty recovery checkout on `chore/local-development-20260907`. Its runlog index is older. Do not edit that root, copy its older startup documents over this worktree, switch its branch, clean it, stash it, or push it.

### 3.2 Startup sequence

Read these in order in the chosen worktree:

1. `AGENTS.md`.
2. `docs/RUNLOG.md` and its current monthly log (`docs/runlog/2026-10.md` at handoff).
3. `docs/agent/open-work-index.md`.
4. `docs/agent/workflow-quality.md`, especially worktree, review, validation and shipping rules.
5. This handoff and the shorter recovery/review plan.
6. For changes to auth/data, relevant sections of `docs/agent/architecture-security.md`; for UI, `docs/agent/ui-rubric.md` and the relevant installed skill.

Then run:

```sh
git branch --show-current
git status --short --branch
git diff --cached --name-status
git diff --name-status
git ls-files --others --exclude-standard
git log -1 --format='%H %s'
git branch -vv
git worktree list
node --version
```

Report the branch, uncommitted groups and lack/presence of upstream in one short paragraph. Preserve unfamiliar edits. If another worker changed a target file, inspect and reconcile narrowly; never overwrite it from this plan.

Use Graphify first for code orientation, then verify the returned source:

```sh
graphify query "resolveOnboardingRequirements writeOnboardingOrganizationProfile updateOrganizationProfileAction" --budget 1800
```

Read the installed Graphify skill/runbook before using it. Do not rebuild repeatedly as a development loop. Run `graphify update .` after the final code batch. Graph output is local and ignored.

### 3.3 Preserve running applications

At handoff:

| Port | Purpose | Recorded process/location |
| --- | --- | --- |
| 3000 | Existing authenticated review app; preserve | PID 53412; `coach-house-platform-internal-tracker-release-20260928` |
| 3014 | Local onboarding simulation proxy | PID 56102; this isolated worktree |
| 3015 | Next app behind that proxy | Child of the simulation launcher |

PIDs are observations, not future kill targets. Recheck with `lsof -nP -iTCP:3014 -sTCP:LISTEN`, `lsof -nP -iTCP:3015 -sTCP:LISTEN`, and `ps -p <verified-pid> -o pid,ppid,command=`. Use `lsof -a -p <verified-pid> -d cwd` to confirm ownership. Never run `pkill node`, `killall`, or kill another lane's server.

If the simulator is absent and ports are free:

```sh
node src/features/onboarding-review/server/start-local-review.mjs
```

Open http://localhost:3014/dev/onboarding-review. Do not put provider credentials in this worktree's `.env` files to make the simulator authenticate; the launcher intentionally refuses those files. For real-provider tests use a separate, correctly configured test runtime. Do not symlink dependencies across worktrees; use the approved worktree-local install.

## 4. Verified evidence and limits

These are recorded observations from the October 1 audit, not a fresh production refresh performed while writing this document.

| Subject | Recorded evidence | What it establishes |
| --- | --- | --- |
| Customer | Karen Shyne, `karen@offshootz.org`; requested org name Offshootz | Identity supplied by user and matched in prior targeted audit. Verify ID/email association before subsequent queries. |
| User/organization owner key | `ddf96a31-4bd3-4cf8-b46a-27f5750124ba` | Audit target. `organizations.user_id` is the owner key; do not invent an `organizations.id` column. |
| Current basics at audit | No profile name, no public slug, no formation status, zero `org_people` | Setup fields missing at audit time. Does not prove they were never saved. |
| Saved work | Mission/Vision/Values content exists, including legacy/narrative representations | Do not treat the organization as disposable or empty. |
| Billing | App database records an active live-mode Operations Support subscription | Paid access exists in app records. A full Stripe invoice/payment audit was not performed. |
| July 14, 01:11:50 UTC | `onboarding_completed`, mode `post_signup_access`, tier `free`, `hasOrganizationSetup=false` | Completion was recorded without organization setup at this event. |
| July 14, 01:14:31 UTC | Subscription creation | Occurred after that completion event. |
| July 14, 01:14:50 UTC | Organization row creation | Row existence followed access selection/payment. Does not establish populated profile fields. |
| July 14, 01:16:23 UTC | Tutorial completion | Tutorial progress is separate from saved organization basics. |
| Historical code | `d2886607`, June 17: unconditional completion behavior; `a6016231`, August 9 / PR #121: corrected new access-only completions | Explains a legacy completion path. Git timestamps alone are not production deployment timestamps. |
| Bounded journey query | No later setup-completion event found | Absence within queried retained records only; not proof that no profile save occurred. |
| Other unnamed accounts | Completed audit: 20 unnamed, 22 missing basics, 18 builder recovery candidates | Counts describe missing current setup, not recovered names; see the completed audit for classification. |

Important distinction: “Organization” may be UI fallback text, an actual stored string, or data from the wrong selected organization. Classify these separately. The screenshot alone cannot distinguish them.

Historical inspection commands:

```sh
git show d2886607:'src/app/(dashboard)/onboarding/actions.ts'
git show a6016231:'src/app/(dashboard)/onboarding/actions.ts'
git log --follow --format='%h %ad %s' --date=iso-strict -- 'src/app/(dashboard)/onboarding/actions.ts'
```

Read only relevant onboarding sections. Do not search old environment files or print credential-bearing historical files.

## 5. Existing implementation: inspect, do not recreate

### 5.1 Onboarding candidate ownership

| File/group | Current candidate behavior |
| --- | --- |
| `src/lib/onboarding/requirements.ts` | Shared read-only decision. Owner + build intent requires saved nonblank name, slug and valid formation despite legacy completion flag. Staff and non-owner active organization contexts are exempt. Distinguishes access selection from setup. |
| `src/components/app-shell/dashboard-layout-state.ts` | Loads actual organization state, fails on organization read error, applies shared requirements and returns onboarding mode. |
| `src/components/app-shell/dashboard-layout-state-types.ts` | Adds onboarding mode/default. |
| `src/app/(dashboard)/onboarding/page.tsx` | Uses resolved mode rather than always access selection. Existing paid return override remains. |
| `src/app/(dashboard)/onboarding/actions.ts` | Adds server formation validation. Existing name/slug validation, handle claim, entitlement enforcement and profile write remain. |
| `src/components/onboarding/onboarding-dialog/helpers.ts` | Maps missing formation error to UI text. |
| `src/app/(dashboard)/my-organization/_lib/my-organization-page-{content,profile,state}.tsx/.ts` | Loads saved organization before workspace gate; uses shared decision; read errors do not become empty defaults. Actual extensions: content `.tsx`, profile/state `.ts`. |
| `tests/acceptance/onboarding-{requirements,actions,review}.test.ts`, `onboarding.test.ts` | New/revised behavior coverage; inspect exact assertions. |
| `tests/acceptance/projects.json` | Two new acceptance registrations. Preserve all unrelated registrations. |

### 5.2 Review feature ownership

- `src/features/onboarding-review/**`: scaffolded feature, scenarios, controller, real-form composition, development guard and local launcher.
- `src/app/(public)/dev/onboarding-review/page.tsx`: composition-only route.
- Real form: `src/components/onboarding/onboarding-workspace-card.tsx` and `src/components/onboarding/onboarding-dialog/**`.
- Defaults: `src/lib/onboarding/defaults.ts`.
- Availability: `src/app/api/public/organizations/slug-available/route.ts` and `src/app/api/public/handles/availability/route.ts`.

The review has 14 scenarios: `legacy-paid`, `fresh`, `free-setup`, `organization-setup`, `operations-setup`, `missing-name`, `missing-url`, `missing-formation`, `complete`, `find`, `fund`, `support`, `invited`, `staff`.

The review feature uses real components and the completion decision, but submission writes only browser local storage. Checkout is simulated; complete/exempt screens do not navigate to an authenticated workspace. It does not prove Google/email callbacks, RLS, avatar uploads, server persistence, subscription activation or webhook idempotency.

Two simulator bugs already fixed:

1. `actions.ts` is a plain re-export; only the actual async server action file has `"use server"`. Adding that directive back to a re-export causes Next compilation failure.
2. Organization URL availability calls both a count query and public-handle RPC. The proxy now returns an empty organization count for its local HEAD lookup. Without it, Continue remains disabled even for a valid URL. Keep server validation intact; do not force-enable Continue.

Browser evidence already obtained: `testingcaleb` advances from organization to account after formation selection; legacy paid setup finishes, survives reload with sample documents/plan, and resets. Caleb said **“onbording reviews are seeming fine.”** Accept this as review evidence for the current simulator. Do not repeat a broad visual matrix.

### 5.3 Existing write and editor paths to trace

| Concern | Source |
| --- | --- |
| Setup profile merge/retry | `src/lib/onboarding/organization-profile-write.ts` → `src/lib/people/profile-write.ts` (`commitPeopleProfileMutation`, four bounded attempts) |
| Other organization mutation helper | `src/lib/organization/profile-mutation.ts` |
| Workspace profile save | `src/actions/organization.ts` → `updateOrganizationProfileAction` |
| Existing profile editor | `src/components/organization/org-profile-card/org-profile-card.tsx`, `header.tsx`, `hooks/use-org-profile-editor-state.ts`, `tabs/company-tab/**` |
| Profile field validation | `src/components/organization/org-profile-card/validation.ts`; find `validateOrganizationProfilePersistencePatch` for server validation |
| Workspace organization drawer routing | `src/app/(dashboard)/my-organization/_lib/my-organization-page-state.ts`, `my-organization-page-content.tsx`, workspace canvas overlay components |
| Membership and selected organization | `src/lib/organization/active-org.ts`, `src/lib/organization/active-org-cookie.ts` |
| Server request context/staff | `src/lib/auth/request-context.ts`, `src/lib/devtools/audience.ts` |
| Identity/handle preservation | `src/lib/onboarding/defaults.ts`, account-step/defaults hooks, `src/features/public-profiles/components/public-profile-identity-settings.tsx`, `public_handles` table |
| Billing tier/access | `src/lib/billing/plan-tier.ts`, `src/lib/accelerator/entitlements.ts`, checkout/webhook routes under `src/app/api/stripe/**` |

`updateOrganizationProfileAction` currently reads the latest profile, merges a validated patch, checks narrative revisions, and conditions the update on `updated_at`. Verify client payload behavior too: a whole stale form can still contain outdated values even when a server reads a fresh snapshot.

### 5.4 Known unresolved checks: do these before release

1. **Existing personal username:** defaults currently set `defaultPersonHandle: null`. Verify a returning owner can retain an already claimed username. The availability hook accepts an actual current handle, but a null default may prevent reuse. If reproduced, load the authenticated owner's existing handle through server authorization, pass it as the default/current handle, and retain uniqueness checks for everyone else. Add a targeted regression. Never auto-release or replace the handle.
2. **Missing/unknown build intent:** current shared gate recognizes exact `onboarding_intent_focus === "build"`. Audit whether affected owner accounts lack this metadata. Do not classify every auth user or subscriber as a builder; individual/member purchases exist. If a real affected account is missed, derive the smallest trustworthy owner/builder condition from existing product records, test member/staff/invited exclusions, and document it. Ask only if product policy remains ambiguous after inspection.
3. **Access-selected heuristic:** current mode treats any numeric `workspace_onboarding_stage` as access selected. Check actual legacy stage values and meanings. Add cases for zero/unexpected/stale values when present; avoid a pricing/setup loop or re-purchase.
4. **Read failures:** organization query failures must fail visibly/retryably, not be interpreted as a new empty organization. Verify no write follows an errored read.
5. **Workspace edits versus required setup:** formation and slug rules in profile editing may differ from initial onboarding. Test whether a valid edit can unintentionally erase a required field and repeatedly lock a paying owner out. Do not turn optional public visibility or EIN into new mandatory requirements.
6. **Active organization ownership:** verify owner/member/staff context changes cannot let the wrong organization be edited or cause a second organization to be created.
7. **Partial save/retry:** a profile or username write can precede another failing step. Retrying must preserve already saved work; completion must not falsely advance. Do not claim transaction-level atomicity unless implemented and proven.

## 6. Deliverables and evidence storage

Create these during execution, not as invented completed reports:

| Deliverable | Location and content |
| --- | --- |
| Audit summary | `docs/plans/2026-10-01-organization-onboarding-audit.md`: redacted findings, counts, source coverage, confirmed causes and unknowns |
| Private account inventory | `test-results/onboarding-audit/organizations.csv`: one row per org, restricted local file; verify ignored before writing |
| Private Karen timeline | `test-results/onboarding-audit/karen-timeline.json`: bounded, allowlisted metadata and evidence references, no document bodies or secrets |
| Workspace recovery verification | Audit summary section with exact observed route/control, actor/role, revision, before/after evidence and limitations |
| Test matrix results | `docs/plans/2026-10-01-onboarding-validation.md`: each case below, environment, revision, result and evidence location |
| Customer repair proposal | Redacted plan in docs plus private per-account manifest; no automatic execution |
| Release record | Candidate SHA, PR, current-head checks, required approval, production deployment SHA/status and canary results |
| Continuation | Updated row in `docs/agent/open-work-index.md` and appended current monthly runlog entry |

Before saving private results:

```sh
git check-ignore test-results/onboarding-audit/organizations.csv
mkdir -p test-results/onboarding-audit
chmod 700 test-results/onboarding-audit
```

If the first command does not confirm ignore coverage, do not write customer results there yet. Use an approved private location outside the repo and record only its purpose, not contents. Use restrictive permissions for created files. Never commit raw auth metadata, document content, tokens, connection strings, cookies, full webhook payloads or a full customer database export.

Inventory columns, in this order:

```text
audit_utc,project_environment,org_owner_id,owner_email,owner_display_name,
stored_name_state,stored_name,public_slug_present,formation_status,
intent_focus,onboarding_completed,workspace_stage,org_created_utc,
org_updated_utc,subscription_status,plan_tier,has_live_subscription_record,
member_count,coach_assignment_count,document_record_count,has_saved_narratives,
earliest_access_completion_utc,earliest_setup_completion_utc,
historical_name_evidence,history_coverage,primary_classification,
secondary_flags,recommended_action,evidence_refs,human_review_status
```

Counts must reconcile: total audited = sum of mutually exclusive primary classifications. Secondary flags may overlap. Do not join one-to-many event/subscription/member tables without pre-aggregation and then count duplicated organizations.

## 7. Phase A — establish the facts, read-only

### A1. Identify environment and schema

1. Reuse the configured, authenticated read-only database access available to the worker. Both `psql` and Supabase CLI were installed at handoff; no Supabase SQL connector was exposed in this turn. Do not assume a particular connector exists.
2. Confirm the intended Coach House production project using non-secret project identity/configuration. Do not print environment values or copy production environment files into the review worktree.
3. If database access is missing, record the exact unavailable capability; request access to the existing project/read-only SQL surface. Continue source/test planning. Do not create a replacement production project.
4. Run schema introspection before data queries. Match live columns against `src/lib/supabase/schema/tables/**`. If a column differs, adjust that SELECT explicitly and record the difference; never migrate production to make an audit query run.
5. Run reads in a read-only transaction with a bounded timeout when the interface supports it. Do not invoke RPC/functions that might write during an audit. Auth administration and invoice changes are outside this phase.

Do not use an application entitlement loader with `forceStripeSync` as a read-only database inspection shortcut: it may reconcile persisted billing state. Use SELECTs and provider read APIs for audit evidence. Likewise, first inspect an administrative page's load behavior before treating a browser visit as mutation-free.

Example schema discovery, to run through the authenticated SQL surface:

```sql
begin read only;
set local statement_timeout = '15s';
select table_schema, table_name, column_name, data_type
from information_schema.columns
where (table_schema = 'public' and table_name in (
  'organizations', 'profiles', 'subscriptions', 'user_journey_events',
  'user_activation_checkpoints', 'onboarding_responses', 'public_handles',
  'organization_memberships', 'organization_coach_assignments',
  'organization_document_files', 'organization_external_documents',
  'organization_project_overview_documents', 'stripe_webhook_events'
)) or (table_schema = 'auth' and table_name in ('users', 'audit_log_entries'))
order by table_schema, table_name, ordinal_position;
rollback;
```

### A2. Karen current state and preservation baseline

Use the fixed owner UUID only after confirming its association with the requested email. Project access may not allow `auth.users`; if denied, use the existing authorized admin identity view/tool, not an RLS change. Keep identity results private.

Read-only example; verify schema first:

```sql
begin read only;
set local statement_timeout = '15s';
select u.id, u.email, u.created_at as user_created_at,
       u.raw_user_meta_data->>'onboarding_completed' as completed,
       u.raw_user_meta_data->>'onboarding_intent_focus' as intent,
       u.raw_user_meta_data->>'workspace_onboarding_stage' as workspace_stage,
       o.created_at as org_created_at, o.updated_at as org_updated_at,
       jsonb_typeof(o.profile->'name') as name_type,
       o.profile->>'name' as saved_name, o.public_slug,
       o.profile->>'formationStatus' as formation_status,
       case when jsonb_typeof(o.profile->'org_people') = 'array'
            then jsonb_array_length(o.profile->'org_people') else 0 end as people_count,
       md5(o.profile::text) as profile_fingerprint
from auth.users u
left join public.organizations o on o.user_id = u.id
where u.id = 'ddf96a31-4bd3-4cf8-b46a-27f5750124ba'::uuid;

select id, status, created_at, updated_at, current_period_end,
       stripe_subscription_id, stripe_customer_id
from public.subscriptions
where user_id = 'ddf96a31-4bd3-4cf8-b46a-27f5750124ba'::uuid
order by created_at, id;
rollback;
```

Fingerprint is an equality aid, not a backup or proof of historical content. Read selected plan metadata using the keys in `resolvePricingPlanTier`; do not dump all metadata. Verify live/test mode from reliable saved/provider evidence; an ID prefix alone does not establish Stripe mode.

For preservation, capture counts/IDs/timestamps and private hashes of narratives, profile document references, `organization_document_files`, external document links, overview documents, memberships, coach assignments and subscription identifiers. Enumerate actual JSON paths used by the roadmap/narrative readers; do not assume `profile.documents` contains all work. Do not download document bodies. Record nonzero/empty state for Mission/Vision/Values, including legacy final-statement fields and canonical sections.

No writes to Karen follow from taking this baseline. A later comparison alone does not prove our code caused a change; record audit times and concurrent legitimate activity.

### A3. Karen historical-save investigation

Do all of the following and record source coverage, earliest/latest timestamp and whether old/new field values are retained:

1. Query `user_journey_events` for Karen's user or organization key. First obtain count/min/max. Then page chronologically, 500 rows maximum per page, with `(occurred_at, id)` cursor. Extract only needed metadata keys: `onboardingMode`, `builderPlanTier`, `hasOrganizationSetup`, and any explicitly named field-save indicators discovered from source. Do not print full metadata.
2. Query activation checkpoints for the same keys; distinguish access, setup and tutorial checkpoints. A checkpoint can be overwritten/current-state only: establish semantics from its writer.
3. Inspect relevant server actions and telemetry writers to determine whether an organization-name save emits an event at all. No event in an uninstrumented path is not evidence of no save.
4. Inspect live schema/trigger definitions for profile audit/history tables. Query only discovered, relevant history rows for this owner. `updated_at` and narrative revision counters are not name history.
5. Inspect the legacy `onboarding_responses` schema before using it. At handoff its migration defines confidence scores, notes and follow-up, not organization-name history. Presence of a response does not establish name completion; do not read freeform notes without a concrete need.
6. If relevant existing retained application logs include this user's failed/successful organization saves, inspect a bounded window around the recorded events. Never search or export unrelated users' request bodies. Distinguish request submitted, action returned success and database state confirmed.
7. Auth audit logs prove authentication changes, not arbitrary organization profile writes. Query them only for an identified journey/auth question; do not assume they record profile name changes.
8. Inspect availability/retention of existing snapshots/backups through read-only provider metadata only if the above is inconclusive. A restore/export would be a separate, costed and approved operation into an isolated destination. Never overwrite production to investigate history.
9. Stop expanding history once retained evidence has been exhausted. Mark `unknown_due_to_retention` rather than guessing or spending indefinitely.

Bounded initial event query:

```sql
select id, occurred_at, event_name, source, surface, plan_tier,
       metadata->>'onboardingMode' as onboarding_mode,
       metadata->>'builderPlanTier' as builder_plan_tier,
       metadata->>'hasOrganizationSetup' as has_organization_setup
from public.user_journey_events
where user_id = 'ddf96a31-4bd3-4cf8-b46a-27f5750124ba'::uuid
   or org_id = 'ddf96a31-4bd3-4cf8-b46a-27f5750124ba'::uuid
order by occurred_at, id
limit 500;
```

For subsequent pages parenthesize the user/org OR condition, then add `and (occurred_at, id) > (<last_timestamp>::timestamptz, <last_id>::uuid)` using bound values. Do not report exhaustive history until fetched rows equal the scoped count or retention limits are stated.

Choose a verdict using this table:

| Evidence | Permitted conclusion |
| --- | --- |
| Historical persisted name value for this exact org, later absent | Previously saved, later cleared/lost; identify change interval and writer if possible |
| Save request/input but no success or persisted-state proof | Save attempted; outcome unknown/failed only if error evidence exists |
| Explicit access-only completion, no setup event, no retained name history | Legacy setup bypass confirmed at that event; whether name was saved later remains unknown |
| Saved value exists under another field or different org | Mapping/selected-org issue; preserve both records, trace reader/writer before repair |
| Current basics absent with no sufficient historical evidence | Currently incomplete; cause unknown |

A4 cannot erase A3's uncertainty. A broad pattern is not proof for an individual account.

### A4. Inventory all unnamed/incomplete organizations

Start with three separate populations:

1. Missing, JSON-null, non-string, empty or whitespace-only `profile.name`.
2. Literal stored placeholder-like name `Organization` (case/whitespace normalized); flag for human review, do not assume invalid business name.
3. Named organizations missing slug or valid formation status, because the new gate may affect them too.

This query is an inventory, not the runtime completion predicate. Runtime policy must also account for owner/intent/staff/membership.

```sql
with fields as (
  select user_id, created_at, updated_at,
         case when jsonb_typeof(profile->'name') = 'string'
              then nullif(btrim(profile->>'name'), '') end as name,
         nullif(btrim(public_slug), '') as slug,
         profile->>'formationStatus' as formation
  from public.organizations
), classified as (
  select *, case when name is null then 'missing_or_invalid'
                 when lower(name) = 'organization' then 'literal_placeholder_candidate'
                 else 'named' end as name_state,
         coalesce(formation in ('pre_501c3','in_progress','approved'), false) as valid_formation
  from fields
)
select name_state, count(*) as organization_count,
       count(*) filter (where slug is null) as missing_slug,
       count(*) filter (where not valid_formation) as missing_formation
from classified
group by name_state
order by name_state;
```

For the private row export use the same CTE and select rows where `name_state <> 'named' or slug is null or not valid_formation`. Fetch in bounded pages ordered by owner UUID; record total count before export. Join pre-aggregated summaries for subscriptions, members, coaches, saved work and journey history. Include related existing real customers even if their metadata is missing or malformed.

Assign exactly one primary classification by this precedence:

1. `confirmed_prior_value_lost_or_misread` — persisted historical value or mapping defect proven.
2. `confirmed_legacy_access_only_completion` — explicit legacy event and current missing setup; keep later-save uncertainty in its own column.
3. `current_signup_incomplete` — evidence of a new unfinished setup without legacy-completion evidence.
4. `nonbuilder_or_invited_context` — supported by actual role/intent/context; do not infer from zero members.
5. `test_or_abandoned_confirmed` — explicit tester evidence or human classification, never just lack of billing.
6. `literal_name_requires_review` — literal “Organization” and no stronger classification.
7. `unknown_needs_review` — evidence insufficient.

Secondary flags: active paid, live/test billing evidence, saved narratives, document records, recent activity, coach assigned, stage/intent inconsistency, missing specific required fields, possible multiple organizations. A primary classification never authorizes deletion.

Prepare a private review packet for Caleb/Paula/Joel containing one row per ambiguous account, evidence and a concise question. Do not send it to them. Report exact totals and classification coverage to Caleb.

**Phase A exit:** Karen timeline/verdict with limitations; exact population counts; every candidate classified; private evidence stored safely; no customer mutation.

## 8. Phase B — prove Workspace recovery and finish prevention

### B1. Trace the existing user path

1. Follow current Workspace navigation into the organization/company editor. Start from `my-organization-page-state.ts`; candidate route `/workspace?drawer=organization&tab=company` must be confirmed by the actual router/UI before documenting it as supported.
2. Identify the exact existing title/name editing control, formation field, public URL control and save mechanism. Do not add a new control because the existing one is hard to find.
3. Trace actor → active organization → role → form defaults → client payload → `updateOrganizationProfileAction` → conditional database update → revalidation → subsequent reader.
4. Evaluate Karen's recorded role/context read-only. Do not impersonate her by changing credentials, auth metadata or cookies. Use an authorized coach/admin view only within its real permissions; label it as coach/admin evidence, not owner evidence.
5. Reproduce owner editing on a dedicated account with Karen-like state. Compare local candidate behavior with current production behavior without performing a production customer save.
6. Write the precise user instructions: starting route, control label, fields, save feedback, reload behavior. State whether setup recovery redirects her first or the existing editor is directly reachable.

### B2. Required behavior, implement only deviations

| Case | Required result |
| --- | --- |
| Fresh build account | Access/plan choice followed by required setup; no completion on plan selection alone |
| Legacy completed build owner missing basics | Existing setup, prefilling retained fields; no repeat checkout; completion only after persisted valid setup |
| Missing one field | Preserve other saved fields and identity; require the missing valid data |
| Fully configured completed owner | Normal Workspace without repeated onboarding |
| Legitimate member Find/Fund/Support | Existing member path; no forced new organization |
| Invited member | Existing organization's authorized access, no duplicate owner organization |
| Staff/coach | Preserve established staff/assigned-org behavior; do not grant new access |
| Profile read failed | Visible error/retry; never empty defaults followed by destructive write |
| Save failed/conflicted | Retain input, report error, no false completion; retry without lost concurrent work |
| Existing personal handle/current org slug | Reuse accepted; uniqueness enforced against other owners |
| Returning paid account | Same subscription/customer identifiers, correct entitlements, no new purchase |
| Workspace edits | Authorized fields persist; unrelated profile/documents/visibility/roles/billing preserved |

Work from the candidate described in section 5. Avoid another independent completion implementation. Keep profile mutation merges and compare-and-swap/retry semantics. Do not remove tests, broaden exemptions, bypass availability checks, weaken RLS or hide errors to achieve a green result.

If any proposed correction materially changes product policy (for example, forcing a previously optional field across a new user category), present the exact discovered case and proposed behavior to Caleb. Continue unrelated authorized work. Ordinary bug fixes within these stated invariants do not require another permission question.

### B3. Preservation proof on test data

Before a recovery save, seed a dedicated test fixture containing distinct Mission/Vision/Values values, legacy and canonical narrative representations, profile document references, one library document, an external document reference, at least one extra profile field, people/membership data and a paid subscription test record through approved test setup.

Capture before/after values or hashes. Permitted change list: submitted setup fields, intended owner-person fields, completion metadata, expected timestamps and normal onboarding progress. Assert all other seeded business values and billing identifiers unchanged. Test with a concurrent Mission edit between the onboarding snapshot read and attempted write. The retry must use the newer profile or return a conflict; it must never silently restore the old document.

Repeat for existing Workspace name/details editing. Do not assume the onboarding merge test covers the other action's payload/revision behavior.

**Phase B exit:** verified existing edit route, recovered fixture, scoped fixes for any reproduced gaps, regression assertions and no customer edits.

## 9. Phase C — local checks, then real dedicated-account testing

### C1. Reuse existing evidence

Recorded local results: 43/43 across six onboarding files; feature/scaffold contracts and changed-file lint passed; earlier routes/boundaries passed. Browser simulator completion/reload/reset passed. User review looked fine. These cover the previous candidate only; rerun checks whose covered behavior changes.

Focused baseline command:

```sh
pnpm exec vitest run --config vitest.projects.config.ts \
  tests/acceptance/onboarding-requirements.test.ts \
  tests/acceptance/onboarding-actions.test.ts \
  tests/acceptance/onboarding.test.ts \
  tests/acceptance/onboarding-review.test.ts \
  tests/acceptance/onboarding-defaults.test.ts \
  tests/acceptance/onboarding-state-helpers.test.ts
```

For changed persistence/routing/return logic, select the relevant existing files:

```sh
pnpm exec vitest run --config vitest.projects.config.ts \
  tests/acceptance/onboarding-pricing-return.test.ts \
  tests/acceptance/app-shell-onboarding-redirect.test.ts \
  tests/acceptance/organization-profile-persistence-validation.test.ts \
  tests/acceptance/organization-profile-read-safety.test.ts \
  tests/acceptance/organization-profile-mutation.test.ts \
  tests/acceptance/people-profile-write-concurrency.test.ts
```

Tests for carried fields, organization step, pricing step, Workspace onboarding, member workspace access and public profiles already exist; inspect and reuse them before adding files. Add only meaningful uncovered cases, especially current-handle recovery, lost-field reproduction, partial saves and concurrent documents. Keep cold module imports out of timed paid/free tests; preserve mock isolation and the free-access zero-entitlement-call invariant.

After new acceptance files, run `pnpm test:acceptance:manifest:update` and review `tests/acceptance/projects.json`. Run focused ESLint on changed paths, then applicable `check:features`, `check:feature-scaffold`, `check:routes`, `check:boundaries`. Do not run the complete local `check:quality` unless explicitly asked or diagnosing a specific hosted failure.

### C2. Set up actual provider test conditions

Before creating accounts, complete this non-secret environment sheet:

```text
candidate revision:
app URL and owning worktree:
Supabase project/environment identifier:
Stripe account/environment: test mode confirmed by:
webhook destination and signing configuration verified by:
email verification test inboxes:
Google test identity and registered redirect origins:
account invitation destinations (if any):
test account labels and organization IDs:
provider mutations approved in message/reference:
expected cost and external deliveries:
test duration, cleanup owner and cleanup action:
```

Do not mix a test Stripe account with the production database. Do not disable hCaptcha, consent, email verification, webhook signatures or RLS for convenience. Use the provider's approved testing support and an authorized environment. If the environment is unavailable, report the concrete missing inputs and leave this gate pending while finishing all local work.

Give Caleb direct URLs and account labels, with credentials delivered only through the approved secure mechanism. Do not put credentials in docs/chat/test output. Use unique accounts for fresh signup cases; do not repeatedly erase the same customer's history to create a fresh state.

### C3. Deferred manual/integration matrix

Historical future-test inventory only. Subsequent user instruction defers real signup/payment checks and extensive testing. See the validation document for the completed focused checks and specific remaining evidence limits; do not execute this matrix now.

Record result, account label, environment, revision, evidence and remaining limitation for every row. `PASS` requires the real mechanism named; local simulation cannot satisfy a provider row.

| ID | Starting condition and action | Required evidence |
| --- | --- | --- |
| T01 | Email fresh builder, Individual | Verify email → access → setup → real Workspace; saved basics and completion; no checkout/entitlement sync call for free access selection |
| T02 | Google fresh builder | Callback retains identity/intent/return route; same setup requirements; no duplicate user/org |
| T03 | Organization plan success | Stripe test checkout → webhook/return → setup → correct paid Workspace; one subscription |
| T04 | Operations Support success | Same as T03 with correct plan and entitlements |
| T05 | Checkout canceled/abandoned | Recoverable pricing/setup state; no false paid access or completion |
| T06 | Delayed webhook and repeated delivery | Return can recover after sync; idempotent processing of the same event ID; no duplicate billing/credits |
| T07 | Legacy paid completed owner missing all basics | Setup required, existing paid plan retained, docs preserved, no purchase screen |
| T08 | Owner missing name only, URL only, formation only | Each required field enforced; all retained data prefilled and preserved |
| T09 | Complete returning owner | No onboarding loop on login, direct Workspace or reload |
| T10 | Previously claimed personal username/current org URL | Own identity accepted unchanged; another owner's value rejected |
| T11 | Find/Fund/Support, separately | Member/account onboarding works without forced org setup |
| T12 | Invited editor/member/read-only roles | Correct existing org, correct permitted editing, no duplicate org creation |
| T13 | Platform staff/coach and assigned client | Existing staff exemptions and client scope retained; unauthorized client denied |
| T14 | Blank/invalid/reserved/taken fields and lookup failure | Clear errors, no premature submit/completion, input retained |
| T15 | Organization read failure/save failure/auth expiry | No empty overwrite; recoverable error; no false completion |
| T16 | Concurrent document edit during setup save | Latest narrative survives or explicit conflict; never silent loss |
| T17 | Workspace organization editor save/reload/new session | Name/details persist in correct org, card reflects saved name, no extra rename control |
| T18 | Second authorized viewer after save | Updated saved data visible after normal refresh; no requirement to add realtime collaboration |
| T19 | Direct route/back/reload/interrupted setup | No gate bypass, duplicate creation, lost plan or redirect loop |
| T20 | Normal Workspace save after completed onboarding | Cannot accidentally erase basics through untouched empty fields; optional fields and private visibility remain supported |
| T21 | Missing/legacy intent or stage seen in audit | Explicit supported policy; no silent missed customer or overbroad gate |
| T22 | Tampered request role/org/plan fields | Server authorization/entitlements remain authoritative; client fields cannot grant access |

User is primary appearance/interaction reviewer. Ask them to review only changed or unanswered flows; record their results. Use Playwright for a named unresolved question or required gate, not repeated comprehensive clicking. Browser cookies/session storage are origin-specific. Verify server environment before concluding auth code is broken.

**Phase C exit:** local checks pass; all required real test cases have evidence, or precisely named provider blockers remain. Do not call the candidate release-ready with pending provider cases.

## 10. Phase D — account recovery proposal, no automatic customer writes

For every audited candidate produce one disposition:

- Owner completes missing setup through existing flow.
- Restore a specifically proven historical field value, subject to review.
- Fix a display/selected-org mapping defect; no inferred data write.
- No repair required: valid member/staff/test/other explained context.
- Human review required: insufficient evidence or ambiguous organization identity.

For a proposed direct repair, provide exact org ID, field path, current value, proposed value, authoritative source, expected current revision, permitted changed fields, dry-run diff, preservation checks and rollback. Never use a whole-profile replace. Re-read immediately before any later approved execution; skip/report a row if its revision/value differs from the approved manifest. Make repair retry behavior idempotent.

If restoring a former name might overwrite a customer's intentional later change, require that ambiguity to be resolved first. Payment contact/business name alone is not permission to replace organization profile data.

Prepare customer instructions with the verified Workspace/setup route and what to enter. Do not send them without authorization. Caleb/Paula/Joel can classify “real” accounts using the prepared packet; do not conclude abandoned accounts should be deleted.

**Phase D exit:** all accounts have a reviewed proposal or explicit pending human decision; no silent fixes; repair execution is separately recorded if later authorized.

## 11. Phase E — isolate release, ship only after approval/gates

### E1. Preserve and isolate

The current source worktree mixes two domains. Never stage everything with `git add .` or push its complete dirty state without classification.

Onboarding release allowlist: the onboarding candidate files in 5.1; the review feature/route/tests if included in the release; any narrowly required existing editor/defaults/auth changes from Phase B; scoped docs and manifest changes. Exclude the UI group below until reviewed in Phase F.

Prefer a fresh release worktree from freshly fetched `origin/main`, following the repository's release protocol. Preserve the source worktree. Transfer only reviewed onboarding hunks and required untracked files; `git diff` does not include untracked files. Regenerate the acceptance manifest in the release tree rather than overwriting current main's manifest. Do not replay mixed recovery commits. If main contains newer fixes, adapt the candidate and rerun affected tests.

Before transfer/commit record explicit tracked and untracked inventories, inspect contents for secrets, and ensure any recovery copy includes untracked runtime files. Avoid archives of `.env`, `.next`, `node_modules`, private audit results or credentials. Do not remove the source worktree when the release branch exists; require proof that all remaining work is preserved.

### E2. Release evidence

1. Review diff against current main and confirm the scoped change explains the audited problem. No unrelated UI or billing modifications.
2. Run necessary focused local checks; run required pre-push/secret checks. Prepare a small PR using current repository title/template rules.
3. PR description: concrete old/new behavior; preserved data/paid access; user review evidence; local/provider results; migration or provider actions if any; no private customer inventory.
4. Require hosted `quality` for the exact current PR revision, required code-owner review and branch protection. Re-check the SHA, not merely a green older run.
5. Required gates include lint, snapshots, acceptance, RLS, structure/routes/features/scaffold/thresholds/boundaries, workspace storage/interaction/React Grab/surfaces/raw buttons and all other current workflow-required build/visual/performance/supply-chain checks. Use the current workflow contract as authoritative if its list changed.
6. Do not weaken a failing gate. An unrelated failure is a blocker to record; do not fix unrelated Calendar snapshots or update unrelated baselines here.
7. New visual references require user review of intentional changes first. Do not replace actual-app review with synthetic fixture screenshots.
8. Shipping is authorized by the latest instruction. Verify actual GitHub review/protection; do not ask for shipping permission again.
9. Merge through normal protected workflow only after approval and gates. Record merge SHA and actual production deployment status/URL. A merge is not deployment proof.

### E3. Production canary and monitoring

After approved deployment, verify the deployed revision and use the approved dedicated canary account for setup/edit/reload. Refresh Karen's relevant state read-only; do not fill it for her. Compare saved-work/billing evidence, allowing for documented concurrent customer activity.

Repeat the Phase A inventory query after deployment as a read-only operational check. Track incomplete owner/build accounts separately from member/invited/test contexts. Define an expected backlog of legacy accounts awaiting owner input; do not expect all pre-existing blanks to disappear without user action.

Provide a repeatable read-only query/runbook and manual cadence for detecting **new completed builder accounts with missing required basics**. Do not silently create a scheduler, alert channel or paid monitoring service. If evidence shows current telemetry cannot distinguish attempted versus successful setup, propose/add the smallest non-content success/failure telemetry within existing infrastructure, with no document bodies or secrets; obtain separate approval for provider provisioning.

Rollback plan: revert only the scoped application release if it causes a gate/redirect regression; preserve all newly saved customer data and subscriptions. Do not reset metadata or database contents as a code rollback. Any separate approved repair must have its own guarded rollback.

**Phase E exit:** approved scoped code deployed and canary verified; remaining customer recovery backlog explicitly tracked, not concealed as complete.

## 12. Phase F — original task/dialog and document-scroll reports

These changes are preserved and unreviewed. Earlier user pause still applies to further implementation until scope is explicitly resumed. Do not mix them into onboarding release merely because they are in the same worktree.

Owned candidate files:

```text
src/features/platform-admin-dashboard/upstream/components/QuickCreateModalLayout.tsx
src/features/platform-admin-dashboard/upstream/components/tasks/TaskQuickCreateModal.tsx
src/features/platform-admin-dashboard/upstream/components/projects/AddFileModal.tsx
src/features/platform-admin-dashboard/upstream/components/projects/CreateNoteModal.tsx
src/features/member-workspace/components/projects/organization-core-document-editor.tsx
src/features/member-workspace/components/projects/editor-interaction-preview.tsx
src/features/member-workspace/client.ts
src/app/(public)/visual-regression/project-feedback/page.tsx
tests/visual/editor-interactions.visual.spec.ts
```

Current approach: portal quick-create dialogs through shared Dialog, constrain long document editor scrolling. Existing title editing remains; rename feature has been removed.

After scope is resumed:

1. Read the exact diff; reproduce task opening when the underlying task list is already scrolled. Confirm the dialog initially appears within the viewport without scrolling the blurred background.
2. Verify task fields/popovers, save/reopen, close/Escape/focus and body scroll. Because the shared layout affects note/file surfaces, test their opening and primary action too.
3. Open a genuinely long Mission/Vision document. Wheel/trackpad and keyboard scrolling must work smoothly, controls stay reachable, content remains editable, and saved content is unchanged except intentional edits.
4. Confirm coach/customer saved-document behavior continues; realtime collaboration is not requested.
5. Use existing fixture `/visual-regression/project-feedback?scenario=editors` only as supplementary reproduction. Route guard is `x-coach-house-visual-regression: 1` in development or `VISUAL_REGRESSION_ROUTES=1`; do not make it public for convenience.
6. Existing test file is configured through `playwright.visual.config.ts`, not a default `playwright.config.ts`. Read its server/port requirements before running only that named file. Do not collide with 3000/3014/3015 or launch an unrelated app.
7. Present actual affected app routes to Caleb for review, then update affected visual baselines only for approved intentional changes. Ship separately with the same hosted/current-revision requirements.

**Phase F exit:** user-reviewed task placement and document scrolling with save/reopen evidence, approved scoped release and deployment verification; or clearly marked paused if not resumed.

## 13. Stop conditions and deterministic response

| Condition | Required response |
| --- | --- |
| Production project identity uncertain | Stop production queries; verify non-secret identity. Continue local source work. |
| History unavailable/expired | Record exact coverage and unknown verdict; do not fabricate history or initiate a restore. |
| More affected accounts or different cause discovered | Extend classification, count and targeted regression; do not silently widen customer mutations. |
| Owner identity/org selection mismatch | Resolve read-only before proposing any write. |
| Proposed fix would alter paid access or delete content | Stop that change; inspect preservation path and present a concrete alternative. |
| Existing handle cannot be reused | Treat as a release blocker for recovery; fix authenticated defaults/ownership handling, not uniqueness bypass. |
| Real provider test environment missing | Name missing settings/identities; complete local/audit work; leave provider evidence pending. |
| User review passed, no relevant code changed | Reuse it; do not ask for the same review or replay broad browser tests. |
| Test failure points to unrelated lane | Record blocker; do not broaden implementation or weaken gate. |
| Customer repair requested later | Recheck exact approved manifest/revision, execute only approved rows/fields, verify and log; no blanket operations. |
| Unclear policy for a specific account category | Present the observed category and one recommended bounded behavior; continue independent work. |
| New user correction/pause | Honor it immediately, preserve state, explain current work; do not revert unless asked. |

## 14. Reporting and final checklist

Keep commentary brief and meaningful at least every 60 seconds during active work. State findings, what is pending, and the next question a check resolves. Never tell Caleb a preview is ready until the actual route compiles and its first required interaction works.

At each phase completion update this checklist and append the current monthly runlog. Use `DONE`, `PENDING`, `BLOCKED(reason)`, or `PAUSED(user instruction)` plus evidence/date. Do not convert an unknown historical verdict into a blocked engineering task: an honest coverage-limited conclusion can complete the audit question.

| Item | Handoff state |
| --- | --- |
| Preserve source/root/servers; confirm inventories | DONE at handoff; recheck on executor startup |
| Local shared completion/formation candidate | IMPLEMENTED, not released |
| Local simulator build/availability/reload/reset | VERIFIED; user says reviews seem fine |
| Karen ever-saved history verdict | DONE: July bypass proven; later name-save history unknown with documented coverage limits |
| Exact unnamed/incomplete account inventory | DONE: 62 inspected; 20 unnamed; 22 missing basics; 18 builder recovery candidates |
| Existing Workspace owner edit/persist verification | DONE source/auth/merge contract and focused preservation checks; actual database reload/second viewer DEFERRED |
| Current handle/legacy intent/stage/read/save edge cases | DONE local: retained own handle, strict stage, shared name validation; unknown-intent accounts need human review |
| Dedicated-account authentication/payment/database tests | PAUSED(user instruction): defer real signup/payment tests; no extensive testing |
| Account-specific recovery manifest/human decisions | DONE private 22-row proposal; human dispositions PENDING; no direct writes proposed |
| Current-head hosted quality and required review | PENDING |
| Shipping approval/deployment/canary | Shipping AUTHORIZED after required gates; deployment and bounded read-only verification PENDING; real-account canary DEFERRED |
| Repeatable future incomplete-setup check | DONE: read-only docs/operations/onboarding/incomplete-builder-audit.sql |
| Original dialog/scroll candidates | QUEUED after onboarding production verification; resumption authorized; focused user review remains |

Final executor report must include: Karen's verdict and evidence limits; exact counts by classification; verified Workspace instructions; what changed; preservation proof; local versus real-provider versus hosted versus production results; remaining human decisions; PR/deployment references if any; and exact next action. Keep the user-facing report concise, with detailed evidence in linked artifacts.

Coaching credits are closed. Do not reopen that lane or repeat its completed activation/refund canaries. Other open lanes and historical preservation branches remain outside this task.
