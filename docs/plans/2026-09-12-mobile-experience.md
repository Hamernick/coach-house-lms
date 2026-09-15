# Mobile experience refresh

Branch: feat/mobile-experience-20260912, isolated from origin/main cb9287b1.

## Direction

Keep Coach House's neutral visual language and desktop composition. Improve the
shared mobile shell first, then the main Workspace, Calendar and form surfaces.
A cosmetic-only bar would leave wasted width and hidden content; a separate native
app would add another platform. Adapt the requested expo-glass-tabs interaction
pattern for the existing web application instead.

## Changes

- Scaffold mobile-navigation: floating glass, sliding highlight, release-to-select
  scrubbing, scroll compaction, keyboard avoidance, safe area and reduced motion.
- Shell: Find, Workspace and contextual Details in the bottom bar; Menu opens from
  a 44px button at the top left. Coaching remains available from the sidebar.
  Preserve onboarding and role visibility; remove double horizontal gutters.
  Content extends behind the floating bar. Clearance belongs inside scrolling
  content, not in a fixed footer strip; canvas controls sit above the bar.
- Public header: larger section links, remove duplicate mobile Build action.
- Workspace: open data sections at full canvas height on phones, retain canvas and
  desktop preferences; larger horizontally scrollable section tabs and labeled Cards.
- Calendar: wrap the crowded month header and enlarge previous/next/create controls.
- Shared forms/overlays: larger inputs, bounded scrolling dialogs, full-width sheets,
  reachable close controls and roomier mobile sidebar navigation.

## Verification

Check real Workspace and public Build at phone widths. Add behavior coverage for
route matching, canceled drags, tap/scrub navigation, dialog dismissal, keyboard
navigation, scroll compaction and layout at 320/390/768/1440 in light/dark modes.
Run repository checks and record actual results before claiming release readiness.
No publishing or production changes are part of this local design pass.

Reference: https://github.com/davidmokos/expo-glass-tabs (MIT). Original DOM/CSS
adaptation; no native Expo dependency or claim of native iOS glass/haptics.

## Completed checks and review

- All 2,301 acceptance tests passed (one existing skipped test); the affected shell
  and navigation tests were rerun after lazy loading changed.
- Ten new mobile browser checks passed, covering 320/390px light/dark snapshots,
  touch target dimensions, tap and keyboard navigation, browser back, pointer
  scrubbing/release cancellation, single action activation, scroll compaction,
  long-form scrolling/dismissal/focus return and desktop hiding.
- Three existing public Build browser checks passed. Only the intentional mobile
  Build screenshot changed; desktop baseline retained. Input snapshots refreshed
  for the mobile input-height change; all three input states remain covered.
- Real signed-in Workspace reviewed at 320/390px: five navigation hit areas are
  at least 56px high, labels fit; Menu and Calendar close reopen navigation correctly.
  Coaching, expanded Workspace sections and Calendar month changes reviewed.
- The compiled-preview review found that an initially restored section could be
  offscreen because its tab measurement ran before the drawer portal mounted.
  The measurement hook now belongs to the mounted tab view, and brings the active
  tab into view after mounting or resizing while allowing manual horizontal scroll.
  Verified in the final compiled preview: restored Accelerator stays fully visible
  at 390px and after resizing to 320px, with no horizontal page overflow. Its 11
  focused acceptance checks and lint passed; final build and budgets passed again.
- Fixed Vaul 1.1.2 not forwarding modal=false to its Radix root with a scoped,
  controlled nonmodal Dialog root. Verified outside navigation becomes accessible.
- Removed forceMount from the mobile Calendar modal so closing it removes the
  hidden modal's accessibility effects. Desktop popover retention is preserved.
- RLS sub-suites passed; the legacy hosted test runner passed under installed Node
  22 after pnpm's Node 20 runner failed on missing native WebSocket support.
- Final production build and its TypeScript check passed using Node 22. The mobile
  navigation loads only on phones through React.lazy, keeping desktop bundles
  within budget. Final performance checks passed: public home 1819.4/1975KB,
  community 607.4/900KB and admin 996.2/1000KB.
- Broad standalone tsc also checks tests and reports 143 diagnostics in 40
  untouched test files, with none in application source. The full quality command
  stopped at the Node 20 legacy RLS runner; the successful Node 22 retry, final
  build and performance checks were run separately. The full visual suite was
  not run; the 13 relevant mobile/public checks passed.
- Original root work and Google homepage branding work remain separate. No commit,
  push, PR, merge, production feature activation or deployment.

## Preview and scope

The live development preview runs at http://localhost:3017/workspace at phone
width so subsequent design adjustments update without repeated full builds. A desktop iframe wrapper was
removed because the app intentionally escapes embedded frames; that existing
protection remains intact. This is a first mobile pass across shared foundations
and primary flows, not a redesign of every individual admin or billing screen.
Physical iOS keyboard, safe-area and native-device performance checks remain for
release QA. The glass effect is the browser fallback, not native UIGlassEffect.


## Latest review: remove the footer backdrop

- Removed the shell's fixed mobile footer clearance. Normal pages reserve space
  at the end of scrolling content; Workspace uses its nested scroll panes and
  retains its existing canvas gutter layout. Canvas controls keep their prior
  screen position above the floating bar. The dock itself remains transparent.
- Workspace scrollers reserve 88px plus the safe area internally. Mobile
  Accelerator content no longer shrinks into that reserved space; its existing
  overflow detection still controls scroll fading.
- Final live Workspace measured content ending at the viewport bottom: 844px at
  390px width and 700px at 320px width. Last visible lesson controls can scroll to
  746.75/602.75px, above the bar's 764/620px top. No horizontal page overflow.
- Final focused lint and 32 acceptance checks passed. Ten mobile browser checks
  passed during this iteration; their existing screenshots already show content
  behind the bar and remained unchanged. Production build/performance passed at
  the compiled checkpoint before the last nested-scroll adjustment. The latest
  source is reviewed in dev; full release qualification remains outstanding.


## Mobile map follow-up

- Stable 8px mobile map gutters on all four sides from initial render, rounded/inset authenticated map,
  tighter notification spacing, and smaller search placeholder.
- Original compact Welcome styling retained. Mobile order is location, Active,
  Welcome, degrees; location/Active form a left group, Welcome stays at the exact
  screen center when space permits, and degrees align right. All four share one height. Active keeps
  its label, dot, and count in a single row with normal padding and text size.
  All controls stay on one row; Welcome shifts only as far as necessary to
  accommodate the natural-width left group on narrower screens.
  Welcome keeps its original label and book icon in both toggle states.
- Explicit map/drawer/menu layering; full drawer hides controls, and the map
  drawer no longer locks header or React Grab interaction.
- Mobile Welcome uses the shared dialog portal, centered in the viewport above
  the bottom navigation, with a compact 320px/448px size cap, a blurred backdrop,
  viewport height limits and focus restored on close.
- Review with React Grab enabled: http://localhost:3017/?reactGrab=1.
- Focused regression coverage includes server-rendered versus hydrated geometry,
  control collisions at 320/390px, menu hit-testing, expanded drawer visibility,
  and existing light/dark loading snapshots. Full release qualification pending.
