# Fiscal receipt copy and cross-device return

Original workstream03 stages3/6. Continues PR326 on
`feat/fiscal-receipt-copy-20261015`, based on its recorded docs-closeout headc0b4120f.
Parent PR326 is still open; open this follow-up against its branch, not as a
duplicate main diff. Actual localhost3127 and other lanes stay preserved.

## User report and verified state

Caleb confirmed the application email on a phone while applying in laptop
incognito. The laptop then received application403 and optional profile401, plus
a Google Identity origin rejection. Read-only production metadata confirms one
application submitted at19:57:28UTC and email verified at19:58:07UTC, with one
verified browser and no verified grant for the original submission session.
The application is submitted; the403 reflects browser-bound access, not data loss.
Profile401 intentionally opens optional sign-in. No real answers or email/token
material were read, no provider changes or live messages were made.

Caleb requested an emailed copy instead of mandatory viewing/confirmation steps.
Receipt emails will contain the submitted answers directly, with optional secure
links only for later status/corrections/profile setup. Submission needs no account
or email confirmation. Preserve selected-only private profile import and existing
matching confirmed-account checks.

## Implementation

Migration20261015210000 captures an immutable, allowlisted answer snapshot when a
new applicant receipt is queued. It includes fundraising values but excludes
review notes, actor IDs, metadata/snapshots and internal project data. Old jobs
retain old content and provider keys. Legacy workers cannot claim new-copy jobs;
a new service-only v3 claim returns frozen snapshots. New code falls back to the
legacy worker only for a missing-function/schema-cache error, never an uncertain
claim. Recipient mismatch or unknown/private answer fields fail closed. New
receipts use a distinct v3 idempotency key; HTML escapes applicant content and
preserves line breaks. Existing delivered receipts are not automatically resent.

Phone confirmation also grants the original secret submission browser access,
bounded by the original seven-day window. Backfill only recent email-verified
submissions with an existing active verified session. Never replace or renew
existing expired/revoked grants. Unrelated browser replay stays denied; confirmed
matching account identity is still required for profile linking. Copy/Check again
text explains optional access and cross-device return without redesigning UI.

## Validation

51 focused cases across guest mail, email proof, follow-up and profile pass.
The14mail cases were rerun after final HTML changes. Fiscal SQL/RLS matrix and
one connected real-handler/storage journey pass with phone confirmation,
original-browser return, unrelated-browser403/replay400, unauthenticated401,
wrong-email/unconfirmed-account403, correct selected-only linking and recovery.
New SQL checks cover existing-browser backfill, frozen original answers despite
later edits, no internal fields, snapshot immutability, legacy-worker fencing,
service-only access and revoked grants. Lint/features/boundaries/thresholds/diff
pass. No full quality/build/TypeScript or hosted polling. Actual UI/email review
remains Caleb-owned; no visual fixtures or broad browser journey were used.

## Release order and rollback

1. Merge parent PR326 and review this follow-up through required hosted gates.
2. After explicit production authorization, apply only20261015210000 atomically
   with its migration ledger entry. Save before function definitions, ACL/config,
   relevant original-session grants and catalog state privately.
3. Deploy this code. Between migration and deployment, legacy emails continue;
   new-copy receipt jobs wait safely for a v3-capable worker. No new env variables.
4. Caleb selects Check again/Retry in the original laptop browser; no new email
   confirmation is needed for a recent submitted session repaired by backfill.
5. User-led next real receipt checks full answer copy and optional access. No
   synthetic production submission, automatic resend or inbox messaging by Codex.

Prefer forward recovery. If code rolls back, retain the worker fence and frozen
new-copy jobs; never resend them with legacy content under a different provider
key. Do not drop receipt snapshots or broadly delete verified sessions. Reverting
the access policy requires reviewed saved definitions and exact grant changes.
No production migration or release is performed by this PR implementation.

## Separate Google sign-in configuration

The reported GSI_LOGGER origin rejection is not caused by fiscal email proof.
Shared GoogleAuthPanel uses Identity Services; provider settings were not changed.
To resolve it in the intended Web OAuth client:

1. In Vercel Production, identify the configured NEXT_PUBLIC_GOOGLE_CLIENT_ID.
2. Google Cloud Console → Google Auth Platform → Clients. Open that matching Web
   application client, preserving all existing settings.
3. Add https://coachhouse.app to Authorized JavaScript origins and save. Add other
   origins only if actually used; this field has scheme/host/port, no path.
4. Retest the optional Google signup from the exact production origin. A wrong
   deployed client ID instead requires correcting that variable and rebuilding.

[Official Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
Google sign-in remains a separate provider configuration blocker; receipt copies
and account-free submission do not depend on it. Keep Calendar/formation queue
and shared SHIP40 hold unchanged.
