# Roadmap Calendar (Board Calendar) — Task Brief
Status: In Progress
Owner: Caleb
Priority: P1
Target release: Sprint 1

---

## Purpose
- Replace the Roadmap Board Calendar text editor with a minimal, interactive shadcn-style calendar that supports recurring events.
- Keep governance timelines visible and actionable (board meetings, reporting, key dates) without leaving the roadmap.

## Current State
- Roadmap sections render a RichTextEditor via `RoadmapEditor`.
- Board Calendar is plain text and not structured; no recurrence, no assignments, no scheduling UX.

## Scope
In scope:
- New per-org calendar tables for **public** + **internal** events (separate tables/feeds).
- Minimal calendar UI for the Board Calendar roadmap section with a left preset panel, month grid, and event list.
- Event CRUD (create, edit, delete) with quick-add presets (Board meetings, reporting, key dates).
- Recurrence drawer with simple presets (weekly/monthly/quarterly/annual) + optional end date.
- Assignment to roles (admin/board/staff).
- Permissions: admins can manage; staff can manage only if granted via admin settings UI.
- RLS policies for read/write based on org membership + permission toggle.
- Org calendar subscription links (ICS feed) for both public + internal calendars.
- Notifications on event create/update/delete.

Out of scope:
- External calendar sync (Google/Outlook).
- Advanced RRULE editor (can be added later via drawer extension).

## UX Flow
- Entry points: Roadmap section "Calendar" in the Strategic Roadmap editor.
- Primary path: open section → see calendar + upcoming list → add event → optional repeat → save → event appears in list and calendar.
- Secondary paths: edit existing event, mark complete/cancel, delete.
- Empty / loading / error states:
  - Empty: show CTA to add first event + presets.
  - Loading: skeleton calendar + list.
  - Error: inline error + retry.

## UI Requirements
- Screens or components affected:
  - Roadmap editor section view for `board_calendar`.
  - New `RoadmapCalendar` component (shadcn calendar + list).
  - Admin permissions UI: add "Staff can manage calendar" toggle.
- Design patterns to follow:
  - Shadcn card/list styling, subtle borders, pill badges for status.
  - Drawer for recurrence settings to keep primary form minimal.
- Copy updates:
  - Section heading: "Board Calendar".
  - Empty state: "Add board meetings, reporting deadlines, and key dates."
  - Presets: quick-add list on the left of the calendar (Board meeting, Reporting deadline, Key milestone).

## Data & Architecture
- Tables / fields touched:
  - Separate event tables:
    - `roadmap_calendar_public_events`
    - `roadmap_calendar_internal_events`
  - Separate feed token tables:
    - `roadmap_calendar_public_feeds`
    - `roadmap_calendar_internal_feeds`
  - Shared event columns:
    - `id` uuid (pk)
    - `org_id` uuid (fk → organizations.user_id)
    - `title` text
    - `description` text (nullable)
    - `starts_at` timestamptz (UTC)
    - `ends_at` timestamptz (UTC, nullable)
    - `all_day` boolean
    - `recurrence` jsonb (frequency, interval, byDay, endDate, count)
    - `status` text (active/canceled)
    - `assigned_roles` text[] (admin/staff/board)
    - `created_at`, `updated_at`
  - `organization_access_settings`: add `staff_can_manage_calendar` boolean.
- RLS / permissions:
  - Public calendar read: anyone if org has public roadmap enabled; org members always.
  - Internal calendar read: org members only.
  - Write (both): owner/admin; staff only if `staff_can_manage_calendar = true`.
- Server actions / routes:
  - `listRoadmapEvents`, `createRoadmapEvent`, `updateRoadmapEvent`, `deleteRoadmapEvent`.
  - `getRoadmapCalendarFeedTokens`, `rotateRoadmapCalendarFeedToken`.
  - `/api/roadmap/calendar.ics?token=...&type=public|internal` (read-only feed).
- Caching / ISR / no-store:
  - Authed data via `no-store`; optimistic UI for event updates.
  - Store UTC; display in user locale/time zone.

## Integrations
- Supabase only (no OAuth calendar sync).
- ICS feed generation for external calendar subscriptions.

## Security & Privacy
- Events scoped to org via RLS.
- Validate date ranges and recurrence inputs server-side.
- No PII beyond event titles/descriptions.
- Feed access via unguessable token; allow rotation.

## Performance
- Avoid large calendar re-renders; virtualize long lists if needed.
- Debounce date navigation if doing server fetch per month.

## Accessibility
- Keyboard navigation in calendar grid.
- Proper labels for date picker, drawers, and actions.
- Respect prefers-reduced-motion for transitions.

## Analytics & Tracking
- Track event created/updated/deleted.
- Track feed token creation/rotation (admin only).

## Edge Cases
- Event spans multiple days.
- Timezone display vs UTC storage (display in user locale).
- Recurrence end date before start date.
- Feed token leaked → allow rotation and immediate invalidation.

## Migration / Backfill
- Create calendar event + feed tables + RLS policies.
- Add `staff_can_manage_calendar` to `organization_access_settings`.
- No backfill required (existing calendar text can be left as legacy or prompt users to add events).

## Acceptance Criteria
- Board Calendar section uses calendar UI (no RichTextEditor).
- Admins can create/update/delete events.
- Staff can manage only when permission toggle is enabled.
- Recurrence drawer saves and displays recurring events.
- Events are stored in new table and scoped by org.
- ICS feed link exists and can be subscribed to from external calendars.
- Notifications fire on create/update/delete.

## Test Plan
- Unit tests: recurrence serializer + validation.
- Integration tests: CRUD + RLS enforcement.
- RLS tests: member vs staff permission vs admin.
- Manual QA path: create event → edit → set recurrence → delete.
- Manual QA: subscribe to ICS feed, verify updates after change, rotate token invalidates old feed.

## Rollout Plan
- Feature flags: optional `roadmap_calendar_enabled` (if needed).
- Deploy steps: migration → UI → smoke test.
- Rollback plan: disable feature flag, keep table for future use.

## Dependencies
- Admin permissions UI location: `src/components/account-settings/sections/organization-access-manager.tsx`.
- Confirm assignment model (roles vs individual members).

## Open Questions
- Notifications go to org owner/admin (and staff when allowed) on create/update/delete.

## Moonshot
- External calendar sync + invites + RSVP tracking.
