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
- Keep planner controls disabled until saved drafts finish loading. This also
  protects edits made immediately after hydration or browser back navigation.
- Library search lives at `/documentation/search?q=…`. Its explicit public
  corpus in `lib/search-documents.ts` includes authored guides, tool guidance,
  and Marketplace entries. Search results render on the server; never import
  this corpus into a client component or add private/account data to it.
- Preserve section IDs: search results and contents links use them as deep
  links. Keep article tool metadata shared between the renderer and index.
- Brand Identity text and settings persist in local storage; uploaded originals
  persist in IndexedDB and never leave the browser. Keep ZIP generation
  client-side and preserve the portable JSON, CSS-token, usage-note, and asset
  contract.
- Marketplace catalog entries require a direct official source, visible review
  and recheck dates, qualified cost language, and no ranking or endorsement.
  Shortlists stay in local storage and exports remain formula-safe.
- Community previews may project only safe fields from organizations already
  published on Map. Never expose private profiles, contact details, exact
  addresses, coordinates, source queues, or individual coach records without an
  explicit public-profile opt-in model.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep content/tool acceptance coverage in
  `tests/acceptance/nonprofit-documentation.test.ts` and search coverage in
  `tests/acceptance/nonprofit-documentation-search.test.ts`. Browser journeys
  and responsive baselines live in `tests/visual/documentation.visual.spec.ts`.
- Use primary sources and visible review dates for legal, tax, compliance, and
  financial claims.
