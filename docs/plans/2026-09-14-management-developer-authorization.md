# Current developer authority for AI and management APIs

## Prepared patch

Branch: `fix/management-developer-authorization-20260914`.
Worktree: `/Users/calebhamernick/Development/coach-house-platform-ai-auth-fix-20260914`.
Original base: main `cb9287b1`. Prepared independently from the Profile stack.

Legacy `profiles.role=admin` previously granted management-token access even
when the current staff record said coach or had been removed. The shared
`requireSupabaseManagementAccess` guard now reads the authenticated user's
`platform_staff_members.access_level` and requires exact `developer`.
Missing/invalid rows return 403; returned or rejected lookup errors return 500.
Authentication, configuration, project restrictions and success responses remain.
No legacy fallback, admin client, migration or provider configuration is needed.
Existing RLS grants authenticated users read access to their own staff row.

Both direct callers use the guard before provider calls: AI generation and all
six management proxy methods. Current developers remain allowed even when the
legacy profile role is member. Authority is rechecked after reassignment/removal.

## Validation

- Before patch: new route tests had **63 failures, 24 passes** (87 total).
- After patch: **95/95** passed across authorization, management configuration,
  and existing platform-access tests. Tests stub all external providers and use
  dummy credentials only. No real account or database mutation/model call.
- Tested coach reassignment, staff removal, members, anonymous requests,
  authentication errors, missing staff table, permission errors, rejected reads,
  malformed access levels, legitimate developer responses, and project/token checks.
- Targeted ESLint and diff whitespace check pass.
- Independent boundary investigator and one independent candidate reviewer
  completed the security-fix skill's required reviews. Reviewer reported no
  concrete authorization bypass or regression and independently passed 87 tests.

The focused patch is prepared and locally verified, not production-verified.
Full hosted quality remains pending under the user's no-heavy-local-checks rule.
No Graphify refresh, full build/suite, new Next server, production release,
provider setting change or migration push was performed.

## Deliberately separate remaining boundaries

Proxy path normalization/project-target consistency and server-enforced SQL
read-only execution require separate review. The browser still automatically
submits generated SQL; this patch does not harden that execution model. Affected
production accounts and management-token privileges remain unverified. This
source finding is not evidence of production compromise.

## September 16 preservation checkpoint

The user authorized saving the prepared fix as a focused reviewable change.
All 95 focused tests pass again (93 authorization/platform checks and 2 existing
configuration checks), along with scoped lint, acceptance-manifest and whitespace
checks. Current main still contains the same legacy guard this patch replaces.
Publish a separate draft PR for hosted validation; keep production release held.
No account reassignment, database mutation, provider request or model call was
used for validation. Earlier local session notes remain preserved separately.
