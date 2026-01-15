# Onboarding Simplification + Admin Test Toggles + Accelerator Tutorial
Status: In Progress
Owner: Caleb
Priority: P0
Target release: Launch

---

## Purpose
- Reduce time-to-value by removing plan selection from first-run onboarding (org + account only).
- Make it easy to QA onboarding + tutorials from an admin account without exposing controls to non-admins.
- Add an Accelerator-specific welcome + tutorial path.
- Fix highlight-tour UX issues (overlay blocking target; missing icon/visual).

## Current State
- `src/components/onboarding/onboarding-dialog.tsx` is a 3-step modal (org → account → plan). “Individual vs Organization” is no longer the desired mental model for launch.
- Admin users are excluded from onboarding/tour flows, making QA harder.
- Accelerator highlight steps exist, but there’s no first-run “welcome” that starts the Accelerator tutorial.
- `src/components/tutorial/highlight-tour.tsx` uses a full-screen overlay that darkens/blocks the highlighted element; tooltip lacks a visual leading icon.

## Scope
In scope:
- Onboarding dialog: 2 steps (org → account). Remove the plan step UI.
- Onboarding submit action: do not initiate Stripe checkout during onboarding.
- Tutorial welcome: support both Platform and Accelerator (route-aware).
- Admin-only account-menu “Testing” actions:
  - Open onboarding modal
  - Start Platform tutorial / Start Accelerator tutorial
  - Reset tutorial state(s) for testing
  - Reset onboarding completion for testing
- Highlight tour:
  - Overlay does not cover the highlighted element (hole is interactive)
  - Tooltip includes a rounded icon tile for each step

Out of scope:
- Pricing/checkout redesign, plan renames, or subscription gating changes.
- Reworking tutorial step definitions beyond visuals + routing.

## UX Flow
- New user: onboarding modal → `/my-organization?welcome=1` → Platform welcome → Platform tutorial.
- Accelerator user: first entry to `/accelerator` shows Accelerator welcome (once) → Accelerator tutorial.
- Admin: sees no onboarding by default, but can trigger onboarding/tutorials from the account menu.

## Data & Architecture
- Uses Supabase auth `user_metadata` for tutorial + onboarding state:
  - `onboarding_completed`, `onboarding_completed_at`
  - `tutorials_completed`, `tutorials_dismissed`, and `*_at` maps
- Admin-only reset actions must verify `profiles.role = 'admin'` server-side.

## Acceptance Criteria
- Onboarding dialog no longer shows “Individual vs Organization” plan selection.
- Admin account menu exposes test controls; non-admins cannot see them.
- Platform + Accelerator welcome modals start the correct tutorial.
- Highlight overlay leaves the target unobscured and clickable; tooltip shows an icon tile.

## Test Plan
- `pnpm lint`
- `pnpm test:snapshots`
- `pnpm test:acceptance`
- `pnpm test:rls`
- Manual QA:
  - Trigger Platform tutorial from account menu
  - Trigger Accelerator tutorial + verify overlay/tooltip UX
  - Reset tutorial state and confirm welcome can re-appear
  - Open onboarding modal as admin and submit successfully

