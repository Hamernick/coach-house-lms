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
- Keep Documentation compact: 24px page headings, 14px body copy, 32px desktop
  controls, and 28px desktop tabs. The feature-owned density CSS module applies
  through `DocumentationSurface` and the portaled Marketplace shortlist. Preserve
  44px mobile targets and 16px mobile input text; do not resize shared app primitives
  or generated Brand Identity artwork to change the documentation layout.
- Use `rounded-xl` for standalone containers, field groups, review panels, and
  table frames. Clip edge-to-edge child backgrounds at the container boundary;
  keep padding around interactive controls so focus rings remain visible. Apply
  the same corners to success, empty, and error states.
- Keep planner controls disabled until saved drafts finish loading. This also
  protects edits made immediately after hydration or browser back navigation.
- All 14 planners share `DocumentationToolFlow` and
  `useDocumentationDraftPersistence`. Preserve draft keys, sanitizers, calculations,
  and exports when changing steps. Keep inactive panels mounted, support browser
  history, and warn when browser storage is unavailable. Examples and templates
  require confirmation before replacing existing work.
- Guide/tool selection preserves existing section anchors; step selection lives
  in the URL. Ad Grants starters run only after an explicit action from
  `/documentation/tools/campaigns?template=ad-grants#sandbox`; never auto-fill or
  claim campaign results on arrival.
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
- Marketplace People separates the curated, explicitly authorized Coach House
  roster from published member profiles. The public people query selects only
  `is_public=true`, person-owned handles, and a minimal directory projection.
  Never infer coaching status from membership or publish private account data.
  Do not connect the roster to private booking records or invent availability.
- Marketplace resource details live at `/documentation/marketplace/[slug]`;
  new offers include source-backed terms and suggested workflows. Keep resource
  guides in the public search corpus and sitemap. Resource banks are verified
  as discovery sources, not as verification of every listing they contain.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep content/tool acceptance coverage in
  `tests/acceptance/nonprofit-documentation.test.ts` and search coverage in
  `tests/acceptance/nonprofit-documentation-search.test.ts`. Browser journeys
  and responsive baselines live in `tests/visual/documentation.visual.spec.ts`.
- Planner edit/export/reload, mobile themes, template replacement, storage
  failures, and history coverage live in
  `tests/visual/documentation-planners.visual.spec.ts`. Public-directory privacy
  and Marketplace workflow contracts have dedicated acceptance suites.
- Use primary sources and visible review dates for legal, tax, compliance, and
  financial claims.
