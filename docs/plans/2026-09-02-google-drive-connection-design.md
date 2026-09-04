# Google Drive Connection Design

## Objective

Let authenticated organization editors connect Google Drive from Workspace
Tools. File selection belongs to the future Documents redesign.

## Scope

- Request only `drive.file`, OpenID, and email scopes.
- Store refresh tokens server-side with versioned AES-256-GCM encryption.
- Keep OAuth state single-use, hashed, bounded, and tied to the initiating user.
- Expose only safe selected-file metadata to authorized organization members.
- Provide loading, disconnected, connected, revoked, unavailable, retry, and
  confirmed disconnect states in Workspace Tools.
- Keep Drive and map failures inside their narrow feature owners; do not modify
  the shared Alert primitive.

## Flow

1. Workspace Tools loads the editor-scoped connection state.
2. Connect creates a PKCE OAuth intent and redirects to Google.
3. The callback validates state and identity, encrypts the refresh token, and
   returns to `/workspace?drawer=tools`.
4. Disconnect revokes provider access best-effort, removes local credentials,
   and marks linked file records for reconnection.
5. The later Documents redesign requests a short-lived Picker token and stores
   only server-verified selected-file metadata.

## Failure Handling

- Provider failures use plain-language, bounded messages with a local recovery
  action and no credential details.
- A map load failure can recreate Mapbox without reloading the workspace.
- Location denial is nonfatal and never replaces an otherwise working map.
- Missing platform configuration explains that the surface is temporarily
  unavailable without exposing environment-variable names.

## Release Gates

- Reconcile the feature branch with current `main` while preserving its dirty
  work.
- Pass focused tests, RLS, repository guardrails, build, visual regression, and
  performance checks.
- Deploy once through one focused PR.
- Verify connect, reconnect, disconnect, and account deletion in an
  authenticated production canary.
- Retire the prior OAuth secret only after the replacement passes production.
