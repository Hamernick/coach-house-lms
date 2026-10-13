# Coach House Google OAuth recording kit

Prepared September 9, 2026. Target: a clear 5–7 minute recording; this duration is
our estimate, not a Google requirement. The script, sample files, and private Google
demo calendar are ready. Live Coach House import and the recording remain pending.

## Example to watch

[Google Calendar API OAuth Demo for App Verification — Qyra, May 27, 2025](https://www.youtube.com/watch?v=DfR3PB5nj6I).
The creator describes account selection, consent, and Calendar event operations.
The video page and playback controls were available when checked in Chrome. This
is a format reference, not evidence that Google approved that app or a model for
our permissions: Coach House imports selected calendars and has separate optional export.

[How To (Correctly) Make An OAuth Demo Video For Google Verification — Graeme Rouse](https://www.youtube.com/watch?v=evD9X34Ahus)
is an additional walkthrough from 2019. Use Google's current requirements below
for the final recording.

## What to have ready

| Item | Preparation and current state |
| --- | --- |
| Recording browser | Caleb's Bandto Chrome profile, signed into Coach House and caleb@bandto.com. Keep Joel's Console outside the recording area. |
| Calendar app | http://localhost:3012/workspace?drawer=tools. Local Calendar enabled; production remains disabled. Prepared a separate tab with full-height Tools, collapsed sidebar/details, and search filtered to Google Calendar, covering private workspace cards and the Drive account email. Exclude the remaining app header/avatar strip from the recording crop. |
| Privacy explanation | http://localhost:3012/privacy includes the new Calendar section. The public policy still needs the reviewed release before submission. |
| Google Calendar | **Coach House Demo** created in Caleb's Bandto account; timezone America/New_York. Public and Bandto sharing both off; Caleb is the sole owner. Other calendars are hidden and the sidebar is collapsed for recording. |
| Sample events | Created the three examples through Calendar's real UI, including a weekly series explicitly limited to four occurrences. All are private/free, with no guests, Meet links or reminders. The [ICS file](recording-assets/coach-house-calendar-demo.ics) was not imported; do not import it now and duplicate these examples. |
| Drive sample | [coach-house-drive-demo.txt](recording-assets/coach-house-drive-demo.txt) contains only invented demo content. File prepared; not uploaded or connected. |
| OAuth test | Still pending: the prepared request started at 20:20 UTC and expired at 20:30:07 UTC while Google's warning remained open. Read-only database check confirms zero Calendar connections. Do not resume that expired request or start another until the human operator is ready. |
| Export chapter | Current declared Calendar scopes include calendar.app.created. Prepare a demo-only workspace/board event for this chapter; Caleb's initial import test keeps export off. Do not export the existing organization's real board for a recording. |
| Client inventory | All three public client IDs identified below. Local port 3012 currently lacks Sign-In and Drive environment configuration, and is not a registered Drive callback. Those chapters need a separately prepared session. Preserve working connections. |
| Recorder | QuickTime Player opened. This CLI chat exposes Chrome controls, but no native desktop Computer Use controls or recorder capability. The human operator must choose the recording region/microphone, enable Do Not Disturb, and start/stop recording. None of those recorder settings is confirmed yet. |
| Upload | YouTube Studio channel must be ready. Review the actual file, then upload with visibility **Unlisted** and verify playback from the shared link. No upload exists. |

The sample calendar contains six occurrences: one timed event on September 10,
one all-day event on September 11, and four weekly meetings beginning September 14.
Dates are in September/October 2026. If recording later, move the demo dates first.
The file has no guests, invitations, locations, meeting links, or reminders. The
equivalent events now exist in Google Calendar. September 10, 11, 14, 21 and 28
and October 5 were confirmed in the month views; the recurrence editor confirmed
four Monday occurrences. The recording tab is back on September.

Chrome's file chooser rejected the attempted upload with `Not allowed` because
extension file-URL access is unavailable. No file was uploaded. The fixtures were
created through the Calendar editor instead. Creation initially inherited Bandto
organization sharing; this was explicitly turned off before adding any events.
Timed and all-day notification lists were empty and all other notifications were
set to None. The source calendars were only hidden, not modified or disconnected.

For a future replacement calendar only: in Google Calendar, use **Other calendars → Add → Create new
calendar**, name it **Coach House Demo**, and keep it private. Open **Settings →
Import & Export**, choose the supplied ICS file, explicitly select **Coach House
Demo** as the destination, and import once. Confirm the three event types appear.
Google defaults imports to the primary calendar, so select the demo destination
before importing. See Google's [create-calendar](https://support.google.com/calendar/answer/37095?hl=en)
and [import instructions](https://support.google.com/calendar/answer/37118?hl=en).

## Recording order and narration

| Chapter | On-screen actions | Suggested narration / evidence |
| --- | --- | --- |
| 1. Identity and sign-in, ~45s | Show Coach House identity and the Google Sign-In flow using the demo account, then reach Workspace. Use a separately prepared signed-out session for this chapter; do not sign out the working canary mid-test. | “Coach House helps organizations manage their workspace. Google Sign-In identifies my account. Calendar access is requested separately.” Show the actual sign-in client and consent where applicable. |
| 2. Calendar connection, ~60s | Tools → **Google Calendar sync** switch on → **Continue with Google** → account selection → warning, if shown → complete consent. Keep English selected. | “This switch starts the personal Calendar connection. Coach House lists available calendars and reads events from the calendars I select.” Show app name, Calendar client ID and every requested permission. Human operator completes Google's warning and consent. |
| 3. Selection and import, ~60s | In **Calendars to display**, select only **Coach House Demo**. Leave **Export this workspace’s board events** unchecked. Click **Save and sync**. Open the calendar panel and select September 10, 11, and 14. Compare these with Google Calendar. | “Only this selected calendar is displayed. The agenda shows a timed event, an all-day event, and a recurring meeting. These imported events are visible only to my account.” Capture actual successful results, not the visual-regression preview. |
| 4. Refresh and control, ~45s | Rename the demo planning event in Google Calendar. In Coach House use **Manage Google Calendar** → **Sync now**. Show the updated title. Turn the Tools switch off; show imported events disappear. Turn it back on; show them return. | “Sync refreshes the selected events. Turning the switch off pauses updates and hides imported events while keeping my selections.” Demonstrate manual refresh; do not claim a production scheduler is active. |
| 5. Optional export, ~45s | After the import rehearsal succeeds, use a demo-only workspace. Show the export permission and **Export this workspace’s board events**, then the separate Coach House-created Google calendar and demo board event. | “Optional export writes this workspace's board events to a separate calendar created by Coach House.” This is a required coverage checkpoint for the current export feature; it has not been run or enabled in Caleb's canary. |
| 6. Calendar disconnect, ~30s | **Manage Google Calendar** → **Disconnect** → confirm **Disconnect**. Show the Calendar connection off and the original Google demo events still present. | “Disconnect removes Coach House's stored Calendar credential and imported cache. My original Google events remain, and Google login and Drive stay connected.” Do not use Google account-wide revocation for this demonstration. |
| 7. Existing Drive flow, ~60s | In a prepared demo connection/workspace, show Drive authorization, then Documents' existing Google file picker choosing only the sample file. Show the connected file in Coach House. | “Drive access applies to files I explicitly choose. This is a separate connection from Calendar.” Capture the actual existing UI; do not disconnect Caleb's active Drive connection merely to obtain a clean recording. |

The order is flexible, but keep each consent sequence and its resulting feature
visible. Finish the Calendar rehearsal before recording the final take. If any
chapter is not working, fix it and record the real result before submission.

## Identity and capture settings

- App name: **Coach House**. Google project: **coach-house-496700**.
- Calendar OAuth client: **Coach House Calendar** (web).
- Public client ID: `74627119265-lhjpd79oj5oqlk85psat4r10skp11m9c.apps.googleusercontent.com`.
- Drive client: **Coach House Drive Documents**, public ID
  `74627119265-kkigf54jpg0ikg3u4o51e23t71ab8ci5.apps.googleusercontent.com`.
  Console confirms callbacks at `https://coachhouse.app/api/integrations/google-drive/callback`,
  `http://localhost:3000/api/integrations/google-drive/callback`, and
  `http://localhost:3010/api/integrations/google-drive/callback`. Port 3012 is not
  registered. No provider client settings were changed during this check.
- Sign-In client: **Coach House Web**, public ID
  `74627119265-hgjurfsatkqm8u30bcg9mvjsuhn1u3nd.apps.googleusercontent.com`.
  Console confirms JavaScript origins at `https://coachhouse.app`,
  `http://localhost:3000`, `http://localhost:3010`, and the existing Google-auth
  Vercel branch preview. No redirect URIs are listed on this client. Port 3012 is
  not registered. The local preview's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
  `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED`, `NEXT_PUBLIC_GOOGLE_LINKING_ENABLED`, and
  `NEXT_PUBLIC_GOOGLE_SIGNUP_ENABLED` are absent, as are its Drive client/redirect
  settings. Existing stored Drive connection status does not establish that a fresh
  local authorization can complete. Preserve the existing production encryption
  keys when preparing a Drive session; do not generate replacements.
- Show the app name and `client_id` in the consent-page address bar. Keep the
  authorization code, state, rapt values, passwords, and client secrets out of the
  shared edit. Preserve the evidence of the grant and successful return when
  obscuring sensitive query values. Do not record Cloud Console credential dialogs.
- Capture Chrome at readable size, around 1440×900 or 1920×1080. Keep the address
  bar visible, enlarge text if needed, and move notifications outside the capture.
- English voice narration or text captions are enough; use the short script above.
  No webcam, intro animation, music, or promotional editing is needed for this plan.
- Use only sample Calendar events and the supplied sample document. An unlisted
  video is accessible to anyone with its link, so review every frame before upload.

Apple's [screen recording instructions](https://support.apple.com/en-us/guide/mac-help/mh26782/mac)
cover selecting the recording region, microphone, and save location. The browser
tools used for preparation have not started a recording; the human operator starts
and stops the Mac recorder and completes the account-security screens.

Before pressing Record, use QuickTime **File → New Screen Recording** (or
Shift-Command-5), choose **Record Selected Portion**, and frame the prepared Chrome
content. Enable Do Not Disturb, choose the intended microphone and a local save
folder, and make a ten-second audio/readability test. Keep other application
windows, bookmark names, profile lists, private workspace cards and Console outside
the capture. Do not film the existing Southside workspace canvas: it exposes people
counts, program and financial data. The demo-only workspace is still a blocker.
Capture only the public OAuth client identifier when needed; obscure incidental
authorization query values during editing without obscuring requested permissions
or the successful return. Review the saved recording before any upload.

## Final review and upload

Check that every relevant client/consent flow and declared feature is represented,
including existing Sign-In and Drive. Match the exported Google scope list against
the video; do not silently omit a requested capability or remove production clients.
Do not claim Google's approval based on another developer's example video.

Suggested YouTube title: **Coach House — Google OAuth and Calendar Demo**.

Suggested description, to use only after all listed chapters are recorded:

> Coach House OAuth verification demonstration: Google Sign-In, personal Calendar
> selection and event import, sync controls and disconnect, optional export to an
> app-created calendar, and selected-file Google Drive access. Recorded using
> demonstration data. Google project: coach-house-496700.

After upload, use the video's normal watch URL in Console's **YouTube link** field.
Save and recheck the corrected scope justification from the
[verification plan](2026-09-09-google-calendar-verification.md). The reviewed public
privacy release and app-name appeal remain separate submission prerequisites.

Google's current [demo guidance](https://support.google.com/cloud/answer/13804565?hl=en)
requires the relevant consent flows and the features that use the requested access;
its [sensitive-scope guide](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
specifies English, app identity/client ID evidence, and an unlisted YouTube upload.
