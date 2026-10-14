# Workspace support text and roadmap error

User direction, October 14: remove the unwanted support/session text, roll that out as the first patch, then address the reported roadmap editor error separately. Keep the existing workspace support feature. This revises Run04A's textual presence presentation without removing authenticated presence or support access.

## Patch 1 — remove the two unwanted text rows

Source: `src/features/organization-workspace-support/components/organization-workspace-support-panel.tsx`.

Delete the temporary-workspace status paragraph and the separate staff viewing/editing roster paragraph, plus their unused derived roster variable. Do not replace the text with another banner. Keep the support controller mounted: its authenticated presence is needed for support writes. Preserve same-page cursors, access checks, workspace switching, editing and actionable error feedback. The shared component covers the normal sidebar header and the admin/dashboard fallback placements.

Branch: `fix/workspace-support-copy-20261014` in isolated `coach-house-platform-support-copy-20261014`, base `dc95147a` (includes the Coaching access fix). Preserve the separate coediting checkout/localhost3124 and the dirty root.

Actual-app review: `http://localhost:3126/workspace`, with support/collaboration flags enabled in this process only. User tests their existing temporary workspace in the authenticated browser. No synthetic preview or agent walkthrough. No schema, grant, membership, feature-flag/provider configuration or workspace content changes are required.

Validation: existing workspace support search/scope/authorization checks, changed-source lint, feature/import boundaries and diff hygiene. Confirm the two rows are absent while switching and live cursors still work. Update visual references only after user review and only if an affected approved CI fixture requires it. Keep this a small independent PR; release requires current-head hosted quality/code-owner checks and production verification. Existing unrelated bundle/visual failures remain release blockers rather than being hidden or bypassed.

## Patch 2 — roadmap server/client boundary

Reported URL: https://coachhouse.app/workspace/roadmap/fundraising-strategy?returnTo=%2Fworkspace%3Fdrawer%3Ddocuments&write=1

Reported error: `Cannot access textAlign on the server. You cannot dot into a temporary client reference from a server component. You can only pass the value through to the client.`

Route owner: `src/app/(dashboard)/workspace/roadmap/[slug]/page.tsx`, composing `src/components/roadmap/strategic-roadmap-editor-page.tsx`. The collaborative editor sends `pending.steps.map(step => step.toJSON())` in `src/features/organization-document-collaboration/hooks/use-organization-document-collaboration-controller.ts`; server actions recreate and serialize documents using `lib/schema.ts`, including TextAlign. This is a candidate boundary, not a reproduced root cause. Unauthenticated page access does not establish the authenticated error.

After patch 1 is released:

1. Reproduce opening/editing the exact URL in the user's temporary workspace and capture the failing server-action stack. Distinguish initial page render from presence, initialization and save requests.
2. Inspect the actual client action payload, especially ProseMirror node/mark attribute objects and their prototypes. Verify whether any object is encoded as a React temporary client reference.
3. If confirmed, normalize and validate the wire payload as plain serializable document data before the action call; retain server schema validation, stale-write guards, actor/organization scope and stored content. Do not convert the entire route to a client component or suppress the error.
4. Add focused regression coverage for actual aligned text/marks and action serialization, then verify the exact authenticated page, edits, persistence after reload and relevant history/collaboration behavior. Avoid changing production documents during automated diagnostics.
5. Release as its own reviewed patch after required checks. No database migration or document rewrite is assumed.

## Checkpoint

Patch 1 code is implemented locally: five runtime lines removed; README reflects the updated presentation. All 18 existing support acceptance cases, changed-source ESLint, feature and import-boundary checks pass. Actual user review, PR/hosted release evidence and production rollout remain distinct. Patch 2 has not been implemented or claimed fixed.
