# Google OAuth verification: continuous take

## Desktop recording checkpoint — 2026-09-11 21:31 UTC

The user moved the demo tabs into a separate Chrome window and minimized all other
windows, including Terminal. Preserve that arrangement. The review movie should
be saved directly to `/Users/calebhamernick/Desktop/Coach House OAuth Review.mov`
(use a timestamp suffix if a file already exists). The user still owns upload.

Native macOS `screencapture` supports silent video output and a direct file path;
this provides a recording route despite the absent desktop Computer Use plugin.
However, both native Screen Recording preflight checks returned false. A still
capture contained wallpaper rather than the visible app windows. Requested the OS
permission and opened Privacy & Security → Screen Recording; access was still
false at that checkpoint. No video was started or created.

Next: user grants the requested recording permission, recheck native access, hide
System Settings, verify the isolated Chrome window in a still capture, then start
the continuous take. Keep microphone/audio disabled. Do not capture Supabase or
Cloud Console administration screens: the verification video needs the real OAuth
consent flows and the app features using each requested scope.

Use caleb@bandto.com and the Southside Community Table sample workspace.
Record one walkthrough with normal tab changes. Do not start OAuth during setup.

## Before Record

- Six Chrome tabs are retained: public homepage, local Tools, Google Calendar
  September 2026, private Drive sample, local Documents, local Calendar panel.
- QuickTime is open. Use Shift-Command-5, Record Selected Portion, microphone None,
  and Do Not Disturb. Include the Chrome area and the Google sign-in popup; keep
  Joel's Console and other windows outside the region. Save under
  `/Users/calebhamernick/Desktop/Coach House OAuth Review.mov`.
- An optional short readability check is separate from the final continuous take.
- After OS permission and framing are verified, the agent can launch the native
  silent recorder to the Desktop path. Account-security prompts may need the user.

## Click order

1. **Homepage and identity.** Show coachhouse.app and its Privacy/Terms links below
   the NFP claim prompt. Briefly show the Google sections in Privacy.
2. **Google Sign-In.** Switch to localhost:3000 Workspace. Use the account menu to
   sign out, then choose Google Sign-In and caleb@bandto.com. Return to the same
   Southside workspace. This does not disconnect Calendar or Drive. Refresh other
   local feature tabs after signing back in if their session view changed.
3. **Calendar consent.** Show the connected Tools row. Open the header Calendar,
   Manage Google Calendar, Disconnect, and confirm. Turn the Tools Calendar switch
   on, choose Continue with Google, and complete account selection and every
   requested permission. The operator handles account-security screens if needed.
4. **Import.** Select only Coach House Demo; leave board export off initially.
   Save and sync. Show September 10 timed, September 11 all-day, and September 14
   recurring events with Google / Only you labels. Compare with the Google tab.
5. **Refresh and pause.** In Google, rename only the sample planning event from
   `Demo: Planning review (updated)` to `Demo: Planning review (recorded)`.
   Use Sync now in Coach House and show the new title. Pause the Tools switch,
   show imports hidden, then resume and show them return.
6. **Optional export.** Enable Export this workspace's board events; Save and sync.
   Show the existing separate Coach House — Board calendar in Google and sample
   September 10 reporting deadline / September 16 all-day board meeting. Reuse the
   existing destination and mappings; do not create or delete another calendar.
7. **Drive consent and file use.** In Tools, switch Drive off and confirm its local
   disconnect, then switch it on. Complete Drive's real account/consent flow.
   Documents → New → Add from Google Drive → select coach-house-drive-demo.md.
   Re-selecting this file updates its existing reference rather than duplicating it.
   Open it and compare the original Google file. Optionally show the existing Vision
   copy/source link and its saved Coach House-only edit; do not re-import over it.
8. **Finish.** Show Tools with both connections working, then stop the recorder.
   Keep the final file local for review; the user uploads only after review.

## Review before upload

- Show real consent and results for Sign-In, Calendar and Drive. Never imply the
  broad calendar scope or writes to the user's original calendars.
- Mask unrelated calendar/account names, account-selector alternatives and incidental
  OAuth query values. Keep app identity, requested permissions and successful returns
  readable. No Console secrets, passwords, keys or tokens belong in the video.
- Explain selected private imports, optional writes to the app-created calendar,
  selected-file Drive access and independent connection controls with English captions.
- Review the actual footage, then the user uploads Unlisted. Add its real URL and the
  prepared corrected scope/appeal text to Google's verification form afterward.
