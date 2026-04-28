# Apr 24 2026 PDF Image Report

Source: `/Users/calebhamernick/Downloads/Apr 24, 2026 (1).pdf`

Extraction result:

- 13 PDF pages.
- 22 embedded screenshot/image blocks.
- Extracted image crops are in `/tmp/apr24_2026_1_images`.
- Contact sheet is `/tmp/apr24_2026_1_images_contact_sheet.png`.

## Important Corrections

- Do not remove Brand Kit based on this PDF. User said to ignore that item.
- Do not work on the onboarding/account close `X`; user said it is already fixed.
- Do not remove the “Would you pay $20/month…” prompt globally. The issue is only that it must not appear in the wrong places.
- The `/find` organization setup overlay was possible before the Batch 4 fix:
  - `src/app/(public)/find/page.tsx`
  - `src/app/(public)/find/[slug]/page.tsx`
  - `src/components/public/public-map-index/member-onboarding-overlay.tsx`
  - `src/features/find-map/server/viewer-state.ts`

Previous `/find` overlay behavior:

- `fetchPublicMapViewerState()` sets `needsMemberOnboarding` when `onboarding_completed` is false and `onboarding_intent_focus` is `find`, `fund`, or `support`.
- The public `/find` pages rendered `PublicMapMemberOnboardingOverlay` over the map when `needsMemberOnboarding` was true.
- `PublicMapMemberOnboardingOverlay` wraps `OnboardingWorkspaceCard`, so an organization setup/onboarding card can appear over `/find`.

## Screenshot Inventory

| Image | PDF page | What is visible | Referenced surface / concern | Likely repo files |
|---:|---:|---|---|---|
| 01 | 1 | Accelerator module viewer header: progress pill `3 of 3`, previous/next arrows, close `X`, top utility icons. | End-of-module navigation. The `>` button should not route to unrelated lessons, and may need to hide/disable on final item. | `src/features/workspace-accelerator-card/components/**`, `src/features/workspace-accelerator-card/hooks/**`, `src/features/workspace-accelerator-card/types.ts` |
| 02 | 2 | Onboarding pricing step, “Unlock the builder workspace”, Organization `$20`, Operations Support `$58`, yellow checkout error, disabled finish. | Free/early-access and checkout error path. | `src/components/onboarding/onboarding-dialog/components/pricing-step.tsx`, `src/components/onboarding/onboarding-flow.tsx`, `src/app/api/stripe/**`, `src/lib/onboarding/**` |
| 03 | 3 | Same onboarding pricing step and checkout error. | Paid tier checkout/entitlement ambiguity after failed or partial checkout. | Same as image 02 plus `src/lib/accelerator/billing*.ts`, `src/lib/billing/subscription-access.ts` |
| 04 | 4 | Workspace tutorial card: “Welcome to Workspace”, step 3/6, “The Accelerator” intro card with Hadiya’s Promise Foundation org card. | Reword accelerator intro copy; clarify tutorial content. | `src/features/workspace-canvas-tutorial/**`, `src/components/onboarding/onboarding-workspace-card.tsx`, `src/app/(dashboard)/my-organization/_components/workspace-board/**` |
| 05 | 5 | Workspace tutorial “Classes” step with Accelerator checklist and “class track” copy. | “Picker” terminology / class-track explanation. | `src/features/workspace-accelerator-card/components/workspace-accelerator-header-picker.tsx`, `src/features/workspace-canvas-tutorial/lib/index.ts` |
| 06 | 5 | Workspace tutorial “Modules” step, black arrow, Accelerator module list starts with Organization setup. | Instruction references missing Welcome module; tutorial arrow/lockup. | `src/features/workspace-canvas-tutorial/**`, `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/**`, `src/features/workspace-accelerator-card/components/**` |
| 07 | 6 | Member workspace/project area with left sidebar and an empty module preview/error. | User should not see this under Projects; possible permissions/visibility issue. | `src/features/member-workspace/components/projects/**`, `src/features/member-workspace/server/**`, `src/features/platform-admin-dashboard/**` |
| 08 | 6 | Projects board/grid with multiple project cards. | User should not see these projects; likely organization/project access filtering. | `src/features/member-workspace/server/project-loaders.ts`, `src/features/member-workspace/server/load-accessible-organizations.ts`, `src/features/member-workspace/components/projects/**` |
| 09 | 6 | Task list/detail rows under member workspace. | Same visibility/access issue for task/project data. | `src/features/member-workspace/server/task-loaders.ts`, `src/features/member-workspace/server/task-actions.ts`, `src/features/member-workspace/components/tasks/**` |
| 10 | 7 | Error line: “Application error: a client-side exception has occurred while loading coachhouse.app…”. | Admin/open organization route throws client exception. | Needs reproduction; likely admin/org profile navigation. Candidate areas: `src/features/platform-admin-dashboard/**`, `src/components/organization/org-profile-card/**`, `src/app/(admin)/**` |
| 11 | 7 | Green toast: “Access request sent again. RESEND_API_KEY is not configured.” | Invite resend reports missing email provider config but creates/sends no email. | `src/lib/email/resend.ts`, `src/app/actions/organization-access/invites.ts`, `src/app/actions/organization-access/invites-side-effects.ts`, `src/features/organization-access/**` |
| 12 | 7 | Organization access members/invites panel with pending Paula request and revoke action. | Invite state persists despite email not being delivered. | `src/features/organization-access/components/**`, `src/app/actions/organization-access/**` |
| 13 | 8 | Logged-in workspace tutorial/module overlay centered on large workspace canvas, left sidebar visible. | User remains stuck in workspace tutorial/module location. | `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/**`, `src/features/workspace-canvas-tutorial/**` |
| 14 | 8 | Logged-out public/home account selection card showing Build/Find/Fund choices. | Logged-out explanatory screen unclear; Build/Find/Fund question may be premature before login. | `src/components/public/home-canvas-preview-panels.tsx`, `src/components/public/home-canvas-preview.tsx`, `src/components/onboarding/onboarding-dialog/components/intent-step.tsx` |
| 15 | 9 | Create account card without Build/Find/Fund choice. | Two different create-account descriptions/flows. | `src/components/public/public-map-index/auth-sheet.tsx`, `src/components/onboarding/onboarding-dialog/components/account-step.tsx`, public auth/signup surfaces |
| 16 | 9 | Browser page with create account form and Build/Find/Fund choices. | Same account flow inconsistency; close `X` already fixed per user. | `src/components/public/home-canvas-preview-panels.tsx`, `src/components/onboarding/onboarding-dialog/**` |
| 17 | 10 | Public `/find` org detail for A More Just Chicago beside map, map centered too far west. | Clicking/selecting org should zoom/focus map to that org location. Existing code has focus helpers, verify all click paths set camera target. | `src/components/public/public-map-index.tsx`, `src/components/public/public-map-index/use-public-map-actions.ts`, `src/components/public/public-map-index/map-view-helpers.ts`, `src/components/public/public-map-index/organization-list.tsx` |
| 18 | 10 | Public `/find` org detail with map showing many organizations. | Same map focus/zoom issue. | Same as image 17 |
| 19 | 11 | App sidebar lower-left resources: Coach scheduling card, Knowledge base, Community. | Add `/find` resource link, likely “Find organizations”. | `src/components/app-sidebar/nav-data.ts`, `src/components/nav-secondary.tsx`, `src/components/coaching/coach-scheduling-sidebar-item.tsx` |
| 20 | 11 | Accelerator checklist under Formation: Organization setup, Naming your NFP, NFP Registration, Filing 1023, Financial Handbook, Due Diligence, Retention and Security. | “Org setup” says lesson/not lesson; remove operational videos from Formation; save issue in org setup. | `src/features/workspace-accelerator-card/**`, `src/lib/accelerator/module-order.ts`, `src/lib/accelerator/elective-modules.ts`, `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-formation-tracker-card*.tsx` |
| 21 | 12 | Accelerator dropdown/list of modules: Board Strategy, Budget, Calendar, Communications, Evaluation, Fundraising, Handbook, Next Actions, People, Presentation, Programs, Strategy, Theory of Change. | Add Introduction section; move intro video; add community/resource tiles; operational taxonomy needs future architecture. | `src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-lesson-groups.ts`, `src/features/workspace-accelerator-card/components/workspace-accelerator-header-picker.tsx`, `src/lib/accelerator/module-order.ts` |
| 22 | 13 | Accelerator “Introduction: Intro to Impact Accelerator” resource area with Slide deck and Substack resource cards. | Intro video/resources should move under new Introduction section; resource cards are the target area for Bizee/IRS/community links if that is the intended tab. | `src/features/workspace-accelerator-card/components/workspace-accelerator-step-node-card-body.tsx`, `src/features/workspace-accelerator-card/components/workspace-accelerator-card-panel*.tsx` |

## Notes On `/find` Organization Setup Overlay

This report confirmed the user’s suspicion: onboarding could render as a map overlay before the Batch 4 route fix.

Relevant code:

- `src/app/(public)/find/page.tsx` rendered `PublicMapMemberOnboardingOverlay` inside the `findPanel`.
- `src/app/(public)/find/[slug]/page.tsx` did the same.
- `src/components/public/public-map-index/member-onboarding-overlay.tsx` uses an absolute full-panel overlay with `z-30`, `backdrop-blur-sm`, and `OnboardingWorkspaceCard`.
- `src/features/find-map/server/viewer-state.ts` decides when this overlay appears.

Likely fix direction:

- Remove the dialog-style overlay from `/find`.
- If member onboarding is still needed for Find/Fund users, route them to a dedicated module/page or show a non-blocking sidebar/card entry instead of covering the map.

## Notes On Pricing Feedback Prompt

Relevant code:

- `src/features/app-pricing-feedback/lib/index.ts`
- `src/features/app-pricing-feedback/components/app-pricing-feedback-prompt.tsx`
- `src/components/app-shell/app-shell-inner.tsx`

Current route predicate:

- `isAppPricingFeedbackWorkspaceRoute(pathname)` returns true only for `/workspace` and `/workspace/*`.

So the intended action is not to remove the prompt globally. It is to verify why a user saw it in an odd place:

- Check whether the screenshot was on `/workspace` while visually showing another embedded surface.
- Check App Shell layout contexts that render the prompt over workspace-embedded cards.
- Add route/context tests if the prompt appears outside `/workspace`.
