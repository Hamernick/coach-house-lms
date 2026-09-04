# Google Drive Feature

Connection foundation for a future Documents redesign. V1 links user-selected
Drive files through `drive.file`; it does not enumerate, copy, proxy, edit, or
download file contents.

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
- Keep connection management in Workspace Tools. File selection belongs to the
  future Documents redesign.

## Server configuration

- `GOOGLE_DRIVE_ENABLED=true`
- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI` ending in `/api/integrations/google-drive/callback`
- `GOOGLE_DRIVE_PICKER_API_KEY`, restricted to the Picker API and approved app referrers
- `GOOGLE_DRIVE_PICKER_APP_ID`, the Google Cloud project number
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEYS`, a JSON map of key versions to base64-encoded 32-byte keys
- `GOOGLE_DRIVE_TOKEN_ENCRYPTION_CURRENT_VERSION`, matching the active key-map entry

Keep older key entries during rotation until existing refresh tokens are re-encrypted
or disconnected. Google Cloud provider enablement and redirect registration remain a
separate deployment step.
