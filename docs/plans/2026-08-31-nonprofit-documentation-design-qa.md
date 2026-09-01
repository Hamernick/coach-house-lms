# Documentation Design QA

## Comparison target

- Source visual truth:
  `/Users/calebhamernick/Downloads/Screenshot 2026-08-31 at 6.17.06 PM.png`
- First implementation capture:
  `/private/tmp/coach-house-documentation-home-2048x1150.png`
- Post-fix implementation capture:
  `/private/tmp/coach-house-documentation-home-final-2048x1150.png`
- Article capture:
  `/private/tmp/coach-house-documentation-mission-desktop.png`
- Source pixels: 3584 × 2010.
- First implementation pixels: 2048 × 1150.
- Post-fix and article pixels: 1792 × 952, limited by the connected browser
  window after the responsive viewport test.
- Comparison CSS target: 2048 × 1150, dark theme, device scale factor 1 for the
  implementation. The source was normalized from approximately 1.75× density
  to the target dimensions for the first full-view comparison.
- State: anonymous documentation home, dark theme, left rail open.

The OpenAI screenshot is a visual direction, not a product-shell clone. Coach
House intentionally retains its existing canvas frame, public authentication
actions, brand asset, theme control, and mobile rail behavior.

## Full-view comparison evidence

The source and first implementation were opened together at the same target
aspect and state. Both use a quiet black canvas, a narrow persistent left
documentation rail, high-contrast section labels, a centered editorial content
column, a large dark quickstart panel, and restrained dividers instead of a
dense dashboard card system.

The Coach House version deliberately replaces the source's global developer
header with the existing canvas header and rounds the content canvas according
to the shared shell contract. It also expands the page introduction into a
founder/operator proposition rather than copying the source's product title.

## Focused-region evidence

The left rail and quickstart panel are both readable in the full-view captures,
so separate crops were not required. The post-fix capture confirms stronger
planned-item contrast and a wider quickstart region. The Mission capture was
reviewed separately to verify article line length, heading hierarchy, stage
structure, active rail state, and desktop on-page contents.

## Required fidelity surfaces

- Fonts and typography: the project-standard Inter family matches the neutral
  documentation reference. Display headings use tighter tracking and clear
  weight changes; body copy stays within readable line lengths.
- Spacing and layout rhythm: the 15rem rail, existing 28px canvas, centered
  content, generous section spacing, and divided quickstart rows reproduce the
  reference's calm documentation density while following Coach House geometry.
- Colors and tokens: semantic dark-theme tokens remain authoritative. The
  quickstart panel uses zinc neutrals with one restrained amber Coach House
  accent; contrast remains clear across headings, body copy, and planned items.
- Image and asset fidelity: the reference contains no content imagery. The
  implementation reuses the existing Coach House logo assets and the project's
  installed icon set; no placeholder or code-drawn image substitutes were
  introduced.
- Copy and content: all visible copy is nonprofit-specific, stage-specific, and
  honest about planned pages. Brand Identity is labeled as design-reserved and
  is not exposed as a dead link.

## Interaction and accessibility evidence

- The browser-rendered home exposed working Home, Quickstart, Key concepts,
  Mission, and Map links.
- Signed-in shells expose Documentation through the existing shared resource
  slot, while the documentation rail occupies the same single rail below the
  account-aware global navigation.
- The primary `Start with mission` action navigated to
  `/documentation/best-practices/mission` and rendered the complete article.
- The article exposed one H1, ordered H2/H3 structure, breadcrumbs, stage
  regions, a checklist, primary-source links, and an on-page contents nav.
- Planned items are non-interactive rather than dead links.
- The shell provides a skip link, visible focus styling, semantic links, and a
  single native article scroll owner.
- Browser console errors checked after the home-to-Mission journey: none.
- The connected browser's mobile viewport capture became unavailable after the
  desktop comparison. Mobile structure remains inherited from the tested public
  sidebar sheet and uses responsive single-column layout classes; a fresh
  mobile visual capture remains a release-level follow-up, not an observed
  visual defect.

## Comparison history

### Pass 1

1. P2: the 1180px home container left too much empty canvas on a 2048px desktop
   and made the quickstart panel materially narrower than the source.
   - Fix: increased the home container to 1400px while retaining narrower text
     measures inside it.
2. P2: planned rail items used reduced foreground opacity and were harder to
   scan than the supplied section-navigation reference.
   - Fix: restored the standard muted-foreground token while keeping the items
     non-interactive.

### Pass 2

The post-fix capture shows the quickstart panel using the available canvas more
confidently and every rail title remaining legible. No actionable P0, P1, or P2
visual differences remain. Dev-only React Grab and Next.js controls are local
verification overlays and are not product UI.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- Capture 390px and 768px screenshots in a fresh browser session before the
  release PR's visual-baseline decision.
- Revisit documentation search after enough live articles exist to produce
  useful results.

final result: passed
