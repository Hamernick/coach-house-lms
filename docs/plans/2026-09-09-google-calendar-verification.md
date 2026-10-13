# Google Calendar verification submission

Status: implementation ready for continued review. Google has not approved Calendar data access. A callback
fix now preserves unconsumed OAuth state when Google explicitly returns incomplete
Calendar permissions; 21 focused tests pass, including correction/replay and token
scope regressions. Live import is still unverified. Do not submit a demonstration
that implies the import is working until the canary succeeds. Joel's Google Cloud
Console is accessible again as of September 9, 19:39 UTC. Branding is verified;
Calendar event-read access remains unverified.

## Execution plan and current result

1. Inspect existing Google sessions before starting consent. Done: Joel is signed
   in and the verification form is accessible. After the user returned, started
   one fresh Caleb request at 20:20 UTC after creating the safe demo calendar.
   Its warning remained open and the database confirms expiry at 20:30:07 UTC.
   Zero Calendar connections were present at that check. Wait for the human
   operator to be ready before creating another request; do not reuse the expired one.
2. Implement the Calendar privacy disclosure and compatible signup-consent update.
   Done locally, with the database migration applied and verified. The public
   privacy page has not been deployed.
3. Complete Caleb's real import, privacy, pause/resume and disconnect canary. Pending
   successful consent; keep optional export off. Do not use test mocks as live evidence.
4. Record the working flow and prepare the actual unlisted demonstration video.
   Pending the canary. No recording or upload exists.
5. Finish Console verification details and submit the completed request. Pending
   the reviewed public privacy release, the actual video and the app-name appeal
   field now displayed by the submission form. Joel's sign-in is complete.
6. Complete release validation, deploy through the repository workflow and activate
   Calendar/scheduling when rollout is ready. Production is still disabled.

Validation in this follow-up: 28 focused acceptance tests; isolated PostgreSQL tests
for exact consent hashes, prior-version compatibility, immutable records, server
timestamps and role restrictions; all 16 static-quality stages including lint and
snapshots; local browser confirmation of the Calendar disclosure and effective date.
The full release quality gate was not repeated against shared production credentials.

## Application and project

- Application: Coach House; project: coach-house-496700.
- Calendar OAuth client: Coach House Calendar (web).
- Client ID: 74627119265-lhjpd79oj5oqlk85psat4r10skp11m9c.apps.googleusercontent.com.
- Homepage: https://coachhouse.app/.
- Privacy policy: https://coachhouse.app/privacy.
- Developer/support contact: joel@coachhousesolutions.org.
- Branding was verified at the September 9 provider checkpoint. Calendar data
  access was not verified. Refresh this status in Console before submitting.
- Existing Google login and Drive clients/scopes must remain intact.

## Requested Calendar access

| Scope | Feature and justification |
| --- | --- |
| calendar.calendarlist.readonly | List calendars the user can read so the user can choose which calendars to display. |
| calendar.events.readonly | Display event titles, dates, times and all-day/recurring occurrences from selected calendars in the user's private agenda. Free/busy does not provide the event details this agenda displays. |
| calendar.app.created | Optional board export creates a separate Coach House calendar and manages its exported events. Existing Google-native events are not edited. Keep export off for Caleb's import canary. |
| openid and email | Identify the Google account connected by this signed-in Coach House user and prevent account mixing when credentials are refreshed or reconnected. |

Ready-to-use sensitive-scope justification:

> Coach House displays events from calendars explicitly selected by the signed-in
> user in that user's private agenda, alongside workspace board events. Event read
> access supplies titles, start/end times, all-day dates and recurring occurrences;
> free/busy cannot supply this agenda. Calendar data is protected by server-side
> authorization, and refresh credentials are encrypted. Imported events are not
> published to organization members or public pages. Users can pause sync, or
> disconnect to remove the stored refresh credential and event cache. Existing
> Google-native events are not edited. Optional board export uses a separate
> calendar created by Coach House.

The corrected text above is entered in the Console editor but is not confirmed
saved: Save remains disabled with the demo-video field blank. The previously
persisted description incorrectly groups imported events with encrypted refresh
tokens. Verify the corrected text persists when the real video URL is added.

The verification summary also displays an app-name mismatch appeal field despite
the Verification Center reporting branding verified. The public homepage currently
opens the resource map. Investigate the visible name and complete the appeal with
accurate evidence; do not claim that the existing rejection has been resolved.

Do not describe the event cache as application-encrypted: refresh tokens and PKCE
verifiers use application encryption, while event cache data is stored as JSON in a
service-only, RLS-protected table. Ensure the Console justification reflects this
distinction. Do not claim consent or import succeeded based only on an HTTP 200.

## Privacy disclosure implemented for release

The checked privacy document now contains a separate Google Calendar section,
including access, use, private visibility, retention, disconnect and optional export.
It preserves the distinction that Google Sign-In alone grants no Calendar access.
The shared Terms/Privacy version is now 2026-09-09.1, effective September 9, 2026;
Terms body text is unchanged, with its version/date and content hash updated as part
of the existing bundled-consent contract.

- Terms SHA-256: 7976c515ea20f08a89c0334d4135733d7a0d1088780bb1e6d5768d1c7ababef0.
- Privacy SHA-256: 3ba370741180467b5e1b43fad91feb6b0ac393634e500487588d15951e069b9f.
- Applied migration: 20260909150000_accept_calendar_privacy_consent.sql.
- Migration SHA-256: 380b14d974988c65ac1a4e6743780f29c612eb829bbb143d7e76327463082bf0.
- Database: vswzhuwjtgzrkxknrmxu. Verified installed function body matches the local
  migration (MD5 acc965342882f6d714f75ee440797c0e), accepts August 12/August 27/
  September 9 tuples and leaves the unrelated Documentation migration unapplied.
- Local review: http://localhost:3012/privacy. Public release remains pending.

Submission summary of the implemented Calendar-specific disclosure:

> Google Calendar is optional and requires separate permission from Google Sign-In.
> When you connect it, Coach House receives your Google account identifier and
> verified email address, a list of calendars you can access, and event information
> from the calendars you select. We store calendar names and identifiers, event
> titles, dates, start/end times, all-day status, links to Google events and sync
> information to display and refresh your private agenda. Connection credentials
> are encrypted and access to stored Calendar data is restricted by server-side
> authorization. Imported personal events are visible only to you in Coach House;
> they are not added to shared organization boards or public pages.
>
> Turning sync off pauses updates and hides imported events while retaining your
> connection and selections. Disconnecting removes the stored refresh credential
> and event cache from active storage. It does not delete events in Google Calendar
> or disconnect Google Sign-In or Drive. You can also revoke access in your Google
> Account. If you enable optional board export, Coach House sends the selected
> workspace's board events to a separate Google calendar it creates for that
> purpose. Coach House does not sell Calendar data, use it for advertising, or send
> it to AI providers for this integration. Its use of Google data follows the
> Google API Services User Data Policy, including applicable Limited Use requirements.

Verified the published privacy page in Chrome on September 9: it still shows
2026-08-27.1 and has no separate Google Calendar disclosure. Verify it again after
the reviewed release. No privacy changes have been published in this preparation.

## Demonstration video outline

Use the prepared [recording kit](2026-09-09-google-calendar-recording-kit.md) for
examples, sample Calendar/Drive files, the shot list and narration. It expands this
Calendar outline to cover the project's existing Sign-In and Drive flows and the
optional export feature. Caleb's private Coach House Demo calendar now contains
the three sample event types (six occurrences), verified in Google Calendar.
The Drive sample remains local; no recording or upload exists. The kit records
the remaining local Sign-In/Drive configuration and demo-only export workspace gaps.

Google requires an unlisted YouTube video showing the real OAuth grant flow and
how each sensitive scope enables the application feature. Use English UI. Show the
Coach House app name and OAuth client ID in the consent-page address bar; keep
secrets, authorization codes and unrelated personal calendar details out of the video.

1. Open Workspace Tools and show the single Google Calendar switch off.
2. Turn it on and show the Calendar explanation and Continue with Google.
3. Show account selection, app identity and the requested Calendar permissions.
4. Return to Coach House and select a calendar approved for the demonstration.
5. Save and sync. Show a known event in the private agenda and its corresponding
   Google event; show the Only you indicator and day/month navigation.
6. Turn sync off in Tools, show imported events disappear, then resume.
7. Show the disconnect control and explain that it clears the local credential and
   cache while preserving Google events. Complete the authorized disconnect test.

Do not upload Caleb's unrelated private events or contacts. Prepare and review the
actual video before uploading it. No recording or upload has been created yet.

## Submission completion

After the live callback/import defect is resolved, the reviewed privacy release is
available, and the video exists: verify branding status, confirm the exact declared
scopes, save the scope justification and video URL in Google Auth Platform, review
the completed submission, and submit the Calendar data-access verification request.
Track the actual Google review result; submitting does not mean approved.

Sources: [Google sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification),
[Google submission requirements](https://support.google.com/cloud/answer/13461325?hl=en).
