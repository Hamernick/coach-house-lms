# Paid Onboarding Stuck Report

Date: 2026-04-15

## Summary

Paid builder users could become trapped on `/onboarding` after Stripe checkout succeeded. The pricing step correctly showed a paid tier as the current plan, but the user still could not reach `/workspace` because the app continued treating them as onboarding-locked.

## User-visible symptoms

- `/onboarding` pricing step shows a green `Current plan` badge after payment.
- The page can still show `We could not start checkout. Please try again.` from stale checkout query params.
- Navigating to `/workspace` or other dashboard routes immediately returns the user to `/onboarding`.
- Refreshing does not recover the session.

## Root cause

The recovery path for paid post-signup onboarding was too narrow.

- The client auto-submit hook only recovered the user when the URL source was exactly `source=onboarding_pricing`.
- The shell redirect for onboarding-locked builder users sends them to `/onboarding?source=onboarding`.
- Once a paid user left the original pricing-return URL, the pricing step still knew the subscription was active, but the auto-submit recovery no longer ran.
- That left the user in a dead state: paid plan detected, onboarding lock still active, and no automatic completion of onboarding.

## Fix

- Broaden the paid pricing-step recovery logic so `post_signup_access` onboarding auto-submits whenever the user is on an onboarding pricing step with an already-active builder plan.
- Allow both onboarding sources:
  - `source=onboarding_pricing`
  - `source=onboarding`
- Ignore stale `checkout_error` and `cancelled` URL params when the server already resolves the builder plan as active, because the paid entitlement is a stronger signal than the leftover URL state.

## Regression coverage

- Added acceptance coverage proving paid post-signup onboarding now auto-recovers:
  - from the generic `/onboarding?source=onboarding` route
  - even when stale checkout error params remain in the URL
  - while still refusing unrelated sources such as `source=billing`
