# Documents and Calendar integration

## Local review scope

Integration branch: `chore/documents-calendar-integration-20260909`, based on
`bb262360` (the completed Documents hardening checkpoint).

Calendar source: a recoverable snapshot of the uncommitted
`feat/google-calendar-sync-20260908` worktree at `be09d23a`, taken September 9 at
the start of this integration. Its 90 changed/new files include the September 9
privacy disclosure, compatible consent migration, and verification recording kit.
The active Calendar worktree and its private environment files are preserved.

The combined code retains document imports, theme-aware paste, scoped draft
recovery and serialized saves, and adds private Calendar display and controls in
Workspace Tools. Drive and Calendar disconnect clear only their own credentials.

Five overlaps were reviewed:

- Runlog: preserve both complete appended histories.
- Drive README: retain setup instructions and the shared-grant disconnect contract.
- Drive service: keep the already-tested Documents implementation, which includes
  Calendar's feature-only disconnect behavior.
- Acceptance manifest: merge the Calendar entries with the Documents additions.
- Documentation browser test: keep the newer focus/shortcut helper.

## Validation

The complete `pnpm check:quality` gate passed all 21 stages in 1,097.66 seconds:
2,530 acceptance tests (one expected skip), 155 browser tests, eight temporary
PostgreSQL suites including Calendar isolation and compatible legal-consent
checks, snapshots, lint/static checks, production build and performance budgets.
Browser fixtures used port 3023 and one worker, without retries. QA had no provider
credentials; shared Supabase fixture writers were skipped. No real Google data or
shared database records were created by this run.

The original localhost:3000 Documents route still returned HTTP 200 in 0.366
seconds. The integration remains staged in its isolated checkout; it has not been
applied to that server or committed. The recoverable binary patch applies cleanly
to the original root at `bb262360`. Its monthly handoff entry is the only tracked
root change from this session.

Evidence: `test-results/documents-calendar-integration-20260909/` in the canonical
root, including source hashes, the original Calendar snapshot, the review patch,
redacted access checks and complete quality results. The isolated code graph was
refreshed to 19,501 nodes, 55,935 edges and 1,045 communities without API calls.

The Calendar screenshot changes are inherited from its reviewed implementation:
the Calendar Tools row and compact connection/settings dialogs at 390/1440px in
light/dark mode. This integration does not intentionally change those baselines.
Scoped recording-asset Git attributes preserve the supplied ICS file's existing
CRLF bytes and prevent false whitespace warnings; no sample events were uploaded.

## Drive and live verification blockers

- A presence-only scan of seven distinct environment files across local worktrees
  found none of the eight required Drive settings. Shell settings are also absent.
- The existing Vercel link points to `coachhouse`. Read-only requests using the
  saved CLI login returned HTTP 403, including the account endpoint. No current
  provider settings or credential values were retrieved or changed.
- The supported browser runtime connected, but discovery returned no browsers.
  No account login, consent flow, or real-document canary ran.

Restore the existing Drive configuration from its authorized secure source,
retaining the compatible encryption-key map. Only the local callback changes to
`http://localhost:3000/api/integrations/google-drive/callback`; preserve production
provider settings. The exact localhost origin/referrer permissions still need
verification through the authorized Google Console.

Once configuration and browser access are available, identify a disposable target
organization/document before import/edit/save writes to the shared database. Test
Drive selection, preview, append/replace, save, reload, formatted/plain paste and
light/dark display. Existing source Drive files must remain unchanged.

The separate Calendar canary remains with `caleb@bandto.com`, export off. Its
latest recorded consent request expired; do not repeatedly reopen consent. Use
the Calendar verification plan for its account, scopes and pending Google review.

## Release boundary

Remote `main` was verified read-only at `67501039` on September 9. This integration
base is 135 local commits ahead of it. Draft PR #229 still reports conflicts and
PR #231 is stacked on that development consolidation branch. This integration
branch is a local combined review checkout, not a scoped production PR.

Before proposing a push or deployment, reconcile the consolidation release base,
select the intended release changes, and attach the combined validation evidence.
The new Calendar privacy policy is not publicly deployed. Calendar's existing
setup log records its two applied migrations; do not reapply them or run a broad
database push that would include the unrelated Documentation migration.

Calendar activation, a scheduler, Google verification submission, video upload,
push and deployment remain separate actions. No new provider or database changes
are required merely to review this local integration.
