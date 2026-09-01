# Nonprofit Documentation Feature

## Ownership

- Content registry and pure navigation data:
  `src/features/nonprofit-documentation/lib/**`
- Public and authenticated documentation shells, rail, home, and article UI:
  `src/features/nonprofit-documentation/components/**`
- Composition-only routes: `src/app/(public)/documentation/**`

## Rules

- Keep all visible documentation public. Entitlements change surrounding account
  navigation, not article access or content.
- Publish only entries with live routes. Planned rail entries remain
  non-interactive until their complete page is ready.
- Keep public tools available without authentication or paid entitlements.
  Device-local drafts must identify their storage boundary and avoid claiming
  account sync.
- Brand Identity text and settings persist in local storage; uploaded originals
  persist in IndexedDB and never leave the browser. Keep ZIP generation
  client-side and preserve the portable JSON, CSS-token, usage-note, and asset
  contract.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/nonprofit-documentation.test.ts`.
- Use primary sources and visible review dates for legal, tax, compliance, and
  financial claims.
