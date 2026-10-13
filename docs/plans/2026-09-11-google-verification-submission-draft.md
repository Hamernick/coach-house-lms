# Google verification submission wording

Prepared 2026-09-11 18:38 UTC. These are review drafts, not saved
Google settings. Use them after the homepage-link fix is live and the user has
uploaded the actual reviewed recording. Do not use a placeholder video URL.

## Confirmed provider state

- Project: `coach-house-496700`; signed-in owner: `joel@coachhousesolutions.org`.
- App name: Coach House; branding verified; Calendar data access not verified.
- Homepage: https://coachhouse.app; Privacy: https://coachhouse.app/privacy;
  Terms: https://coachhouse.app/terms. Both policy pages are publicly live.
- Contact/support: joel@coachhousesolutions.org.
- Existing authorized domains: coachhouse.app and the existing Google-auth Vercel
  preview hostname. Neither was changed or removed during this review.
- Clients: Coach House Web, Coach House Drive Documents, Coach House Calendar.
- Declared scopes: openid, userinfo.email, drive.file, calendar.calendarlist.readonly,
  calendar.events.readonly, calendar.app.created. Google marks only
  calendar.events.readonly sensitive in this form; there are no restricted scopes.
- Video link is blank; Save is disabled. The saved justification has the inaccurate
  event-encryption sentence. The app-name appeal explanation is also blank.

## Sensitive-scope justification (794 / 1000 characters)

Coach House displays events from calendars explicitly selected by the signed-in user in that user's private agenda, alongside workspace board events. calendar.calendarlist.readonly lets the user choose calendars; calendar.events.readonly supplies titles, times, all-day dates and recurring occurrences that free/busy cannot provide. Stored Calendar data is restricted by server-side authorization; refresh credentials are encrypted. Imported personal events are not shared with organization members, published, or sent to AI providers. Users can pause sync or disconnect to remove the stored refresh credential and event cache. Existing Google-native events are not edited. Optional board export uses calendar.app.created to manage exported events in a separate calendar created by Coach House.

## App-name appeal (511 / 1000 characters)

Observed reason choices are **The finding is incorrect**, **I'm not able to fix
the issue**, and **Other**. Proposed choice: **The finding is incorrect**, once
the current anonymous homepage clearly presents Coach House and its legal links.
No option was selected during this review.

The application is named Coach House. The public page at https://coachhouse.app/ includes Coach House in its header and page title, and displays the Coach House logo. The resource map is part of the Coach House application. Our public Privacy Policy at https://coachhouse.app/privacy and Terms at https://coachhouse.app/terms also identify Coach House. The Verification Center currently states that our branding is verified. Please review the current homepage and clarify or clear the app-name mismatch finding.

## Final assembly after recording

1. Confirm the homepage visibly identifies Coach House, explains its purpose and
   links to Privacy (and Terms). Verify the published page without an account.
2. Review the real recording for all three OAuth clients and actual requested
   scopes, including the expected unverified-app warning for new Calendar access.
3. The user uploads the reviewed video as Unlisted and provides the watch URL.
4. Add that real URL and the corrected justification, save, and reload to verify.
5. Complete the remaining app-name appeal with the current page evidence, review
   the complete request, and submit at the planned submission step.

Audio is optional. Use English text captions if recording silently. Do not film
client-secret pages or credentials. This review did not restart OAuth, change
provider permissions, submit an appeal, or create/upload any video.
