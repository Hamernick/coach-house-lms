# Google Account Linking Design

## Goal

Let a signed-in user add Google as an alternate login method without presenting
it as multi-factor authentication or allowing one Coach House account to link to
a different Google email.

## Design

The existing Account settings > Security surface owns a feature-flagged Google
connection card on desktop and mobile. It reports loading, unlinked, linked, and
recoverable error states. Linked accounts keep password login; unlinking is out
of scope because removing a login method needs separate reauthentication and
recovery design.

The Google Identity Services button continues to use a nonce-bound ID token. In
link mode, a server-owned action authenticates the current Coach House session, verifies
the token audience, nonce, verified Google email, and an exact normalized email
match with the confirmed Coach House account. Only then does the browser call
Supabase `signInWithIdToken`; Supabase automatic same-email linking attaches the
Google identity to the existing user. The client refreshes identity status after
success.

Unknown Google logins remain blocked by the existing `auth.users` legal-consent
trigger: a first-time ID-token login has no accepted legal metadata, so its user
insert is rolled back. Signup remains the only Google account-creation path.

## Validation

Acceptance coverage locks server verification, the legal-consent boundary,
feature-flag gating, Account Security ownership, accessible status/error text,
and mobile parity. Focused lint, acceptance, structure, boundaries, and the full
quality gate run before release.
