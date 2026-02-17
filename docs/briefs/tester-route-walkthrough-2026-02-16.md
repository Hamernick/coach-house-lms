# Tester Route Walkthrough (2026-02-16)

Status: active
Owner: Caleb + Codex
Updated: 2026-02-16

## Purpose
Give testers and internal reviewers a single, current route map from sign-up to paid access with exact gating behavior.

## Personas
- Member: regular end user
- Tester: can see test/tutorial/payment playground controls, but cannot run seed actions
- Admin: full internal controls, including seed actions

## Entry Flow
1. `GET /sign-up`
2. Account creation completes via Supabase auth callback.
3. Signed-in user lands on `GET /my-organization`.

## Onboarding Flow (inline in app shell)
When `onboarding_completed !== true`, onboarding is shown inline in the main canvas on `/my-organization`.

Steps:
1. `Intent`
- Card-grid options:
  - `Build nonprofits` (selectable)
  - `Find nonprofits` (coming soon, disabled)
  - `Fund nonprofits` (coming soon, disabled)
  - `Support teams` (coming soon, disabled)
- Optional role interest:
  - `Staff`, `Operator`, `Volunteer` (selectable)
  - `Board member` (coming soon, disabled)

2. `Create your organization`
- Organization name
- Organization URL slug (availability checked)
- Formation status

3. `Set up your account`
- Avatar + account fields + comms preferences

On submit:
- `completeOnboardingAction` stores profile/org updates.
- Auth metadata writes:
  - `onboarding_completed`
  - `onboarding_completed_at`
  - `onboarding_intent_focus`
  - `onboarding_role_interest`
  - communication preferences
- Redirects to:
  - `/my-organization?paywall=organization&plan=organization&source=onboarding`

## Post-Onboarding Paywall
The first post-onboarding destination opens a skippable in-app paywall overlay.

Behavior:
- `Continue without upgrade` closes overlay and keeps user in app.
- `Upgrade now` launches Stripe checkout for paid tier.
- `Open pricing` opens `/pricing` for full tier selection (`$20` or `$58`).

## Pricing + Checkout
Primary route: `GET /pricing`

Visible tiers:
- Free: `Individual`
- Paid: `Organization` (`$20/mo`)
- Paid: `Operations Support` (`$58/mo`)

Checkout action:
- `startCheckout` (server action)
- Current model: organization subscription checkout only
- Supports `plan_tier` metadata:
  - `organization`
  - `operations_support`

## Access Gating
### Admin section
- Free users see admin row with upgrade affordance, not active access.
- Paid users/admin can access admin functionality.

### Accelerator + electives
- Paid plans unlock accelerator learning path.
- Electives are included with paid plans.
- Locked routes redirect to organization paywall query.

## Key Locked Route Redirects
- Accelerator layout lock:
  - `/accelerator` -> `/my-organization?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator`
- Module lock:
  - `/class/[slug]/module/[index]` -> `/my-organization?paywall=organization&plan=organization&source=module`

## Tester/Internal Tools Visibility
Policy resolver: `src/lib/devtools/access.ts`

- Member:
  - no internal testing menu/actions
- Tester:
  - can open onboarding
  - can replay/reset tutorials
  - can access payment playground
  - cannot run seed actions
- Admin:
  - full access, including seed actions

## Expected QA Smoke Paths
1. Member sign-up -> onboarding -> post-onboarding paywall opens -> skip -> continue using app.
2. Member tries locked accelerator/admin capability -> paywall opens -> upgrade path works.
3. Tester account sees testing tools but no seed action.
4. Admin account sees full tooling.
5. Paid checkout reflects in entitlements after webhook sync.
