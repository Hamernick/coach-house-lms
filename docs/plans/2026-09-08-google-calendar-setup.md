# Google Calendar setup and verification

Local branch: `feat/google-calendar-sync-20260908`.
Worktree: `/Users/calebhamernick/Development/coach-house-platform-google-calendar-20260908`.
Base: combined local development commit `be09d23a`.

## Activation checkpoint — September 9

- Continued the existing isolated branch after the user restarted the CLI. Browser
  control then exposed all three profiles, including `coachhousesolutions.org`.
  Verified the Cloud Console account is `joel@coachhousesolutions.org` and the
  selected project is `coach-house-496700`. The user supplied an app-side diagnosis
  of the old CLI helper running from an updater-displaced app; restarting restored
  access. This does not conclusively explain the earlier Joel-only discovery issue.
- Calendar migration `20260908160000_add_google_calendar_sync.sql` is applied to
  `vswzhuwjtgzrkxknrmxu`, with enabled/forced RLS and service-only access. The unrelated
  Documentation handle migration remains pending. See the September 8 runlog for
  the exact migration dry run and catalog verification evidence.
- Created a dedicated web OAuth client named **Coach House Calendar** in the existing
  Google project. Existing Drive and login clients were preserved. Registered:
  - `http://localhost:3012/api/integrations/google-calendar/callback`
  - `https://coachhouse.app/api/integrations/google-calendar/callback`
- Confirmed `calendar-json.googleapis.com` is already enabled. Saved Calendar list
  read access, event read access and app-created-calendar scopes, plus `openid` and
  email identity scopes. Preserved `drive.file`. Saved the permission justification;
  the Console confirmed **Data access changes saved!**
- Google's branding is verified. Audience remains External / In production, with
  2 of 100 unverified-user slots used at inspection. Calendar event read access is
  **not verified**; no verification request or demo video was submitted.
- All seven Calendar environment variables are present in Vercel `coachhouse`,
  Production. Client ID and client secret were added as Secret variables. The
  production flag remains `GOOGLE_CALENDAR_ENABLED=false`; no deployment occurred.
- Credentials and the original independent encryption key/cron secret are retained
  in ignored `.env.calendar.local`, mode 0600. Do not regenerate key version 1.
- Replaced only this worktree's `.env.development.local` symlink with a private mode
  0600 copy of its canonical contents plus Calendar settings and local enabled=true.
  The canonical target and `.env.local` symlink are unchanged. Normal local startup:
  `pnpm dev --port 3012`. `.env.calendar.local` remains a separate private backup.
  To undo the local environment copy, restore the former canonical symlink after
  preserving any subsequent worktree-only changes.
- Next's own environment loader passed checks for all settings, local enabled=true,
  callback, 32-byte encryption key and cron secret length. The started preview served
  authenticated Calendar connection requests with HTTP 200; an unauthenticated
  request returned 401. HTTP status alone does not verify consent or event sync.
- Local workspace rendering took 33–59 seconds. Chrome access was restored on
  September 9; Caleb's Bandto profile is the selected canary account. Google returned
  an incomplete grant, followed eleven seconds later by full Calendar permissions
  using the same state. The first callback had already consumed that state, so the
  corrected return failed. The callback now rejects an explicitly incomplete scope
  hint before consuming state, while still validating actual token scopes. The
  regression is covered locally; no successful live import exists yet.
- No Git commit/push, application deployment, scheduler or real Calendar connection
  was created. Current continuation: resolve the existing Caleb canary without
  repeatedly opening new consent requests, then complete Google verification and
  release. See the [verification submission draft](2026-09-09-google-calendar-verification.md).

## Product flow

Calendar panel → Connect Google Calendar → Google consent → Workspace Tools setup →
select personal calendars → optionally export this workspace's board events → Save and sync.

Workspace Tools has one switch: on starts setup if disconnected or resumes an existing
configuration; off pauses sync. The calendar panel's Manage Google Calendar entry opens
selections, Sync now, Reconnect and Disconnect. Both surfaces reflect the same server state. Personal calendar connections
are distinct from organization-wide tools. Google events display an Only you label.

## Remaining activation work

Calendar privacy disclosure is now implemented as legal version 2026-09-09.1. The
compatible consent migration 20260909150000 is applied and verified; older signup
clients remain supported and existing acceptance records are preserved. Public
deployment of the revised policy is still pending. The verification plan contains
the exact hashes, validation evidence and remaining submission steps.

1. Complete the real consent/sync check with caleb@bandto.com, selected by the user.
   The user already accepted Google's warning and objected to repeated new consent
   flows. Do not reopen another request as a generic retry. A fresh request opened
   before that correction remains at Google's warning. No Calendar connection or
   import exists yet. Keep board-event export off unless it is explicitly chosen.
2. Record the working consent and Calendar use flow, provide the demo video and
   submit the sensitive-scope verification request. Do not claim verification until
   Google approves the request.
3. Deploy the reviewed application through the repository release process and enable
   the Production Calendar flag only when the rollout is ready.
4. Configure an authenticated scheduler for `GET /api/integrations/google-calendar/cron`
   using `Authorization: Bearer <GOOGLE_CALENDAR_CRON_SECRET>`. Proposed pilot cadence
   is once per minute. Confirm hosting support and cost before creating a scheduler.
   Each invocation handles at most ten accounts for 45 seconds. No scheduler exists yet.

## Verification

Local review: `http://localhost:3012/workspace?drawer=tools`. Calendar is enabled
locally. `.env.local` links to the canonical file; `.env.development.local` is now a
private worktree copy containing Calendar credentials. The full quality gate passed
before shared review credentials were introduced. Run future fixture-writing QA
without either shared environment file; preserve all private credentials.

Local fixtures and API mocks do not call Google or the shared database.
An authenticated localhost app can use the same database as production; do not treat
connecting, pausing, exporting or disconnecting from localhost as isolated test actions.

Before a real canary, identify the test account, selected calendar, workspace, and exact
side effects. Export creates a separate Google calendar and copies authorized board events;
Google-native events are cached privately in Coach House. Do not use an existing shared
connection as disposable test data.

Canary:
- Connect with consent; deny export scope and confirm import-only setup still works.
- Select a calendar containing a timed event, recurring event and multi-day all-day event.
- Check personal visibility using another organization member.
- Enable export for an approved workspace; verify create/update/cancel and retry without duplicates.
- Pause; verify the scheduler stops and personal events disappear locally.
- Resume, revoke access in Google, and confirm reconnect handling.
- Disconnect locally; verify cache/token removal and unchanged Google events, Drive and login.
- Clean up only approved test artifacts. Deleting the dedicated test calendar in Google is
  a separate explicit action; disconnect does not delete it.

## Rollback

Set `GOOGLE_CALENDAR_ENABLED=false` and stop the scheduler. Connections become unavailable
and background jobs stop. Preserve encrypted rows for a recoverable rollback. Permanent
feature removal can drop the two new tables after approved retention/cleanup review.
Preserve older encryption keys until their connections have been rotated or disconnected.

## References

- [Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Incremental synchronization](https://developers.google.com/workspace/calendar/api/guides/sync)
- [Events list parameters](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)
- [Google project-wide token revocation](https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke)
