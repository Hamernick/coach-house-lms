# Checklist continuation — October 16, 2026

This is the current handoff for the long live-site/fiscal checklist chat. It supersedes older “current” paragraphs in the open-work index and fiscal plans; keep their history and evidence. Read AGENTS.md, this handoff, and the original Desktop WORKSTREAMS.md plus the relevant numbered packet before choosing work. Do not infer unfinished implementation from old checkboxes or historical draft PRs.

## Release state at closeout

- All runtime PRs291–329 are merged, including the shared fiscal project-page correction329 and review fix09b64d3b. Main is82a88202499e60655b5ec89ea844855defce3578. No runtime PR from this chat remains open; the closeout itself is documentation only.
- GitHub's Vercel–coachhouse status for that main SHA reports deployment completed at2026-10-15T23:20:22Z: https://vercel.com/calebs-projects-58ab1538/coachhouse/EJVesU7GUHJdDEQ8VxsPPsrekX8k . The separate Vercel–coach-house-platform status failed. Do not conflate those projects. Production domain assignment and application behavior were not freshly tested in this closeout.
- PR329 review correction: recoverable draft/workflow failure renders Application unavailable, denied access remains not-found, and main documentation conflicts are resolved.33focused tests, exact Next.js production type check3925input/10413total/zero warnings, lint/threshold/manifest and normal prepush passed. Earlier109project/isolation tests remain recorded; no full build claim.
- Prior hosted blockers remain evidence gaps: three acceptance failures already on base main, nine preexisting visual failures plus an undiagnosed mobile-shell failure, and /admin3101.6KB versus1000KB. Do not call CI green because the PR merged or Vercel deployed. No fresh CI polling was performed for this closeout.

## Checklist status — scope, not a completion count

| Work | Current disposition |
| --- | --- |
| Pricing/signup/checkout/onboarding and duplicate username handling | Implemented and merged294–296; user-tested fixes recorded. No pending implementation branch from this chat. |
| Donate header/footer | Implemented/merged294; existing new-tab destination and no-hover-menu intent preserved. |
| Public map duplicates, shared-address choices, missing pins and density | Code merged297/299/304/307. Reviewed production publication complete;491source evidence holds remain, plus the separate four-row05Ccoordinate correction hold. |
| Upgrade banners, including Documents spacing/copy | Implemented/merged298/300; preserve user appearance feedback. |
| EIN display/blue badge and Resources outer-container removal | Implemented/merged301–303; user accepted layout correction. No new outer wrapper. |
| Coach/admin co-editing, workspace support switching/search | Implemented/merged305/306 and subsequent311–315/319/320/322 fixes. Real two-user saving/live presence/history/support journey still needs a concise user acceptance result. |
| Coaching credit roster correction | Previously production-verified; do not repeat/reset grants. |
| Fiscal sponsorship | Core flow live enough for one real submission and receipt. NOT complete: staff email, admin Members filtering and remaining applicant/reviewer journey below. |
| Google Calendar | Remaining production/provider connection and sync validation. Earlier implementation/CI PRs257/268 are merged; do not rebuild from old draft237. |
| Formation prerequisite for verified status | Still pending. EIN badge implementation does not complete this broader verification rule. |

Original grouped scope is180requirements, not180unfinished tasks. These rows summarize the selected live-site work; they do not replace the original176requirement intake or other workstreams.

## Finish fiscal first

1. **FS staff email:** last metadata trace found an application_submitted job in fiscal_staff_email_outbox pending with0attempts. Applicant and Joel outbox jobs were marked sent. Karissa and Joel each had an initial in-app notification. Inspect current queue/configuration and cron authorization read-only before a fix; provider acceptance is not delivered/inbox proof. FISCAL_STAFF_EMAILS_ENABLED, sender readiness, and INTERNAL_CRON_SECRET precedence over CRON_SECRET are documented in the fiscal completion plan. Exact cause was not established. Last Vercel env API call403; browser access had worked earlier—recheck available access, do not assume no connector or that flags are disabled. Cron GETs send mail; do not invoke them as read-only checks or reset/resend uncertain jobs.
2. **Admin project Members filter:** the real private application/project exists. Reviewer links live in fiscal_project_reviewers; member_labels is empty, and the admin Members filter reads those labels. Fix the scoped reviewer-to-filter presentation without granting host membership, widening access or creating a duplicate project. PR329 only restores the existing project page; it does not solve this filter.
3. **User acceptance:** review the existing project page/Fiscal Sponsorship tab; fs/Joel review and request-corrections; applicant receives/corrects the same application; optional signup/Not now, selected-only profile import and later account return; emailed answer copy and original laptop access after phone verification; actual FS inbox and signed delivery events. Google signup remains unverified; any persistent origin error needs the matching Google client origin setting.
4. Close fiscal only after those outcomes are recorded. Then Google Calendar → formation verification. Keep491map source-evidence holds parked unless the user reprioritizes them.

## Applied database work — do not replay

Production migrations20261015040000/20261015041000 (linked applicant access),20261015200000 (required project option arrays), and20261015210000 (immutable receipt copy/browser-return grants) are applied and independently verified. The last migration repaired one original-browser grant; old delivered receipts were not resent. No new migration is needed for328/329. CAPTCHA was explicitly removed; do not restore it.

## Map data and evidence

Last verified publication receipt:4573eligible listings,4448marker locations,111shared-location chooser markers and2161NYC-area listings. All4904source IDs accounted:3740published+673aliases+491held. These are recorded verification counts, not a fresh live count. Read original05E and the private audit README/LATEST; never replay completed cohorts or promote evidence-held seasonal/registered-only locations without current service/location evidence. Four05Ccoordinate edits remain a separate unapplied hold. Map publication was a production data operation; it does not need another web deployment. Its results document is pushed on feat/map-place-coverage-20261014 at00e45e21, not necessarily merged into main.

## Resume safely

- Reuse /Users/calebhamernick/Development/coach-house-platform-fiscal-completion-20261015 after a fresh checkpoint, on a new scoped branch from current main. Preserve fix/fiscal-shared-project-page-20261015/09b64d3b as historical merged source; do not recreate its deleted remote branch.
- Localhost3127 was the actual UI; no listener was present at closeout. Start it from the correct checkout only if needed, using Node22 and existing private environment. Localhost uses production Supabase. No Supabase preview branch, synthetic production application or unsolicited visual-regression UI. User tests actual UI. Correct Chrome profile is Bandto/caleb@bandto.
- Private receipt/rollback evidence: ~/.local/share/coach-house/fiscal-completion/2026-10-15/. Deferred proxy-only test patch is stored there and is NOT a production fix; do not silently apply it. Private map receipts: ~/Desktop/Coach House Map Audit/2026-10-14-run05e/README.md and LATEST.json.
- Read-only inventory found124worktrees,10dirty worktrees and2stashes across the whole repository. Those include other chats; no files, branches, caches or servers were deleted/reset. Exact paths/statuses and local refs are saved in the private Desktop closeout folder. This is an inventory, NOT a backup of untracked/ignored source, secrets or private data. Commits absent from current remote refs may have been squash-merged; that count is NOT an unshipped-task count.
- Seven historical draft PRs remain open:229,231,235,237,238,239,240. Their supersession/relevance is unverified. Do not merge them wholesale; reconcile against current main when their workstream resumes.
- Shared SHIP revision40 owner/host blocker remains unresolved. Do not fabricate a new shared authority, clear it, or infer a fresh release claim from this handoff.
- Default delivery ends at a scoped open PR with focused tests and normal prepush. Caleb owns CI/review/merge/deployment and product testing. Read-only release inspection here was explicitly requested for closeout; it does not authorize future polling/deployments.
