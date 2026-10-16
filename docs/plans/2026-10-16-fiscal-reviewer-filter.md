# Fiscal email diagnosis and reviewer filter

Original workstream03 stages5–6 / LIVE-07. Branch `fix/fiscal-reviewer-filter-20261016` reuses `coach-house-platform-fiscal-completion-20261015`, based on main `82a88202`. Open [PR331](https://github.com/Hamernick/CoachHouse/pull/331), implementation `c6f68d8a`, pushed. Historical handoff PR330 and other worktrees remain preserved. Caleb owns UI testing and release; delivery ends at an open PR.

## FS email: confirmed configuration blocker

Read-only October16 checks found Production `FISCAL_STAFF_EMAILS_ENABLED=false` in the authenticated Vercel `coachhouse` dashboard (added October12). Vercel logs show scheduled `/api/internal/cron/fiscal-notifications` calls returning503 at18:59:39Z and19:00:39Z on the current production deployment. The handler returns401 for denied cron authorization; these calls reached its dispatch/error path. `CRON_SECRET` exists in Production; no project-level `INTERNAL_CRON_SECRET` appeared in that search. Secret values were not revealed or changed.

The existing application's FS outbox job remains pending with0attempts and no provider ID/sent timestamp. Applicant and Joel jobs are each sent with1attempt. Provider acceptance is not signed delivery or inbox evidence. The false flag prevents claiming FS jobs, consistent with these observations; additional sender/provider issues cannot be excluded until activation.

**Caleb's release step:** in the existing `coachhouse` project, set Production `FISCAL_STAFF_EMAILS_ENABLED=true` after the sender/tracking prerequisites in the [completion checklist](2026-10-15-fiscal-sponsorship-completion.md), then deploy the intended revision. Let the normal scheduler process the existing pending job. Do not reset/resend it or manually invoke a cron as a read-only check. Verify the FS inbox and signed delivery events separately. No code change is needed to bypass the flag. No settings, jobs, production data, schema or email were changed here.

## Reviewer Members filter

The Projects directory previously mapped only `organization_projects.member_labels`; fiscal reviewer assignments live in `fiscal_project_reviewers`. Fiscal rows are now enriched after `list_fiscal_guest_projects` authorizes them for the server-verified actor. One batched read selects only project/user IDs, constrained to those projects and the already-loaded active staff options. Existing shared Members filters/counts use the resulting names. Guest labels reflect current assignments, replacing stale stored display labels; standard projects and Organizations keep their existing mapping.

No host memberships, role grants, writes, duplicate projects, new UI, migration or public disclosure. Table types describe the already-installed reviewer table. Database lookup failures propagate instead of silently treating assigned projects as unassigned. Fiscal project access, account proof and corrections policies are unchanged.

## Local evidence

- 68focused cases pass across directory/filter/canonical-project, fiscal workspace-isolation/shared-project and optional-profile suites.
- Two new regression cases fail against the original loader and pass with the correction; denied authorization performs no reviewer lookup.
- Changed-file ESLint, feature/import/threshold checks and acceptance-manifest synchronization pass. No full local quality/build or hosted CI claim.
- Exact installed Next.js production type check passes:3,927input/10,415total files; no warning messages returned. Structure and acceptance-manifest checks pass. Graphify refresh completed:21,387nodes/61,482edges. Outgoing commit secret scan and normal pre-push passed.

## User acceptance and continuation

1. In existing admin Projects, Members→Karissa and Members→Joel each retain the existing application project; unrelated/unassigned filters do not. Open its existing Fiscal Sponsorship tab.
2. FS/Joel request corrections; applicant receives and corrects the same application. Confirm notifications and mail without duplicating the original submission.
3. Verify optional signup/Not now, selected-only profile import, linked account return, emailed answer copy and original-laptop access after phone verification. Google signup remains unverified; a persistent origin error needs the matching Google client origin setting.
4. Record actual FS inbox receipt and signed delivery outcomes separately. Only then close fiscal and continue Google Calendar, then formation verification.
5. Preserve491map source-evidence holds and four05Ccoordinate edits; resume their original packets for evidence review, never replay publication or infer data approval.

Port3127 was idle and no server was started. No synthetic application, UI sweep, deployment, hosted polling, cleanup or SHIP state mutation. Shared revision40 ownership hold remains unchanged.
