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

---

# Documents redesign QA

## References

- Full library: `/Users/calebhamernick/Downloads/Screenshot 2026-08-27 at 8.57.37 PM.png`
- New menu: `/Users/calebhamernick/Downloads/Screenshot 2026-08-27 at 8.58.10 PM.png`
- Card hover and selection: `/Users/calebhamernick/Downloads/Screenshot 2026-09-04 at 1.24.55 AM.png`
- Filter menu: `/Users/calebhamernick/Downloads/Screenshot 2026-09-04 at 1.23.40 AM.png`

## Implementation captures

- Desktop final, 1942 x 1280 at DPR 1: `documents-implementation-qa-selected.png`
- New menu: `documents-implementation-new-menu.png`
- Filter menu: `documents-implementation-filter-menu.png`
- Mobile, 390 x 844 at DPR 1: `documents-implementation-mobile.png`

## Comparison

- Typography uses the product's Geist system treatment while preserving the required `Documents` title.
- The desktop content width, three-column card proportions, 20px grid gaps, rounded geometry, dark surfaces, and compact toolbar now track the references closely.
- The New and filter menus reproduce the reference grouping and hierarchy while using the repository's accessible shadcn primitives.
- Mobile collapses to one card column and keeps search, menus, filters, grid/list switching, and card selection usable.
- Dynamic organization content and the surrounding Coach House shell intentionally differ from the source images.
- No raster assets were required. Interface icons use Tabler; the Google Drive action uses the closest available brand glyph rather than a copied raster logo.

## Iteration history

- The first pass was too wide, with oversized columns, darker cards, and verbose dates.
- Reduced the surface to 61rem, set cards and menus to `#303030` in dark mode, tightened the grid to 20px gaps, and reduced dates to month and day.
- Kept menus at 18rem so labels remain readable without dominating the toolbar.

## Functional checks

- Search, All/Images/Documents tabs, source/file-type filters, reset, and recently deleted state update the visible library.
- Grid and list controls switch between the new card library and the existing detailed document table.
- Card open and selection actions work with pointer and keyboard input.
- New opens Google-native creation destinations; Upload files accepts multiple
  arbitrary file types through the organization library upload flow.
- Add from Google Drive uses the existing OAuth and authenticated Picker path.
- Desktop and mobile browser checks completed on `http://localhost:3000/organization/documents` with no console errors.

## Remaining variance

- P3: the Drive menu glyph is the available Tabler brand icon, not the reference's multicolor Google asset.
- The surrounding app shell and Notes rail are outside the selected `DocumentsBanner` surface.
- No P0, P1, or P2 visual or functional issues remain.

## Density correction

- User feedback identified the 61rem surface, 32px heading, and 18rem menus as oversized relative to the surrounding Coach House app.
- Reduced the surface to 54rem, the heading to 24px, desktop controls to 36px, menu width to 16rem, menu copy to 14px, and menu icons to 16px while retaining 44px mobile targets.
- Post-fix evidence: `documents-implementation-density-final.png` and `documents-implementation-density-menu-final.png`, captured at 1942 x 1280 and DPR 1.
- Browser measurements confirm an 864px surface, 24px heading, approximately 248px menu, and approximately 35px desktop menu rows.
- The source and revised implementation were compared together at full-view and focused menu levels. The revised controls preserve the source hierarchy without remaining visually oversized inside the product shell.

## Width refinement

- Reduced the surface from 54rem to 52rem in response to the follow-up annotation.
- Post-fix evidence: `documents-implementation-width-52rem.png`, captured at 1942 x 1280 and DPR 1.
- Browser measurements confirm an 832px surface with three equal 256px cards and no overflow or wrapping regression.
- The source and implementation were compared together at full-view level. Typography, color, imagery, copy, and interaction treatment are unchanged; only the requested horizontal density changed.
- Follow-up feedback reduced the final surface another 2rem, from 52rem to 50rem. Browser measurement confirms an 800px surface with three equal 251px cards and 16px gaps.

## Grid-gap refinement

- Reduced card spacing from 20px to 16px after the card-gap annotation.
- The selected full-card button remains unchanged; spacing is correctly owned by the parent CSS grid.
- Post-fix evidence: `documents-implementation-gap-16px.png`; browser measurements confirm 16px row and column gaps with equal 259px cards.
- Keyboard, pointer, focus, selection, and responsive behavior are unchanged.

## Equal-gutter refinement

- Reduced the final surface from 50rem to 45rem.
- Standardized the surface padding, toolbar-to-grid spacing, row gaps, column gaps, and bottom gutter at 16px.
- Removed the desktop 256px minimum card height so the narrower cards retain their intended near-square aspect ratio; the mobile minimum remains intact.
- Browser measurement confirms a 720px surface, 16px padding on every side, 16px row and column gaps, and equal 219 x 223px cards. Post-fix evidence: `documents-implementation-45rem-equal-gutters.png`.

## Card-content refinement

- Reduced card titles to 14px with 20px line height, file icons to 32px, dates to 12px, and the visible selection circle to 28px.
- Preserved a 44px mobile selection target and 32px desktop target around the smaller visual circle.
- Post-fix evidence: `documents-implementation-compact-cards.png`; keyboard, focus, pointer, selection, and open behavior remain unchanged.

## Toolbar-icon refinement

- Kept the filter, grid, and list button dimensions unchanged while increasing their icons from 16px to 18px.
- Replaced the funnel filter glyph with Tabler's horizontal-adjustments icon for a clearer distinction from file filtering content.
- Browser measurement confirms three unchanged 36 x 36px desktop buttons with 18 x 18px icons. Post-fix evidence: `documents-implementation-toolbar-icons.png`.

final result: passed

## Drag-and-drop and storage quota

- The complete Documents surface accepts file drags in edit mode and displays
  a focused dashed drop overlay without changing the 45rem layout.
- The New menu and drop target share the same multi-file upload handler. Files
  upload sequentially, appear immediately, and open through private signed
  URLs.
- A compact meter reports organization usage against 5 GB. Client checks give
  immediate feedback while the database serializes authoritative quota checks.
- Arbitrary MIME types are accepted. The existing 50 MB application limit and
  existing bucket-level file-size setting remain unchanged.
- Focused acceptance tests, scoped lint, structure, route, boundary, raw-button,
  isolated PostgreSQL RLS/quota testing, and the production build passed.
- The migration was not applied to shared Supabase, so a real upload was not
  performed from localhost during this branch-only iteration.

## Recently Deleted lifecycle

- Uploaded library files can be moved to Recently Deleted and restored from
  the card menu. The removal toast includes an Undo action.
- Recently deleted files remain private, cannot be opened, and continue to
  count against the organization’s 5 GB allowance for 30 days.
- Permanent deletion requires confirmation, removes the storage object before
  its metadata, and immediately reclaims quota.
- Expired files are purged in bounded batches when an editor loads Documents
  or starts an upload; a failed storage removal leaves metadata and quota
  intact for a safe retry.
- Focused acceptance, isolated PostgreSQL RLS/quota coverage, scoped lint, all
  repository guardrails, diff checks, and the production build passed.

## Final width correction

- Reduced the owned Documents surface from 45rem to 42rem while preserving the
  existing 16px card gaps and equal 16px outer gutters.
- Simplified empty storage usage from “0 B of 5 GB used” to “0 of 5 GB used.”
- Renamed the generated-source filter to “Strategic Roadmap” and replaced its
  wand glyph with the Waypoints icon.

## Inline Notes

- Removed the Documents-specific app-shell right-rail registration and placed
  Notes below the file library inside the 42rem Documents surface.
- Preserved note search, class filtering, expansion, empty states, counts, and
  module links.
- Restyled the section with the library’s muted card, 2rem radius, subtle ring,
  compact typography, and equal horizontal padding.
- Authenticated browser verification confirmed Notes renders inside the
  Documents region and the route has no build or console error.

## Multi-selection actions

- Selecting any card reveals compact Download and Delete buttons with a live,
  locale-neutral selection count above the grid.
- Once selection mode begins, the full-card action toggles additional cards
  instead of opening them. The explicit circular control remains available.
- Selected full-card buttons use a two-pixel white border, with the filled
  selection control providing a second visual cue.
- Batch actions reuse signed downloads, required-document removal, policy-file
  removal, Drive detachment, and uploaded-file lifecycle actions. Unsupported
  generated-roadmap selections leave the visible actions disabled.
