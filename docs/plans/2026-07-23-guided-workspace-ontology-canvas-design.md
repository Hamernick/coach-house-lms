# Guided Workspace Ontology Canvas

## Outcome

Turn the workspace graph into a guided operating path. Focus mode answers what
to do next; Map mode remains available for complete-system inspection. Primary
workspace cards never move.

## State and navigation

- Focus is the default and keeps one active root plus one canonical nested group
  path.
- Map exposes the complete graph without Focus dimming or synthetic summaries.
- `workspace-view`, `workspace-details`, and `workspace-groups` make mode and
  active path refresh-safe and compatible with Back and Forward.
- Root selection replaces the previous root. Group selection replaces the
  previous group path. Escape unwinds Map, group, then root state and restores
  keyboard focus.

## Information hierarchy

- Focus ranks blocked, missing, and in-progress work, then places up to three
  actionable siblings inside one compact list node per hierarchy level.
- Additional actionable and completed siblings become footer actions inside
  the list instead of separate canvas nodes.
- Accelerator lessons remain nested inside their source phase.
- Operational activity is sorted newest-first and capped at three visible
  records, with older records reported as archived.

## Layout and presentation

- Semantic depth maps to one x coordinate per root. Focus shows one list node
  per active level; Map keeps the complete group and action graph.
- Generated branches use collision-free vertical lanes with generous spacing.
- Focus lists use solid neutral surfaces with status communicated through
  icons, text, and borders. Map keeps distinct group and action nodes.
- Active paths use sky edges. Unrelated roots and sibling branches dim without
  changing coordinates.
- The canvas is `#fcfcfc` in light mode and zinc-800 in dark mode.
- Focus frames the active scene at readable zoom. Map fits the complete graph.
  User pan, zoom, or drag cancels pending camera work.
- Structural and cosmetic transitions stop under reduced motion.

## Verification

- Pure acceptance tests cover bounded Focus projection, priority order,
  summaries, complete Map projection, URL normalization, activity caps,
  Accelerator phases, strict depth alignment, and collision avoidance.
- Playwright tests cover Focus/Map visuals, exact canvas colors, active and
  dimmed paths, unchanged primary-card coordinates, Escape, Back/Forward,
  mobile framing, reduced motion, and production node bounds.
