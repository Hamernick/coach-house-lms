# Google Drive Feature

Connection and Picker integration for Documents. User-selected Drive files use
`drive.file`. The document-import flow can export a selected Google Doc or read a
selected Word/Markdown file into an editable Coach House copy with a source link.
It does not enumerate a user's Drive or write editor changes back to Google.

## Ownership

- Domain logic: `src/features/google-drive/lib/**`
- Server actions/queries: `src/features/google-drive/server/**`
- API composition: `src/app/api/integrations/google-drive/**`
- Connection UI owner: `src/features/workspace-tools/components/google-drive-connection.tsx`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/google-drive.test.ts`.
- Keep OAuth credentials server-only and encrypted at rest.
- Keep connection management in Workspace Tools. File selection belongs to
  the organization Documents surface.

## Server configuration

- `GOOGLE_DRIVE_ENABLED=true`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI` ending in `/api/integrations/google-drive/callback`
- `GOOGLE_DRIVE_PICKER_API_KEY`, restricted to the Picker/Drive APIs and approved referrers
- `GOOGLE_DRIVE_PICKER_APP_ID`, the Google Cloud project number
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEYS`, a JSON map of key versions to base64-encoded 32-byte keys
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_CURRENT_VERSION`, matching the active key-map entry

Keep older key entries during rotation until existing refresh tokens are re-encrypted
or disconnected. Google Cloud provider enablement and redirect registration remain a
separate deployment step.

## Local verification

See [the local setup checklist](../../../docs/plans/2026-09-04-google-drive-local-verification.md)
before configuring localhost. The serving worktree uses the shared production
database, so a local connection can affect shared credentials and documents.

## Disconnect behavior

Disconnect removes this feature's stored credentials and marks Drive attachments as
needing reconnection; it does not delete Google files or revoke the Google project grant.
Google token revocation also affects Calendar and login grants in the same project, so
feature-level switches must not call it. Users can remove all Coach House Google access
from Google account permissions as a separate explicit action.

See [Google's token revocation contract](https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke).
