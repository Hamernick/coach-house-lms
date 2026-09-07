# Documentation search and refinement

Approved sequence: reconcile the dedicated documentation worktree with current
main, complete library search, validate core journeys, refine shared surfaces,
then prepare the result for review. Preview port: 3010. Preserve the active
catch-up worktree and its running port 3000.

## Search

- Public GET route `/documentation/search?q=…`, with canonical metadata and
  noindex for arbitrary result queries.
- One persistent search form across every documentation page. Native keyboard
  and link behavior, Cmd/Ctrl+K focus, mobile-sized controls, clear and empty states.
- Search only the explicitly published authored corpus: home, two foundations,
  eight Best Practices, eight Tools, and Marketplace. Rank exact titles before
  section headings and content. Return one result per page, an excerpt, and the
  relevant existing section anchor.
- Keep the index on the server. Never include account records, saved tool
  drafts, uploaded assets, Community projections, or unpublished resources.
- Treat the existing feature as the owner; search extends its public library
  rather than introducing a second feature or external provider.

## Functional gate

Verify corpus completeness, relevance, short acronyms, malformed queries,
section links, keyboard/mobile behavior, browser history, anonymous access,
account-state shell behavior, local persistence, reset, and exports. Run the
complete quality gate before beginning visual refinement.

## Design

Follow `docs/design.md`: restrained Geist typography, neutral semantic tokens,
4px spacing rhythm, clear hierarchy, consistent controls, and readable prose.
Refine shared search/navigation, home, article contents and reading layout,
interactive-tool framing, and Marketplace. Review a representative article and
tool before applying their shared layout throughout. Maintain existing content,
publication boundaries, calculations, and device storage.

## Delivery

Capture desktop/mobile and light/dark states, update intentional visual
baselines, rerun quality after refinement, and document exact evidence and any
remaining limitations. Local implementation and review preparation are
authorized; no production release is part of this work.
