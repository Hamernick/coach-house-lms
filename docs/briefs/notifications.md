# Notifications (System-wide inbox + event triggers)

Status: In Progress
Owner: Caleb
Priority: P0
Target release: ASAP (launch support)

---

## Purpose
- Replace the placeholder notifications popover with real, persistent notifications.
- Cover key platform events (accelerator progress, coaching bookings, roadmap/docs changes) with a single inbox/archive UX.
- Provide admin-only test tooling for QA in dev.

## Current State
- `src/components/notifications/notifications-menu.tsx` renders a polished UI but uses hardcoded sample arrays.
- No database table, RLS policy, or server action API for notifications.
- No event triggers tied to accelerator/coaching/roadmap flows.

## Scope
In scope:
- Supabase `notifications` table + RLS.
- Server actions for list + mutations (read/archive/unarchive/mark all read).
- Minimal event trigger helpers for:
  - Accelerator: module completion, assignment accepted/revise.
  - Coaching: meeting booked/canceled.
  - Roadmap/docs: roadmap entry updated/published, org document uploaded.
- Update the notifications popover to load real data and mutate state.
- Admin-only “seed test notifications” action (not visible to non-admins).
- RLS test coverage for the new table.

Out of scope:
- Full realtime subscriptions, push notifications, or email/SMS delivery.
- Global notification preferences UI.
- Complex org-wide announcement system.

## UX Flow
- Entry points:
  - Bell icon in the dashboard/accelerator header.
  - Admin-only seed action in the account menu (for QA).
- Primary user path:
  1. Open bell → see Inbox/Archive tabs and unread badge.
  2. Click an item → mark as read and optionally navigate.
  3. Archive items (per-item or “Archive all”) → move to Archive tab.
  4. Unarchive from Archive tab → returns to Inbox.
- Empty / loading / error states:
  - Loading: lightweight skeleton rows.
  - Empty: “Inbox is empty” / “Archive is empty”.
  - Error: inline message + toast.

## UI Requirements
- Keep existing shadcn/ui popover + tabs styling.
- Maintain unread dot on bell button.
- Ensure interactions are keyboard accessible (buttons/links, focus states).

## Data & Architecture
- New table: `public.notifications`
  - `id` (uuid), `user_id` (uuid), `org_id` (uuid, optional), `actor_id` (uuid, optional)
  - `type` (text enum), `title`, `description`, `href` (optional)
  - `metadata` (jsonb), `read_at`, `archived_at`, `created_at`, `updated_at`
- RLS:
  - Authenticated users can read/update/delete only their own notifications.
  - Admins can read/manage all notifications (via `public.is_admin()`).
- Server actions:
  - `listNotificationsAction()` returns inbox + archive arrays.
  - `markNotificationReadAction(id)`
  - `archiveNotificationAction(id)`
  - `unarchiveNotificationAction(id)`
  - `markAllReadAction()`
  - `archiveAllNotificationsAction()`
  - `seedTestNotificationsAction()` (admin-only; inserts a small set for the current user)
- Event trigger helper:
  - `notifyUsers({ type, title, description, href, orgId, actorId, userIds, metadata })`
  - Called by accelerator/coaching/roadmap server actions at the end of successful mutations.
- Caching:
  - No-store semantics (server actions + authed Supabase queries).

## Integrations
- Supabase only (no external services).

## Security & Privacy
- Notifications contain non-sensitive UI copy + optional internal routes.
- RLS enforced on the table; no cross-user reads for non-admins.
- Avoid storing full document contents in metadata.

## Performance
- List query limited (default cap, newest-first).
- UI keeps local optimistic state to avoid refetch loops.

## Accessibility
- Use buttons/links for rows; preserve Radix popover semantics.
- Provide aria-labels for per-item actions.

## Analytics & Tracking
- Track: notification_opened, notification_archived, notification_clicked (optional).

## Edge Cases
- User without notifications sees empty state.
- Deleted/unauthorized notification mutation shows error toast and refreshes.
- Multiple notifications generated for same event should not spam (consider dedupe via `type` + `metadata` in helper).

## Migration / Backfill
- None required; seed only in dev.

## Acceptance Criteria
- Opening the notifications popover shows real notifications stored in Supabase for the logged-in user.
- Unread count + “new” badge updates immediately after marking read.
- Archiving moves items to Archive and updates counts without refresh.
- Accelerator/coaching/roadmap actions generate notifications for the right users.
- Admin-only seed action creates a few notifications for QA; non-admins never see this control.
- `pnpm test:rls` includes coverage for notification table isolation.

## Test Plan
- RLS tests:
  - Member cannot read or update admin’s notifications.
  - Member can read/update their own (mark read, archive).
  - Admin session can read/update others.
- Integration tests:
  - Event trigger helper called on accelerator/coaching/roadmap actions.
- Manual QA:
  - Create seed notifications, open popover, click items, archive/unarchive, verify counts.

## Rollout Plan
- Feature flag: optional (if we want to gate event triggers).
- Deploy: ship migration + server actions + UI updates together.
- Rollback: hide bell badge + disable seed action if needed.

## Dependencies
- Supabase migration and RLS tests.

## Open Questions
- Should any notifications be org-scoped (shared across organization members) instead of user-scoped?
- Which roles should receive each event type (member only vs org admin + staff)?

## Moonshot
- Realtime updates via Supabase Realtime + optional email digests.
