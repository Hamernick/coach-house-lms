# Nonprofit Documentation Feature

## Ownership

- Content registry and pure navigation data:
  `src/features/nonprofit-documentation/lib/**`
- Public and authenticated documentation shells, rail, home, and article UI:
  `src/features/nonprofit-documentation/components/**`
- Composition-only routes: `src/app/(public)/documentation/**`

## Rules

- Text spacing follows `docs/design.md`: 4px within eyebrow/title/subtitle groups,
  8px before related content, and 16px between sections. Reuse `density.heading`
  from `documentation-density.module.css` for page, hero, sandbox, and Brand
  Identity heading groups. Do not add child vertical margins to that group;
  subtitle line height is 1.4. Keep this rhythm at every breakpoint and check
  the rendered gaps, including parent padding and wrapped lines.

- Keep all visible documentation public. Entitlements change surrounding account
  navigation, not article access or content.
- Publish only entries with live routes. Planned rail entries remain
  non-interactive until their complete page is ready.
- Keep public tools available without authentication or paid entitlements.
  Device-local drafts must identify their storage boundary and avoid claiming
  account sync.
- Keep Documentation compact: 24px index headings, 14px body copy, 32px desktop
  controls, and 28px desktop tabs. Article headers use centered 28px mobile and
  34px desktop titles, 15–16px subtitles with 1.4 line height, and sentence-case
  eyebrows. Sidebar group labels explicitly override the shared uppercase style.
  The feature-owned density CSS module applies
  through `DocumentationSurface` and the portaled Marketplace shortlist. Preserve
  44px mobile targets and 16px mobile input text; do not resize shared app primitives
  or generated Brand Identity artwork to change the documentation layout.
- Use `rounded-xl` for standalone containers, field groups, review panels, and
  table frames. Clip edge-to-edge child backgrounds at the container boundary;
  keep padding around interactive controls so focus rings remain visible. Apply
  the same corners to success, empty, and error states.
- Task-card images use a 16:9 frame, rounded asset corners, and an 8px inset at
  the top and sides. Keep captions compact. `DocumentationTaskCards` owns the
  grid and React Grab metadata while its card content remains server-rendered.
- Article, tool, and resource headers share `DocumentationPageHeader`, with four
  rounded image corners and an 8px inset. Headers use the abstract artwork family:
  blue for starting/building, rose for best practices, and warm yellow/peach for
  resources. Task cards use blurred blue, coral/peach, and lavender/rose backgrounds
  with a centered flat white graphic matching the destination: megaphone for campaigns, chart and coins for
  funding, and people/resource cards for the directory. Preserve strongly defocused
  color fields, restrained fine grain, and readable white graphics without shadows.
  Use original raster artwork without lettering or logos. Generated assets and
  exact prompts are documented in [assets/README.md](assets/README.md).
- Contents navigation uses `SectionRailIndicator`, shared with Core Documents.
  Preserve scroll tracking within the Documentation canvas, section deep links,
  browser history, and reduced-motion behavior. Keep header menus centered over
  the canvas and above its stacking context so every dropdown link is reachable.
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
- Render the library search once through `DocumentationShell`'s header slot,
  immediately beside Login in the public header and beside account controls in
  the account header. Use shared `SearchInput`: the submit icon belongs inside
  the same rounded field. Do not add a second search rail to page content.
  The header reads the search route's query so navigation, clearing, and browser
  history keep the field current; Marketplace filters remain independent.
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
