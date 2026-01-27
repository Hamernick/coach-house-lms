# Coaching Booking (Standardized cards + 3 calendar links)

Status: Done
Owner: Caleb
Priority: P0
Target release: ASAP (launch support)

---

## Purpose

- Standardize coaching booking CTAs so the experience is consistent across dashboard, accelerator, and module flows.
- Enforce the entitlement rule: 4 free sessions for Accelerator purchasers, then discounted paid sessions; full-price option for everyone else.
- Reduce duplicated booking logic and keep scheduling links behind a single, guardrailed API.

## Current State

- Booking CTAs are implemented multiple times with different layouts and copy (`DashboardCheckInCard`, `AcceleratorScheduleCard`, module completion CTA, lesson notes CTA, support menu).
- Scheduling is wired to host-specific links via `/api/meetings/schedule?host=...` and tracks a generic `meeting_requests` counter.
- Free meeting limit currently maps to “free tier subscription,” not the Accelerator purchase entitlement.

## Scope

In scope:

- Replace host-specific scheduling with three calendar links: free (x4), discounted (post-free for Accelerator), and full-price.
- Centralize scheduling logic (client helper + API route) to avoid repeated fetch/toast code.
- Standardize booking card layout/copy across the primary surfaces (dashboard check-in, accelerator overview, module completion CTA).
- Update data logic so “free x4” is tied to Accelerator purchase status (not subscription tier).

Out of scope:

- Building a full scheduling system (availability, reschedule, reminders, or billing inside the app).
- Auto-notifications for bookings (handled in the notifications brief).
- Multi-seat coaching entitlements.

## UX Flow

- Entry points:
  - Dashboard “Check-in” card.
  - Accelerator overview booking card.
  - Module completion CTA (and any lesson notes CTA that references coaching).
  - Support menu quick action.
- Primary user path:
  1. User clicks “Book a session.”
  2. Server resolves entitlements and returns the appropriate calendar link.
  3. Link opens in a new tab; toast confirms.
  4. If free sessions are exhausted, the discounted link is returned for Accelerator users.
- Secondary paths:
  - Show remaining free sessions when available.
  - For non-Accelerator users, route directly to full-price booking.
- Empty / loading / error states:
  - Loading: CTA shows “Opening…” with disabled state.
  - Error: toast with “Scheduling link unavailable” or “Unable to schedule.”

## UI Requirements

- Use a shared booking card layout (icon, short description, single primary CTA).
- Copy should consistently mention: “4 sessions included with Accelerator, then discounted.”
- Preserve existing shadcn card styling; keep compact layout for smaller surfaces.

## Data & Architecture

- Update `/api/meetings/schedule` to resolve a schedule tier:
  - Accelerator purchase active + free sessions remaining → `free`.
  - Accelerator purchase active + free sessions exhausted → `discounted`.
  - No Accelerator purchase → `full`.
- Store free-session usage in `organizations.profile.meeting_requests` (or rename to a clearer key if needed).
- Gate scheduling to org editors only (`canEditOrganization`).
- Ensure `accelerator_purchases` status is the source of truth for entitlement.
- Keep all booking links in environment variables (new keys for free/discounted/full).

## Integrations

- Google Calendar / Calendly links for the three booking tiers.
- Supabase for entitlement checks and free-session counters.

## Security & Privacy

- Do not expose raw booking links directly in UI; always resolve through the API.
- Rely on Supabase auth and org-role checks before returning a link.

## Performance

- No additional heavy UI; keep fetch calls lightweight and on-demand.
- Avoid extra round trips by reusing a shared client helper for scheduling.

## Accessibility

- Buttons must be keyboard accessible with proper focus states.
- Ensure loading state changes are announced via text swap.

## Analytics & Tracking

- Track a simple event for booking clicks (tier: free/discounted/full) if analytics wiring exists.

## Edge Cases

- Missing env var for a booking tier → return a friendly error.
- Accelerator purchase refunded → treat as non-Accelerator (full-price only).
- Free-session counter missing or malformed → treat as zero.

## Migration / Backfill

- None required; existing `meeting_requests` value can be interpreted as “free sessions used.”

## Acceptance Criteria

- Booking CTAs across dashboard, accelerator, and module completion share a consistent layout and copy.
- Users with an active Accelerator purchase get 4 free sessions, then a discounted link.
- Users without Accelerator access only see full-price scheduling.
- Missing links fail gracefully with a toast error.

## Test Plan

- Manual QA:
  - Accelerator user with 0 free sessions used → link opens “free”.
  - Accelerator user with 4+ free sessions used → link opens “discounted”.
  - Non-Accelerator user → link opens “full”.
  - Missing env link → toast error.
- RLS/route: verify only org editors can schedule.

## Rollout Plan

- Feature flags: not required.
- Deploy steps: set the new env vars in Vercel and remove legacy host links when stable.
- Rollback plan: revert to host-based scheduling route.

## Dependencies

- Calendar links for free/discounted/full tiers.
- Confirmation that a single booking link (no host selection) is acceptable.

## Open Questions

- Should host selection remain (Joel vs Paula), or is a single pooled link acceptable?
- Do we want to show “free sessions remaining” outside the dashboard card?

## Moonshot

- Add a lightweight booking history panel and reschedule link surfaced in-app.
