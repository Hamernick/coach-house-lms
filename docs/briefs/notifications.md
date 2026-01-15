# Notifications (Popover + Inbox/Archive)

Status: In Progress
Owner: Caleb
Priority: P0
Target release: ASAP (launch support)

---

## Purpose

- Replace the placeholder notifications popover with real, persistent notifications.
- Support basic workflows: unread count, mark read, archive/unarchive, archive all.
- Provide admin-only test tooling to generate realistic notifications in dev.

## Current State

- `src/components/notifications/notifications-menu.tsx` renders a polished UI but uses hardcoded sample arrays.
- There is no database table, RLS policy, or server action API for notifications.

## Scope

In scope:

- Supabase `notifications` table + RLS.
- Server actions for list + mutations (read/archive).
- Update the notifications popover to load real data and mutate state.
- Admin-only “seed test notifications” action (not visible to non-admins).
- RLS test coverage for the new table.

Out of scope:

- Full product-wide eventing (automatic notifications for every workflow).
- Realtime subscriptions / push notifications.
- Email/SMS notification delivery.

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
  - `id` (uuid), `user_id` (uuid), `title`, `description`, `href` (optional), `tone` (optional), `read_at`, `archived_at`, `created_at`, `updated_at`.
- RLS:
  - Authenticated users can read/update/delete only their own notifications.
  - Admins can read/manage all notifications (via `public.is_admin()`).
- Server actions:
  - `listNotificationsAction()` returns inbox + archive arrays.
  - `markNotificationReadAction(id)`
  - `archiveNotificationAction(id)`
  - `unarchiveNotificationAction(id)`
  - `archiveAllNotificationsAction()`
  - `seedTestNotificationsAction()` (admin-only; inserts a small set for the current user)
- Caching:
  - No-store semantics (server actions + authed Supabase queries).

## Security & Privacy

- Notifications only contain non-sensitive UI copy + optional internal routes.
- RLS enforced on the table; no cross-user reads for non-admins.

## Performance

- List query limited (default cap, newest-first).
- UI keeps local state to avoid refetch loops.

## Accessibility

- Use buttons/links for rows; preserve Radix popover semantics.
- Provide aria-labels for per-item actions.

## Edge Cases

- A user without notifications should see a friendly empty state.
- A deleted/unauthorized notification mutation should show an error toast and refresh.

## Migration / Backfill

- No backfill required.

## Acceptance Criteria

- Opening the notifications popover shows real notifications stored in Supabase for the logged-in user.
- Unread count + “new” badge updates immediately after marking read.
- Archiving moves items to Archive and updates counts without refresh.
- Admin-only seed action creates a few notifications for QA; non-admins never see this control.
- `pnpm test:rls` includes coverage for notification table isolation.

## Test Plan

- RLS tests:
  - Member cannot read or update admin’s notifications.
  - Member can read/update their own (mark read, archive).
  - Admin session can read/update others.
- Manual QA:
  - Create seed notifications, open popover, click items, archive/unarchive, verify counts.

## Open Questions

- Should any notifications be org-scoped (shared across organization members) instead of user-scoped?
- Should we add “mark all read” and/or per-notification actions beyond archive?
