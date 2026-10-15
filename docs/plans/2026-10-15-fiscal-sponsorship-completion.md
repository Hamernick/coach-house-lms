# Fiscal sponsorship completion

User selected fiscal sponsorship ahead of Calendar and formation verification. Source: original Desktop workstream03, stages3–6, and LIVE-07. Preserve completed credits, public UI, maps and other worktrees.

## Lane and boundaries

- Branch `feat/fiscal-sponsorship-completion-20261015`, current-main base `84d9d09b`; isolated `coach-house-platform-fiscal-completion-20261015` checkout.
- Actual app: <http://localhost:3127/documentation/fiscal-sponsorship>. Listener PID75397/cwd verified; recheck before process actions.
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
