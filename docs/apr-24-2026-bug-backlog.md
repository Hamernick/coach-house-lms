# Apr 24 2026 Bug / Update Backlog

Source: `/Users/calebhamernick/Downloads/Apr 24, 2026 (1).pdf`.

Do not action:

- Remove Brand Kit from onboarding/profile surfaces. User said to ignore this.
- Close `X` button in onboarding/account modal. User said this is already done.

## Batch 1 — Accelerator Flow And Content

- [x] Fix accelerator next/previous navigation so the `>` button does not jump to unrelated lessons at the end of a section.
- [x] Consider hiding/disabling `>` on the final item in a module/section (`3 of 3`, `5 of 5`, etc.) so users exit with `X` or go back with `<`.
- [x] Ensure completed homework/video work updates the accelerator card completion state and green dot.
- [x] Put “Writing a Need Statement” immediately after the “Need?” video, with no homework/resources in between.
- [x] After AI-supported Need Statement homework, route to the Accelerator Card or Mission 1 video instead of Annual Calendar.
- [x] After Mission Statement assignment, route to Accelerator Card or Vision video instead of an unrelated next video.
- [x] Add the missing strategic-roadmap-template questions into the Mission Statement assignment frame.
- [x] Add missing formation questions to the Vision homework; currently only personal vision appears.
- [x] Add “Introduction” to the accelerator section/dropdown and move the intro video out of Strategic Foundations.
- Remove Financial Handbook, Due Diligence, Retention, and Security videos from the Formation tab/dropdown until an operations library exists.

Likely areas:

- `src/features/workspace-accelerator-card/**`
- `src/lib/accelerator/**`
- `src/app/(dashboard)/workspace/accelerator/**`
- `src/app/(dashboard)/my-organization/_components/workspace-board/**`

## Batch 2 — Onboarding / Signup / Billing

- Free/early-access signup path shows no free option and forces paid tiers.
- Early access code + card entry fails with a disabled finish button.
- Paid tier checkout produced a similar error.
- Make subscription/account status clear after checkout so users know whether they are on free early access or paid.
- Reword accelerator intro copy to:

  > The accelerator offers a sequence of nine strategic lessons, delivered through smaller video modules and corresponding homework assignments. This program is designed to guide you through building your strategic foundations, developing your programs, and then transitioning into essential organizational functions such as evaluation, budgeting, communications, and fundraising for both your specific program and your entire organization.

- Rename/explain “picker” if that term is visible to users.
- Fix tutorial/onboarding instruction that references a missing Welcome module.
- Fix workspace tutorial lockups where the black arrow stops working.
- Logged-out accelerator/account intro screen needs clearer marketing/explanatory content.
- Resolve two different create-account descriptions, one with Build/Find/Fund selection and one without.
- Reconsider Build/Find/Fund question timing; likely move after account creation/login.

Likely areas:

- `src/components/onboarding/**`
- `src/lib/onboarding/**`
- `src/app/(dashboard)/onboarding/**`
- `src/features/workspace-canvas-tutorial/**`
- Stripe/checkout actions under `src/app/api/stripe/**` and onboarding actions.

## Batch 3 — Permissions, Admin, And Team Invites

- Users should not see inappropriate admin/internal project data under Projects.
- Admin -> Org Profile -> “Open organization” throws an application error.
- Inviting a new user shows `RESEND_API_KEY is not configured`, still creates a pending invite, but no email is delivered.
- Email confirmation went to spam; check sender/domain/email template deliverability separately from in-app code.

Likely areas:

- `src/features/member-workspace/**`
- `src/features/platform-admin-dashboard/**`
- `src/app/actions/organization-access/**`
- `src/features/organization-access/**`
- `src/lib/email/resend.ts`

## Batch 4 — Public Find / Sidebar / Pricing Prompt

- [x] On `/find`, clicking an organization should zoom the map to that organization/location.
- [x] Keep the “Would you pay $20?” pricing feedback prompt, but ensure it only appears in the intended workspace contexts and does not leak into unrelated surfaces.
- [x] Investigate and remove/rework `/find` organization setup onboarding overlay. A user can currently see an organization setup onboarding card over the map even though onboarding should appear in a module, not as a dialog-style overlay.
- [x] Add a lower-left sidebar Resource link to `/find`, likely labeled “Find organizations”.

Likely areas:

- `src/components/public/public-map-index/**`
- `src/features/app-pricing-feedback/**`
- `src/components/app-sidebar/**`
- `src/components/app-sidebar/nav-data.ts`

## Batch 5 — Account/Profile/Billing Copy

- Clarify whether shutting off a public profile also cancels credit-card billing.
- Add an info note to the cancel/shut-off profile button:
  - If profile shutoff cancels billing, say so.
  - If not, explain what cancellation step is required.

Likely areas:

- Organization public-page/profile settings.
- Billing/subscription settings/actions.

## Batch 6 — My Organization / Documents

- “Org setup” tab says “lesson” even though it is not a lesson.
- Org setup did not save updated name and formation stage.
- Increase org document upload limit above 32 MB or add instructions for compressing PDFs.
- Remove these from the Documents section because they should remain in Strategic Roadmap:
  - Mission
  - Vision
  - Values
  - Origin story

Likely areas:

- `src/app/(dashboard)/my-organization/**`
- `src/components/organization/org-profile-card/**`
- `src/components/organization/org-profile-card/tabs/documents-tab/**`
- `src/app/api/account/org-documents/**`

## Batch 7 — Community And External Resource Tiles

- Add tiles/links for community:
  - WhatsApp
  - Discord
  - Find
- Add external resource links:
  - `https://bizee.com` for EIN registration support.
  - IRS 1023 application.
  - IRS 1023-EZ application.

Likely areas:

- Accelerator tab/card surface shown in the PDF.
- Workspace or org-profile resource tiles.

## Future Content Architecture

Operational videos should eventually move into a separate operations/management library using these categories:

- Admin
- Program
- Evaluation
- Development
- Communication
- Finance
- HR
- Payroll
- Social Enterprises
