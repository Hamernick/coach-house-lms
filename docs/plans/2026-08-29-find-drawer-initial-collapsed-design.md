# Find Drawer Initial Collapsed State

## Decision

On mobile `/find`, initialize the public-map drawer at its existing collapsed
168px snap point. Keep the visible resize handle and preserve current behavior
that advances the drawer when the user searches, changes tabs, or opens a
resource, organization, or guide.

## Scope

- Change only the public-map drawer's initial search state.
- Keep detail-first rendering at middle height.
- Preserve all existing snap heights, drag behavior, desktop rail behavior,
  map camera inset handling, and homepage code.
- Add regression coverage for the initial snap index.
