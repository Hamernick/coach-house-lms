# Find Drawer Run 2 Design QA

## Comparison Target

- Source visual truth:
  `/Users/calebhamernick/Downloads/Screenshot 2026-08-20 at 10.24.37 PM.png`
- Rendered implementation:
  `/private/tmp/coach-house-find-run-2-search-mobile-dark-final.png`
- Combined comparison:
  `/private/tmp/coach-house-find-run-2-search-comparison.png`
- Viewport: 390 × 844 CSS pixels, dark color scheme, reduced motion.
- State: `/find`, full drawer, focused `food` query, progressive directory load.
- Source pixels: 1144 × 888. Implementation capture: 356 × 754 pixels.
  The combined comparison normalized the source to 356 pixels wide and compared
  its focused search region with the same-height implementation crop.

This QA is scoped to Run 2: search activation, ranked results, result density,
keyboard behavior, and progressive-loading feedback. Guide persistence and
claim intake remain intentionally deferred.

## Full-view Comparison Evidence

The implementation matches the target's focused-search hierarchy: a clear
search field and Cancel action, a single dark grouped result surface, compact
rows, circular category markers, one-line titles and metadata, and separators
that make scanning predictable. Coach House intentionally retains its existing
Find, Guides, and My Map tabs, category filters, search status, design tokens,
and truthful public data.

The first source row is represented by an actionable category shortcut. Direct
organization and resource results follow in the same grouped surface instead of
appearing as unrelated floating cards.

## Required Fidelity Surfaces

- Typography: existing Coach House type is retained with one-line, ellipsized
  result names and compact metadata.
- Spacing and density: 80px shortcut and result rows, aligned icon/title axes,
  consistent separators, and touch-safe controls.
- Color and surfaces: the grouped result surface uses a stable semantic
  background and subtle backdrop blur in both themes.
- Icons: existing category icons render as consistent circular markers rather
  than the prior nested square-and-circle treatment.
- Content: result metadata is limited to primary category plus location or
  online status. Search highlighting uses semantic `mark` elements.

## Findings and Comparison History

1. P2: The first implementation used a translucent grouped surface that allowed
   map colors to produce inconsistent row backgrounds.
   - Fix: switched the group to `bg-background/85` with backdrop blur.
2. P2: External-resource icons retained their old square shell and diverged from
   the target's simple circular markers.
   - Fix: rendered one consistent colored circle per result.

No actionable P0, P1, or P2 findings remain within Run 2 scope.

## Interaction, Accessibility, and Performance Evidence

- Arrow Up and Arrow Down move between native result buttons; Escape returns to
  the input, clears the query, then exits focused search.
- Cancel clears only transient search/category/context state and preserves saved
  My Map state.
- Result rows contain one primary native button; bookmark controls remain
  siblings rather than nested interactive elements.
- Partial indexing stays explicit through `available` and `Loading more…`
  status copy. Empty direct results do not hide matching category or guide
  shortcuts.
- Search normalization covers Unicode, punctuation, diacritics, and token order.
  Every token must match the weighted document, with exact-title ranking first.
- The warmed 5,000-item search stayed below 100ms in focused runs and has a
  250ms ceiling under the parallel full-suite load. The initial resource page
  was increased from 50 to 200 after local endpoint measurements; the fresh
  production build keeps `/find` within its 1,900KB route budget at 1,891.6KB.
- Browser coverage passed at 390, 768, and 1024 pixels, including drawer resize
  behavior. The focused mobile journey recorded no console errors.

## Final Result

final result: passed
