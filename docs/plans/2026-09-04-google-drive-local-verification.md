# Google Drive local verification

## Current checkpoint

- Documents and Drive tests pass locally; a signed-in provider canary remains open.
- Serving worktree: `coach-house-platform`, branch
  `chore/local-development-20260907`, port 3000, at `bb262360`.
- All eight Drive configuration variables remain absent locally as of September 9.
  Presence-only inspection checked seven distinct environment files across local
  worktrees and the current shell. No credential values were printed.
- The September 1 runlog records production-only Vercel secrets and independent
  password-manager copies. Their current provider state has not been reverified.
  The existing Vercel project link resolves to `coachhouse`, but the saved CLI login
  returned HTTP 403 for both account and project reads on September 9. Restore
  authorized access before inspecting provider settings or proposing key rotation.
- Browser runtime setup now succeeds, but discovery returned no attached browsers
  on September 9. Reattach through the supported app/browser flow; do not patch
  plugin files or extract browser sessions.
- The combined Documents/Calendar review lives in the isolated
  `chore/documents-calendar-integration-20260909` worktree without provider
  credentials. See [the integration review](2026-09-09-documents-calendar-integration.md).

## Before enabling localhost

This worktree uses the shared production Supabase database. A localhost OAuth
connection writes shared connection records; replacing or disconnecting that
connection can affect production. Obtain approval for the exact test account,
organization, and provider changes before a real canary. Fixture tests do not
need that access and must not be described as live verification.

1. Confirm the existing Cloud project and OAuth web client. Keep the existing
   `openid`, `email`, and `drive.file` scopes; do not request full-Drive access.
2. Verify both Google Drive API and Google Picker API are enabled in that project.
   The OAuth client and Picker app ID must belong to the same project; the app
   ID is the numeric project number, not its textual project ID.
3. Verify the exact OAuth redirect is registered:
   `http://localhost:3000/api/integrations/google-drive/callback`.
   Preserve production redirects; do not replace them.
4. Verify localhost is an approved origin/referrer for the selected credentials.
   Google currently documents the app referrer and `https://docs.google.com/*`
   for Picker's iframe, with API restrictions covering Picker and Drive.
   Propose any restriction changes explicitly before saving them.

These provider requirements follow Google's [Picker setup guide](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample?hl=en)
and [OAuth web-server guide](https://developers.google.com/identity/protocols/oauth2/web-server).

## Restore local configuration securely

Use the saved credentials, not chat messages or committed files. Confirm whether
the local environment file is a symlink before editing so other worktrees are
not changed accidentally. Restore the variables listed in the
[feature README](../../src/features/google-drive/README.md#server-configuration),
with the localhost callback above, then restart only this worktree's dev server.

Because the database is shared, the encryption key map and current version must
remain compatible with stored connections and other active deployments. Do not
generate a replacement key just to unblock localhost, overwrite an existing key
version, or remove older versions. Never print tokens or key values in logs.

## Approved signed-in canary

- Confirm the selected organization and Google account before granting access.
- Connect, return to the app, and select one explicitly approved test file.
- Confirm it appears in Documents, survives reload and grid/list switching,
  and opens the expected Google file with appropriate account access.
- Verify cancellation and provider errors leave existing files intact.
- Check authorization with an approved read-only organization member.
- Do not disconnect a shared account or delete the source Drive file as cleanup.
  Remove only the canary reference when explicitly approved.
- Record account/org scope, tested states, and remaining limits in the runlog;
  exclude credentials and private file contents.

This step does not authorize deployment, a new Cloud project, paid database
branches, public file sharing, or a scheduled trash-purge job.
