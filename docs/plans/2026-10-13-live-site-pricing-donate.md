# Live-site pricing and Donate

## Scope and source

User priorities LIVE-01/O037-04 and LIVE-02/O029-01. Read the original Desktop
`Coach House Codex Workstreams/09-website-marketing-communications.md`:
stage 1 public navigation, stage 2 localhost review, and the Donate portion of
stage 4. The Desktop live-site priority override governs order. Broader marketing,
product demos and the closed internal MVP sprint are not reopened.

Implementation lane: `fix/live-site-pricing-donate-20261013`, isolated checkout
`coach-house-platform-live-site-20261013`, based on main `ce1436a2`.
User direction: localhost development followed by gated production testing;
no Supabase preview branches or provider preview setup.

## Implemented

- Shared public header: Donate is the third centered navigation item, a direct
  link to the user-supplied Monkeypod form with a new browsing context, no
  dropdown, and opener isolation. Shared footer includes the same link.
- Header uses two rows below 768px. Browser checks exposed overlapping navigation
  and Login controls at intermediate widths with the former 480px breakpoint.
- Build menu Pricing and Documentation now open their full public pages.
  Existing Build section anchors remain valid.
- Pricing card signup destinations already preserve the chosen plan. No billing,
  price or entitlement changes.
  `/sign-up?intent=build&plan=organization` uses the October 12 redesign from
  `73dd8d15`: account authentication/verification, selected-plan checkout, then
  `/onboarding?source=onboarding_pricing`. Free signup bypasses checkout.
- User's actual email test exposed a confirmation fallback defect: production
  Supabase permits localhost:3000 callbacks, not this lane's localhost:3119.
  Its configured Site URL is coachhouse.app and its confirmation email opens
  the production confirmation page. A substituted Site URL previously led home.
  After successful OTP verification, confirmation now recovers an unfinished
  signup's plan from returned user metadata. Explicit destinations, recovery,
  invalid-token handling and completed-account behavior remain preserved.

## Evidence and continuation

- 35 focused acceptance tests passed across navigation, Build, pricing and signup.
- Three focused Playwright behavior tests passed: Donate popup/no-menu/layout,
  and Build Pricing navigation from home and Documentation. Donor navigation was
  intercepted locally; no payment-provider transaction was performed.
- 25 auth-confirmation/recovery/signup-page tests passed, including actual form
  action invocation after successful versus failed OTP verification, paid/free
  Site URL fallback recovery, and explicit-destination preservation. This suite
  overlaps the signup coverage above; counts are not additive.
- Changed-file ESLint and diff checks; Graphify updated.
- Desktop review gallery: `Coach House Pricing Donate Review/START-HERE.html`.
  Local server: `http://localhost:3119/?react-grab=0`, owned by this checkout.
  Preserve the unrelated frontpage server on port 3000.
- Signup/onboarding source is identical to the October 12 release. The user's
  real confirmation landed home; do not describe the entire journey as passing.
  Confirmation fallback fix is local only. Real signup/payment/unlock and live
  patched confirmation verification remain outstanding. The confirmed account
  can be reused; no new account or email is required merely to rerun local tests.
- User appearance review remains pending. Do not infer approval from the question
  about signup routing. Baselines have not been replaced. After review, generate
  affected references on the supported Ubuntu runner and obtain current-head
  quality/code-owner review and exact-revision approval before release.
- No provider configuration, database mutation, email or production deployment
  occurred in this slice. Original SHIP-000 blocked history and separate PRs
  #292/#293 remain independent; this preparation does not create another claim.

## Pricing button family verification

The user requested the same protection for primary/secondary plan buttons and
the repeated card section. Both `/pricing` and `/build` compose the same
`PricingTierCardsSection`; variant colors do not affect hrefs. Browser tests
clicked all six cards and verified selected-plan signup plus the retained sign-in
return. Individual goes to free onboarding; Organization and Operations Support
preserve the selected checkout plan and onboarding return/cancel destinations.

Inspected seven generic signup links across home, Build and Pricing; one browser
click-through per route verified signup and `/onboarding?source=signup` return.
Accelerator/support exploration links intentionally target the existing Build
pricing section. No additional runtime or style change was needed.

Expanded regressions cover anonymous/signed-in card selection, encoded email
destinations, and actual confirmation form actions for generic/free/both paid
signups. The six-file focused suite passes 40 tests; two added browser tests
cover all six cards. Existing Donate/menu checks remain applicable. This verifies
local routing, not a live payment or production confirmation retest.

## PR294 automated review follow-up — 2026-10-13 18:30 UTC

Explicit homepage collection query/fragment state now survives confirmation, including absolute and callback URLs. Bare provider Site URL fallback still recovers the selected signup plan. Seven regressions failed before the fix; all 47 focused signup/confirmation tests now pass. Appearance, hosted quality, code-owner review and production confirmation remain pending.
