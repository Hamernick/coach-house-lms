# Organization Programs tab

## Authorized scope

Caleb requested a Programs tab on individual `/organizations` pages so coaches/admins can view and edit programs already added by the organization. Continue in `fix/task-dialog-document-scroll-20261003` with accepted scrolling fixes and optional fiscal-tab changes preserved. No new branch, server, migration or live customer edit.

## Design and implementation

- Show Programs after Overview only when the viewed organization has saved programs. `/projects` stays unchanged. Load private and public programs for the resolved organization owner ID, not the signed-in user's active organization.
- Reuse existing ProgramCard and ProgramWizard. Cards show saved summary, status, media, schedule/location and funding details; View / edit opens the shared full builder. Existing autosave and final update controls remain. Creating/deleting programs from staff pages is outside this request.
- A shared staff access resolver requires the Organizations platform capability and checks existing coach assignment/visibility scope. Reads, updates and media uploads use the selected organization only after that check. Nonstaff, invalid targets and out-of-scope coaches are denied. Ordinary member editing keeps its active-organization path.
- The shared update action accepts an optional explicit staff target, scopes program reads/writes to its owner, preserves snapshot merge and request-version checks, and invalidates organization detail plus existing member/public views. Uploads use the same scope check and store media under the selected organization's prefix. Existing post-write media cleanup remains.
- Opening the editor performs no autosave. Edits serialize through a save queue; staff saves send only fields changed since the last successful save. This preserves legacy values the wizard does not represent exactly (including end dates), untouched fields and unknown snapshot keys. Reverting a saved change produces another patch.
- Loading errors remain errors rather than implying the organization has no programs. Save errors use existing toasts; the builder remains available. No realtime editing or public publishing redesign.

## Evidence and review

- Existing program persistence, activity flow, media and project detail suites: 44 tests passed. New organization staff suite: 10 passed, covering role/scope denials, private data, target ownership, write conflict/missing rows, admin access, scoped uploads, changed-field preservation and conditional tab visibility.
- One focused browser case answers whether viewing the builder writes data: opens sample Programs, opens the actual builder, verifies the stored name, waits beyond the 700ms autosave debounce, observes zero action requests, then closes. All mutations are blocked by the browser test. Existing protected fixture/runner/server reused; no extra review surface or infrastructure.
- Changed-file ESLint, structure, import boundaries, route contract, interaction locks and diff hygiene pass. TypeScript reports the same 122 pre-existing acceptance-test errors and zero application/new-test errors (`/tmp/coach-house-org-program-types.log`). Required hosted quality and branch-protection gates remain pending.
- Review actual localhost:3000/organizations → an organization with programs → Programs → View / edit. Authenticated live save/reload remains user review; no live customer write was used as test evidence. Only localhost:3000 runs from this worktree. No commit/push/PR/deployment.
