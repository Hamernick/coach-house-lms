# Fiscal sponsorship completion

User selected fiscal sponsorship ahead of Calendar and formation verification. Source: original Desktop workstream03, stages3–6, and LIVE-07. Preserve completed credits, public UI, maps and other worktrees.

## Latest implementation — October15

Stage2 gap confirmed and implemented: existing profile claims alone did not grant durable application access. A compact recent-applications list now appears for linked applicants inside the existing workspace Fiscal Sponsorship card and on the public fiscal page. It is absent for guests/unlinked accounts. Existing status/correction routes accept either their original verified guest capability or the claimed, confirmed matching account. Profile reopen works after guest expiry without recopying answers. Internal host membership, review ownership and paid/public state remain unchanged.

Two exact compatible migrations20261015040000/20261015041000 were transactionally preflighted with rollback, then applied/recorded and independently verified. They add authenticated own-claim-only list/read/resubmit RPCs and a partial owner/recent index. No new raw-table grants; anonymous/base-function denial and RLS preserved. No applications, accounts, email jobs or real emails created. Private before/apply/verification/rollback receipts: ~/.local/share/coach-house/fiscal-completion/2026-10-15/.

184focused cases across16files pass, plus the connected real-handler/ephemeral SQL/RLS journey. The required default fiscal RLS command now also runs the existing guest/connected harness, covering these grants in CI instead of silently skipping them. SQL tests deny another account with the same email, host staff, unknown references, unconfirmed/changed email and revoked claims; expired guest proof, owner corrections and retry deduplication pass. User UI/email/Google/production testing remains pending.

PR310 remains the existing release unit. At prior head5e990f6b, hosted build compiled/types passed but failed the existing /admin bundle1003KB versus1000KB; static/acceptance/RLS passed, visual/review remain distinct. Do not weaken the budget or change unrelated admin UI. New-head hosted gates remain required. Vercel saved credentials403/no connected browser still block activation. App flags/sending/provider webhook settings are unchanged.

## Lane and boundaries

- Branch `feat/fiscal-sponsorship-completion-20261015`, current-main base `84d9d09b`; isolated `coach-house-platform-fiscal-completion-20261015` checkout.
- Actual app: <http://localhost:3127/documentation/fiscal-sponsorship>. Listener PID94080/cwd verified; recheck before process actions.
- Existing feature owns implementation. No duplicate form, redesign, visual fixture or new feature scaffold.
- Localhost uses production Supabase. User owns interactive testing and controlled submission. No application/account/email/schema/provider mutation performed during audit.
- Ignored mode0600 task-local config enables intake/submission/profile; local sending/tracking remain off. Shared env files unchanged. Local signing secrets differ from production; production verification links cannot establish localhost proof sessions.
- Stop after scoped PR/review and production activation/controlled verification, or an explicit access blocker. Calendar, formation and remaining map evidence stay separate.

## Reconciled implementation

| Area | Implemented | Remaining |
| --- | --- | --- |
| Guest application | Drafts, validation, CAPTCHA, rate limits, transactional/idempotent submission | Real CAPTCHA/submission review |
| Internal management | Private host project, Fiscal/Overview, fs/Joel assignments, initial in-app notifications, reviewer-only access | User production review/canary |
| Email | Applicant receipt, Joel application alert, fs milestone queue; durable retries/leases/keys | Production activation/delivery |
| Follow-up | Explicit email proof, status, needs-info corrections/resubmission, recovery | Real reviewer/applicant loop |
| Optional profile | Matching confirmed account plus verified application; selected-only private import/retries | Route repair release; user auth/import test |
| Tracking | Signed callbacks and staff delivery status | Provider webhook/secret and signed live event |

Read-only production inspection found the checked fiscal migration chain, including optional-profile migration20261010180000, already recorded. Do not reapply from stale checkboxes. One host setting and both designated reviewers exist; zero guest submissions and zero guest/staff email jobs. Production fiscal page returns200 with submissions-disabled preview copy. Current Vercel config values could not be reread: cached CLI token returns403 and no browser is connected.

## Scoped repair and checks

Optional profile opening used removed route `/organization/profile`. Server response and client navigation now share the canonical route helper for `/workspace?drawer=organization`. Explicit open still requires an already-linked application and selects only the verified owner's organization. Reads never switch workspaces. No onboarding-completed/public/billing/membership state is changed.

Regression failed on the old destination before repair.132focused fiscal cases across11files pass; the ephemeral PostgreSQL guest/RLS suite plus connected real-handler journey pass. External Captcha/Auth/email are simulated there; no production writes or mail. Changed-file ESLint, features/boundaries/routes and diff hygiene pass. Hosted quality, independent review and user UI remain separate.

## Execution plan — requested October15

This increment is planning only. Resume the existing fiscal lane/PR310; do not start another workstream, enable flags, create applications or send emails while writing this plan.

### 1. Finish the release candidate — Codex

Reconcile current PR310 review/quality results and fix scoped defects. Audit guest submission → application-email verification → optional signup/login → selected-field save → organization drawer against merged onboarding. Preserve existing free/paid access and unfinished onboarding; importing must not mark onboarding complete. Caleb reviews the actual app and merges after current-head quality, code-owner and branch-protection gates pass. Accept user-reported merges without redundant checks.

### 2. Complete account saving and later return — Codex; Caleb tests

- Keep applying account/payment-free and "Not now" available. Skipping signup must preserve the application and email-based status/corrections.
- Cover new email signup/confirmation, Google signup/login and existing accounts. Preserve the application reference through every auth return; confirm accounts are not duplicated by onboarding/import races.
- Link only a matching confirmed account with verified application identity. Wrong email, expired proof, another browser and an already-linked application need clear denial/recovery without revealing answers.
- Copy only explicitly selected name, description, email and phone. Preserve unselected existing data; support link-only and already-public profiles. Budget, mailing/legal answers, review notes and attachments stay private. Internal review project ownership, paid access and public visibility do not change.
- **Audit later account access:** storing a claim does not establish that users can find their application after leaving. Confirm the signed-in applicant can return to linked private status/corrections without depending indefinitely on the original seven-day guest cookie. If absent, implement the smallest account-authorized entry/return path using existing surfaces and isolation tests; never add applicant membership to the staff host organization.
- Cover uncertain-save retries, concurrent edits, cross-tab confirmation and local/production callback origins. Local and production verification secrets are distinct.

Exit: Caleb can skip signup or create/sign into the matching account, choose data to save, open the correct organization and later return to the same private application; no duplicate org, unintended overwrite or publication. Later account entry is an audit requirement, not a currently verified feature.

### 3. Activate production — Codex after access/release gates

Restore existing Vercel access: current saved credential403/no connected browser is the blocker. Re-read config, deployment, migrations, stable secrets, real CAPTCHA, Resend sender and scheduler authentication. Follow the activation sequence below. Optional import waits for stage2 and the released route repair; tracking waits for a verified signed webhook. No Supabase preview branch.

Exit: intended deployment Ready; real public form/CAPTCHA available; retention and authorized mail workers configured. Enabled flags alone do not prove the journey works.

### 4. Controlled application — Caleb operates UI/inbox; Codex verifies records

| Check | Required result |
| --- | --- |
| Guest application | Draft resumes; submission creates one private application/project without account/payment |
| Internal management | Fiscal/Overview populated, fs/Joel assigned, two initial in-app notifications |
| Email | Applicant receipt/verification link, fs milestone email and Joel application alert |
| Retry | No duplicate project or message after submission/worker retries |
| Correction | Reviewer requests information; applicant corrects the same application; staff notified |
| Optional account | Email/Google new/existing-account return, skip, selected-only save and later private access pass stage2 |
| Isolation | Other applicants, unassigned staff and forged references/orgs cannot access the application |
| Delivery | Signed callbacks stored once; staff status accurate; provider acceptance and inbox receipt distinguished |

Caleb submits one controlled real application and reports UI/inbox results. Codex verifies only necessary records, with references/provider IDs kept private. No fake production application, agent email test or broad browser sweep. Do not infer delivery from green tests or enabled flags.

### 5. Close this run — Codex

Record release, deployment, config, application/retry/correction/account and delivery evidence separately in the original03 packet and repo log/index. Fiscal is complete only when the real application → internal review → notifications/email → optional account save/return journey passes. Preserve receipts/rollback, explicit deferrals and the independent SHIP owner-host blocker. Calendar, formation and map evidence holds remain separate.

## Activation sequence

1. Restore authenticated access to the existing Coach House Vercel project. User was asked to reconnect Bandto Chrome or refresh CLI authentication. Do not print or replace existing signing secrets.
2. Re-read Production config/deployment and prerequisites: real hCaptcha pair, Supabase service credentials, stable risk/link secrets, HTTPS canonical origin, Resend sender/API credentials, scheduler bearer matching cron authorization. Existing minute mail/daily retention schedules are in `vercel.json`.
3. After required release gates, enable Production `FISCAL_GUEST_INTAKE_ENABLED`, `FISCAL_GUEST_SUBMISSION_UI_ENABLED`, `FISCAL_GUEST_EMAILS_ENABLED`, `FISCAL_STAFF_EMAILS_ENABLED`; retain `FISCAL_GUEST_RETENTION_ENABLED=true`. Redeploy verified revision. Preserve unrelated settings. Optional profile activation must follow its route repair/review.
4. User submits one controlled application. Keep its private reference outside Git. Verify one private project/application, Fiscal/Overview values, both reviewers, two initial in-app notifications, applicant receipt, Joel alert and fs milestone email. Submission/worker retries must not duplicate project/messages.
5. User requests information as reviewer, follows applicant verification, submits corrections, confirms same application returns for review. Verify other applicants/unassigned accounts cannot access it.
6. Verify Resend webhook secret/subscribed fiscal events before enabling `FISCAL_EMAIL_TRACKING_ENABLED=true`. Record message IDs/signed events privately. Provider acceptance, recipient-server delivery and inbox observation are separate evidence.
7. Enable `FISCAL_GUEST_PROFILE_IMPORT_ENABLED=true` only after route release/review and matching-account auth/selected-field checks. Submission remains account/payment-free; private answers are not automatically copied or published.

Rollback intake incidents by pausing relevant intake/UI/sending flags and redeploying. Keep retention and verified tracking active; preserve records, receipts, secrets and uncertain provider IDs. Never reset/replay uncertain mail blindly.

Production is not activated/functionally verified. No new migration is needed for this route fix. SHIP revision40 owner-host blocker remains; canonical claim was not forced/rewritten. Current-head quality/code-owner/protection remain mandatory. Private packets/ignored config are not GitHub backups.


## Provider/review checkpoint — October15

PR310 runtime headdd07d240 is pushed/remote verified and non-draft. Hosted static/acceptance/RLS passed; build compilation and TypeScript passed, then the unchanged /admin1003KB versus1000KB budget failed. No weakening or unrelated admin change. Visual/independent review and final aggregate quality are not asserted.184local focused cases and required default fiscal RLS/connected suite remain valid. Local full tsc reports unchanged-file diagnostics, no changed-file diagnostic; not a local typecheck pass.

Read-only Auth config revealed port3127 was missing from redirects. Added only http://localhost:3127/auth/callback and its query-preserving http://localhost:3127/auth/callback** pattern, then independently verified the preserved production Site URL, existing entries and CAPTCHA setting. This allows fiscal email-confirmation returns to the actual localhost; real Google-origin/provider interaction and email delivery remain user checks. Private auth-callback before/verified receipts share the existing private fiscal receipt folder. See Supabase redirect guidance: https://supabase.com/docs/guides/auth/redirect-urls . Retire only these two temporary local entries when this lane's testing/listener is closed; preserve concurrent and production URLs.

No Vercel flags, sending or webhook config changed; access still403/no browser. No real application/account/email created. Actual3127returns200, own listener94080. Next action remains restored Vercel access plus required quality/review, then Caleb's controlled production application/email/account/correction verification.
