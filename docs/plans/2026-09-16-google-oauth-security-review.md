# Google verification and OAuth warning review

## Observed and recorded evidence

The user reports current Verification Center warnings:

- Coach House Web: authorization requests without `state`.
- Coach House Drive Documents and Coach House Calendar: production Web clients
  allow loopback redirect IPs.

The September 15 Documents assessment in the root worktree records Google branding
and data-access approval September 14, working Picker September 10 and a live
Markdown import/edit/save/reload plus linked-file canary September 11. That evidence
is historical. This session has not inspected today's live Verification Center.
Chrome was running, extension diagnostics passed and the native-host manifest was
valid, but browser discovery returned no connected browsers after the account switch.
The user was asked to reconnect Chrome in this Codex account.

## Code findings

- Web sign-in uses Google Identity Services popup ID-token authentication, not a
  handwritten authorization-code redirect. It generates a 32-byte random nonce,
  sends its SHA-256 hash to Google and passes the original nonce to Supabase
  `signInWithIdToken`. Signup/link token verification also compares the nonce hash.
  This matches [Supabase's documented nonce pattern](https://supabase.com/docs/guides/auth/social-login/auth-google).
  A missing OAuth `state` report cannot be declared fixed or dismissed from that
  code alone: identify the live client ID and capture the exact flagged request
  flow, without logging tokens, before making a login change.
- Drive in this branch generates a 32-byte random `state`, stores its hash bound
  to user/org with expiry, consumes it once, and uses S256 PKCE. The Calendar OAuth
  implementation inspected read-only in the other checkout also generates random
  state, binds/atomically consumes it and uses S256 PKCE. Neither source finding
  establishes what is deployed or which client configuration was flagged.
- Particle image uploads use private Supabase `roadmap-media`, independently of
  Google's verification process. The actual particle upload/read canary remains.

## Concrete provider remediation to review once connected

Google [requires separate testing and production projects](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).
Inventory exact redirects/origins and local/deployed client identity first. Prepare
separate development OAuth clients in a testing project, configure localhost to use
those credentials privately and verify the local callback. Then remove only the
identified loopback/test redirects from production Drive/Calendar clients while
preserving their verified HTTPS callbacks. Verify production connection behavior.

Do not regenerate stored-connection encryption keys, rotate working production
secrets, revoke accounts, delete redirect entries or submit a new verification
request based only on these warnings. The migration is not executed: it changes
provider configuration and local OAuth connections and needs a concrete reviewed
configuration plus action-level authorization. No Google/provider/auth changes
were made in this session, and no warning is claimed resolved.

## Authorized live connection test after browser restart

The user subsequently confirmed both Google verification statuses display verified
and explicitly requested a real Google Drive connection test. That authorization
carries forward; do not ask for the same connection approval again. It does not
authorize changing production client redirects or rotating secrets.

Read-only environment checks confirm the root checkout already has the required
Supabase and Drive configuration, including Picker and the existing encryption
key map. Its callback is `http://localhost:3000/api/integrations/google-drive/callback`.
The listener on port 3000 belongs to that root checkout. The isolated particles
checkout on port 3021 has none of those environment values and remains a sample
preview. No secret values were printed, copied, regenerated or changed.

Resume through the supported Chrome connection in Joel's profile: inspect the
account/organization, open the actual app on port 3000, inspect existing connection
status, and use its Connect Google Drive flow if needed. Confirm the return to the
app and the connection status, then open Picker. Use a user-designated disposable
file for any attachment/read/write canary; do not edit unrelated Drive files.
Keep connection success, Picker access, file behavior and private image storage
as separate results. Browser discovery still returned `[]` in this session; no
live authorization or file test has yet occurred. The user plans to restart this
chat to restore browser access, so no repeated extension/account setup is needed.
