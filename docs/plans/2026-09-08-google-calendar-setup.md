# Google Calendar setup and activation

Updated 2026-09-28. Use the [current release checklist](2026-09-28-google-calendar-release-readiness.md)
for implementation and validation status. Older verification submissions and recordings
are historical evidence, not instructions to repeat consent or provider setup.

## Product flow

Workspace Tools → Google Calendar switch → consent/setup → select up to five personal
calendars → optionally export the current workspace's board events → Save and sync.
Calendar settings are also available from the roadmap Calendar. Mobile opens Calendar
from the Menu sidebar; desktop keeps the header control.

Personal Google events are visible only to the connected user. Sync Off pauses work
and hides imported events while retaining settings and credentials. Disconnect removes
Calendar credentials/cache without deleting Google events or revoking Drive/login grants.
Optional export creates a separate app-owned Google calendar; it does not edit native
Google events or send invitations. Only currently authorized workspace events may export.

## Configuration

Required server-side variables:

- `GOOGLE_CALENDAR_ENABLED`
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEYS`
- `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_CURRENT_VERSION`
- `GOOGLE_CALENDAR_CRON_SECRET`

Use the existing dedicated Calendar OAuth client and encryption key version. Never
regenerate an existing encryption key as setup; saved connections depend on it.
Registered callbacks previously recorded:

- `http://localhost:3012/api/integrations/google-calendar/callback`
- `https://coachhouse.app/api/integrations/google-calendar/callback`

Scopes: `openid`, email identity, `calendar.events.readonly`,
`calendar.calendarlist.readonly`, and optional `calendar.app.created`. Calendar API
enablement and Google branding/data-access approval were previously recorded. Verify
current configuration without restarting completed approval work.

The Calendar and consent migrations are in main and were previously recorded as applied:
`20260908160000_add_google_calendar_sync.sql` and
`20260909150000_accept_calendar_privacy_consent.sql`. Inspect actual migration history
before changing the database; do not replay them blindly.

## Scheduled sync and activation

The scheduler calls `GET /api/integrations/google-calendar/cron` with
`Authorization: Bearer <GOOGLE_CALENDAR_CRON_SECRET>`. The secret must have at least
32 characters. Each invocation handles up to ten due accounts within 45 seconds;
successful accounts become due five minutes later. Actual freshness depends on scheduler
cadence and capacity. A cron route alone does not establish that a scheduler exists.

Read-only Vercel inspection on September 28 returned HTTP 403. Current Production
flag/variables, deployed configuration and scheduler have not been verified. Confirm
hosting support/cost and exact side effects before authorizing scheduler creation or
feature activation. Preview configuration does not establish Production configuration.

## Live canary

Agree the account, selected calendar, workspace, side effects and cleanup scope first.
Local authenticated previews can share the production database. Use mocks for routine
UI checks; never treat an existing real connection as disposable test data.

- Import timed, recurring and multi-day all-day events; verify another member cannot
  see them and private events do not enter shared/public feeds.
- Verify pause hides events and stops new work; resume and reconnect recover correctly.
- For optional export, verify create/update/cancel and retry without duplicates in an
  approved test destination, including stopping export when workspace access is lost.
- Verify disconnect removes credentials/cache without affecting native Google events,
  Drive or login. Do not revoke the shared Google project grant as a disconnect test.
- Clean up only approved artifacts. Deleting an exported Google calendar is separate
  from disconnect and needs explicit authorization.

## Rollback

Disable `GOOGLE_CALENDAR_ENABLED` and stop scheduled sync. Preserve encrypted connection
rows and all applicable key versions for recovery. No Google events are deleted by this
rollback. Production enablement/deployment and live verification remain separate gates.
