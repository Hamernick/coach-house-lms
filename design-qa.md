# Workspace Ontology Design QA

- Source visual truth: `/Users/calebhamernick/Downloads/IMG_2411 2.PNG`
- Initial implementation evidence: `/Users/calebhamernick/Downloads/Screenshot 2026-07-19 at 11.19.19 AM.png`
- Previous implementation evidence: `tests/visual/workspace-ontology.visual.spec.ts-snapshots/workspace-ontology-board-dark.png`
- Current implementation evidence: `tests/visual/workspace-ontology.visual.spec.ts-snapshots/workspace-ontology-board.png`
- Viewport: 1184 × 672 CSS pixels for the rendered comparison fixture
- State: dark theme, two expanded managed roots, six generated nodes, one cross-area relationship

## Previous full-view comparison

The reference and revised fixture were inspected together. Both now use a left-to-right dependency graph: sources on the left, successive work columns on the right, vertically stacked siblings, orthogonal connectors, compact dark cards, and restrained edge treatment. The initial implementation instead placed roots above descendants, spread siblings into long horizontal rows, and added redundant colored side rails.

## Focused comparison

- Typography: the existing Geist/shadcn type system remains slightly tighter than the reference, but preserves the same title/meta hierarchy and truncates long real-world values within measured bounds.
- Spacing and layout: managed roots share a left lane; every tested child begins to the right of its root; dense 120-node and six-domain graphs remain collision-free.
- Colors and tokens: neutral product tokens replace decorative category rails. Status still uses icon, color, and text together.
- Image quality: generated ontology nodes contain no raster imagery. Existing primary workspace cards retain their real product imagery; no placeholder or code-drawn assets were added.
- Copy: directional fixture copy now says connected work continues to the right.
- Icons: existing product icon components remain optically centered in restrained tiles.
- Behavior and accessibility: selection actions, keyboard labels, 44px action targets, reduced motion, truncation, and non-color status cues remain intact.

## Comparison history

### Pass 1: blocked

- P0 — Expanded branches overlapped primary cards and each other.
- P1 — Graph depth ran downward while siblings formed spreadsheet-like horizontal rows.
- P1 — Colored category rails duplicated meaning and dominated the compact cards.
- P2 — Relationship labels appeared too early and competed with node titles.

Fixes applied: changed ELK and Dagre to rightward ranks, replaced dense row wrapping with bounded vertical sibling columns, stacked expanded root scenes into collision-free horizontal lanes, moved root and node handles to right-to-left routing, removed category rails/dots from generated nodes, and reserved relationship labels for full detail.

### Pass 2: passed for the previous implementation

The revised dark fixture matches the reference's horizontal graph grammar. Automated geometry checks found no node overlap, no child left of its root, no content escaping measured cards, and no ontology accent rail.

### Pass 3: passed for the current rendered fixture

- Changed the live scene contract after Pass 2: root controls now sit in measured normal flow; generated nodes use one 64px height; all visible primary roots join a temporary horizontal open scene; node and edge presence transitions are coordinated; and the camera includes the complete settled graph.
- Removed a confirmed drag snapback caused by collapsed roots receiving stale managed coordinates. Transient pointer positions now stay outside React render state, scene positions commit once, and generated edges are hidden during transform interpolation so they cannot visibly detach from moving cards.
- Active dragging cancels pending automatic fitting. Static performance coverage verifies that active position changes do not enter controlled React state.
- Dark relationship labels now use compact token-based glass pills with a full radius, consistent 8px by 4px padding, restrained border/shadow, and an explicit darker translucent blur treatment.
- Cross-area links use dedicated bottom source and target handles, creating a label corridor below the cards. Rendered geometry verifies that the label intersects neither a node nor a root expansion control.
- Expanded multi-root scenes now wrap within a 4,800px layout band instead of becoming an unbounded horizontal strip. Combined six-root, nine-person, and two-utility geometry coverage verifies collision-free placement, while People connects only to staff-tree roots instead of duplicating every report-to edge.
- Added rendered geometry and interaction coverage for toggle containment, horizontal atomic scenes, clear label corridors, paired node/edge exits and entrances, restored saved positions, and complete-scene camera fitting. All seven focused light, dark, transition, and bounds visual tests pass.
- The local fixture route is verified. The authenticated production workspace remains unverified because the current Chrome connection exposes no browser instance.

### Pass 4: removed the floating ontology control panel

- Removed the canvas overlay, search/filter/help/structure/undo runtime, feature export, fixture mount, and obsolete visual baseline.
- Root-card branch toggles remain the only structure controls. Selecting a generated node still exposes expansion, pinning, and exact-destination actions in its contextual toolbar.
- The canvas now presents only the ontology itself, without a floating card competing with primary content.

## Residual P3 polish

- A final authenticated screenshot with the user's full production-sized data set would validate the exact content density, but the same layout engine passed 120-node and six-domain collision coverage.

final result: passed for the deterministic fixture; authenticated production-data validation pending
