# Onboarding + Plan Selection + Guided Tour (Launch)
Status: Draft
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Convert new users by getting them to the “aha” moment fast: create an org → see how to build the roadmap + profile → understand what’s gated behind paid plans.
- Provide a coherent end-to-end flow from marketing and pricing into the product: pricing → signup → org creation → (optional) payment → guided intro → in-app highlights.
- Reduce “blank slate” confusion and avoid users feeling stuck in the first 30 seconds.

## Current State
- We have a modal onboarding dialog (`src/components/onboarding/onboarding-dialog.tsx`) with many questions and an “accelerator/basic” variant, but it’s not aligned to the new plans (Free / Organization / Accelerator add-on) nor to the desired visual style.
- Pricing currently supports Stripe checkout, but the most ergonomic “pricing → signup → plan selection → checkout” path is not fully unified.
- We don’t have a first-run tutorial/overview screen or a highlight tour that points out key UI affordances.
- Post-login routing is inconsistent across flows (some places still assume `/dashboard` is the primary home; launch intent is `/my-organization`).

## Scope
In scope (P0):
- A new onboarding flow that feels like:
  - Stepper “create org” (cal.com-inspired) →
  - short “welcome / overview” modal →
  - lightweight highlight tour overlay that walks the user through 5–8 key UI elements.
- Account setup (fast, minimal):
  - Basic profile: name, photo, role/title (optional), LinkedIn (optional).
  - Notification preferences: product updates + newsletter opt-in.
  - Security prompt: encourage enabling 2FA (skippable; remind later).
- Plan selection integration:
  - If the user arrives from `/pricing` with a selected plan, preserve that selection through signup and onboarding.
  - If the user arrives from generic CTAs (homepage/header), show plan selection during onboarding.
  - Trigger Stripe checkout only when the user is authenticated and has confirmed a paid plan.
- Clear gating messaging:
  - When a paid feature is unavailable (publish roadmap / accelerator content), show the right upgrade CTA and explain why.
- Save/restore:
  - If the user leaves mid-onboarding, resume where they left off.
  - Allow skipping the tour (but not leaving the user without an org record).

Out of scope (for launch):
- A full end-to-end “every screen” product tour.
- Complex multi-role onboarding (board member/supporter) until roles are finalized.
- Deep personalization/segmentation beyond plan + basic org stage.
- Social login providers (Google/Apple/LinkedIn) if they threaten launch timing; treat as P1 unless we explicitly greenlight it.

## UX Flow
### Flow Strategy (what’s most common / optimal)
Recommended (PLG standard + lowest risk for our Stripe + RSC setup):
- Plan interest captured on `/pricing` (or default “Start free”) →
- Signup/auth (required to safely bind Stripe checkout + entitlement) →
- Org creation (name + slug) →
- Plan selection confirmation (if not already selected) →
- Payment (only if Organization subscription and/or Accelerator add-on selected) →
- Welcome/overview → highlight tour.

Why this order:
- We need auth before checkout to reliably link Stripe sessions to a user/org without guest checkout complexity.
- Asking for an org name + slug before payment increases perceived ownership and reduces “I paid but where do I start?” churn.
- The tutorial belongs after the user has an org and knows what they bought (or what’s free).

### Entry points
- `/pricing` plan card CTA:
  - Unauthed: send to `/sign-up` with `?plan=...` (and optional `addon=accelerator`) so selection survives signup.
  - Authed: send to onboarding stepper with plan preselected (or directly to checkout for upgrades).
- Global “Get started” CTA:
  - Default to Free plan and open plan selection inside onboarding.
- Returning user:
  - If org not created or onboarding not completed: show onboarding entry modal automatically.
  - If onboarding completed: do nothing.

### Primary user path (new user, from pricing)
1) `/pricing` → click “Get started” (Free) or “Upgrade Organization” (paid) or “Add Accelerator”.
2) `/sign-up?plan=...` → create account (email/password or magic link) → verify if needed.
3) First authenticated load → open onboarding stepper.
4) Step 1: Create your organization (name + slug).
5) Step 2: Account setup (name/photo/title, notification prefs, optional LinkedIn).
6) Step 3: Select plan (if not provided) or confirm plan (if provided).
7) Step 4: Checkout (Stripe) if paid plan/add-on.
8) Return from Stripe → success → “Welcome to Coach House” overview modal.
9) Continue → highlight tour overlay; user ends on `/my-organization`.

### Secondary paths
- Skip payment (user chooses Free): go directly from stepper → welcome modal → highlight tour.
- Upgrade later:
  - User can complete onboarding on Free and later upgrade from `/pricing` or upgrade prompts.
- Resume flow:
  - If user closes onboarding mid-way, we persist draft and show “Finish setup” banner/button.

### Empty / loading / error states
- Onboarding step submit:
  - Show inline loading state and disable buttons; do not silently fail.
  - Show friendly error and keep data in place on errors.
- Slug availability check:
  - Show “checking…” + debounced check; block “Continue” if unavailable.
- Stripe checkout fails:
  - Return to onboarding with a clear “Payment failed/cancelled” state and a retry button.

## UI Requirements
### Visual references (screenshot notes)
1) **Create org stepper card (Create a new team)**
   - Full-screen dark/neutral background (soft vignette).
   - Centered content with:
     - Title (large, bold) + short helper copy.
     - Step indicator: “Step 1 of 3” + horizontal progress bar.
     - A single card containing labeled inputs.
     - Bottom row buttons: secondary “Cancel” (outline/ghost) and primary “Checkout/Continue” with right-arrow.
   - Border is subtle; radius is large; spacing is generous; text is minimal and calm.

2) **Welcome / overview modal**
   - App UI is visible behind, dimmed heavily.
   - Center modal with brand mark + subtle abstract graphic (concentric rings).
   - Clear title + single-line value statement.
   - Checklist of “what you can do now” with check icons.
   - Single primary button: “Continue” bottom-right.

3) **Plan selection picker**
   - Large modal container with split layout:
     - Left: “Select plan” header + helper copy + stacked radio-card options + primary “Continue” button at bottom.
     - Right: large decorative panel (abstract rings) for balance and brand feel.
   - Selected option is visually distinct; options include small badges (e.g., “Free”, “$20/mo”).

### Coach House-specific UI components (planned)
- `OnboardingStepperDialog` (client):
  - Step header (title, helper copy).
  - Step progress UI (bar or dots).
  - Step body (org creation / plan selection / checkout).
  - Bottom actions: Back / Continue; Cancel/Skip where appropriate.
- `PlanPicker` (client):
  - Radio-card options for:
    - Individual (Free)
    - Organization ($20/month)
  - Optional Accelerator add-on as:
    - a third “Add-on” card, or
    - a toggle below plan selection with price/benefits summary.
- `WelcomeOverviewDialog` (client):
  - Displays features based on entitlement (Free vs Org vs Accelerator).
  - CTA: “Take a quick tour” (primary) + “Skip” (secondary).
- `HighlightTourOverlay` (client):
  - Full-screen overlay with “hole”/mask that highlights a specific element.
  - Tooltip card anchored near highlight with:
    - step title + 1–2 sentences
    - Back/Next
    - Skip / “Got it”
  - Reduced motion support; keyboard navigation; focus management.
- `TourEntryPoint` (client):
  - “Replay tutorial” entry in a settings/help surface (e.g., Theme/Support popover or Account settings menu).
  - If tour was previously dismissed/completed, allow re-running it on demand.

### Proposed highlight tour steps (v1)
Goal: 5–8 steps max, complete in under ~60 seconds, end with the user taking 1 real action (edit org profile or add a roadmap item).

Expected behaviors:
- Skippable at any time.
- Remembers completion for the user (prefer persisting in profile/metadata; localStorage-only is acceptable for launch if we need to ship fast).
- Mobile-safe: auto-scroll targets into view and re-measure after layout changes.
- Gated: do not show Accelerator step unless entitled; do not encourage publish unless the user is Organization (`active|trialing`).

Tour steps (suggested):
1) **Global search**
   - Highlight: global search trigger (Cmd/Ctrl+K).
   - Copy: “Jump anywhere fast. Search pages, roadmap items, and more.”
2) **My Organization**
   - Highlight: left nav “My Organization”.
   - Copy: “This is your workspace. Start here to set up your basics.”
3) **Org profile basics**
   - Highlight: the identity card section (name, formation status).
   - Copy: “Fill in the basics — we reuse this across your public profile and roadmap.”
4) **Strategic Roadmap**
   - Highlight: left nav “Strategic Roadmap”.
   - Copy: “Build a funder-ready roadmap you can share publicly when you’re ready.”
5) **Add a roadmap item**
   - Highlight: primary “Add” affordance in the roadmap editor.
   - Copy: “Add your next milestone. Keep it simple — you can refine later.”
6) **Publish toggle (conditional)**
   - Highlight: roadmap “Make live” toggle.
   - Copy (Organization): “Publish your roadmap when it’s ready — you can turn it off anytime.”
   - Copy (Free): “Publishing is available on Organization. Upgrade when you’re ready to share.”
7) **Account menu**
   - Highlight: avatar/account menu.
   - Copy: “Need help later? Replay this tour anytime from here.”
8) **Accelerator (conditional)**
   - Highlight: Accelerator nav item.
   - Copy: “Your Accelerator playbook lives here — start with Week 1 and work forward.”

### Design patterns to follow (repo conventions)
- shadcn/ui dialogs, buttons, cards, badges; large rounding; subtle borders.
- Dark/light/system theme support (no hard-coded colors); use existing tokens.
- Mobile-first:
  - Stepper becomes single-column; plan picker becomes stacked (right panel collapses or becomes top illustration).
  - Tour overlay must avoid obscuring the highlighted element on small screens (scroll-into-view behavior).

### Copy updates (draft)
- Stepper:
  - Title: “Create your organization”
  - Helper: “This is your nonprofit’s workspace — you can change this later.”
- Plan picker:
  - Title: “Choose your plan”
  - Helper: “Start free. Upgrade when you’re ready to publish or collaborate.”
- Welcome:
  - Title: “Welcome to Coach House”
  - Helper: “Here’s what to do first — it takes ~2 minutes.”

## Data & Architecture
### Tables / fields touched
- `organizations`:
  - Ensure a row exists for every authed user (create on first-run if missing).
  - Store minimal org details: `profile.name`, `public_slug` and/or slug inside profile (depending on existing schema).
- `profiles` and/or auth `user_metadata`:
  - `onboarding_completed` (existing concept)
  - Add/standardize:
    - `onboarding_step` (resume)
    - `selected_plan` (individual|organization)
    - `selected_addons` (accelerator)
    - `tour_completed` / `tour_completed_at`
    - `tour_dismissed` / `tour_dismissed_at`
    - `notification_prefs` (product updates, newsletter)
    - `security_prompt_dismissed_at` (2FA reminder)
    - `profile_title` and `linkedin_url` (if we store these)

### RLS / permissions
- Users can read/write their own org and onboarding state.
- Admins retain full access.
- Do not allow users to update `subscriptions` directly (webhook/service-role only).

### Server actions / routes
- Onboarding submit action:
  - Creates/updates org profile basics and persists onboarding state.
- Plan selection action:
  - Stores intent and decides whether to route into Stripe checkout.
- Stripe checkout:
  - Must only run for authed users.
  - On return, redirect back into onboarding completion + tutorial (not just “random success”).

### Caching / ISR / no-store
- All authed onboarding reads should be `no-store`.
- Do not cache entitlement checks; keep latest subscription/add-on status.

## Integrations
- Supabase Auth: first-run trigger, metadata persistence.
- Stripe:
  - Organization subscription checkout
  - Accelerator one-time payment checkout
  - Post-checkout redirect should re-enter onboarding completion + tutorial.
- Supabase Auth (future/P1):
  - OAuth providers for faster profile bootstrapping (Google + Apple first; LinkedIn likely later due to setup/review friction).
  - 2FA / MFA (TOTP) enablement prompt (self-serve settings screen + lightweight prompt in onboarding).

## Security & Privacy
- Avoid storing sensitive info in onboarding (we only need minimal org basics).
- Sanitize any user-provided text that can later be shown publicly (org name, description, mission).
- Ensure tour does not leak gated nav/routes (accelerator).
- Logging:
  - Log onboarding events without storing PII in logs (e.g., do not log org name).
- 2FA:
  - For launch, treat as a prompt (optional) unless we decide to require it for admins.
  - Never block onboarding completion on 2FA unless policy is explicitly decided.

## Performance
- Avoid adding heavy tour libraries; prefer a small in-house tour overlay.
- Lazy-load the onboarding/tour code (only on first run) to protect LCP for returning users.
- Keep abstract illustration lightweight (SVG/CSS, not large images).

## Accessibility
- Dialog focus trap and escape behavior:
  - Onboarding dialog should not be dismissible into a broken state (allow “Cancel” but keep a “Finish setup” banner).
- Tour overlay:
  - Keyboard: Next/Back/Skip accessible; ESC exits.
  - Announce step title/content to screen readers.
  - Reduced motion: no scroll-scrub animations; instant transitions.

## Analytics & Tracking
- Events:
  - `onboarding_opened`, `onboarding_step_completed`, `onboarding_completed`
  - `plan_selected`, `checkout_started`, `checkout_cancelled`, `checkout_completed`
  - `tour_started`, `tour_step_viewed`, `tour_completed`, `tour_skipped`
  - `tour_replayed`
  - `security_prompt_viewed`, `security_prompt_dismissed`
  - `notifications_opt_in_changed`
- KPIs:
  - Signup → org created conversion
  - Org created → roadmap edited conversion
  - Org created → upgrade conversion (Organization)
  - Accelerator add-on conversion

## Edge Cases
- User arrives from `/pricing` while logged in (upgrade path):
  - If already on Organization plan, show “Manage billing” instead of checkout.
- User cancels checkout:
  - Bring them back to onboarding with a non-blocking “Try again” state.
- User selects Accelerator without Organization:
  - Allowed as add-on purchase, but must be clear what it unlocks (accelerator nav + content).
- Multiple devices:
  - If tour completion is only localStorage, it will reappear; prefer persisting completion in auth metadata/profile.
- Mobile tour overlays:
  - Highlighted target might be off-screen; auto-scroll and re-measure.
- Social login:
  - Apple/Google may provide name/email only once; ensure we don’t lose it and offer a “complete your profile” step.
- 2FA:
  - Users without 2FA should still be able to use the app; show a non-blocking reminder in account settings.

## Migration / Backfill
- Map existing `onboarding_completed` and draft localStorage keys (if any) to the new stepper state.
- If a user already has `organizations` data, skip org creation step and jump to plan/tour.

## Acceptance Criteria
- New user from pricing can complete:
  - signup → org created → (optional) checkout → welcome → guided tour → lands on `/my-organization`.
- Plan selection survives the pricing → signup boundary.
- Tour does not show Accelerator steps unless entitled.
- Users without Organization subscription cannot publish roadmap (switch disabled) and see a clear upgrade CTA.
- Onboarding/tour can be skipped and resumed later without losing progress.

## Test Plan
- Unit/integration:
  - Onboarding state persistence (metadata/profile)
  - Plan selection routing rules
  - Tour gating (accelerator steps hidden)
- Acceptance tests:
  - Add/extend an acceptance test that simulates `/pricing` → signup redirect params preserved.
  - Verify post-checkout returns to the intended “welcome/tour” entry.
- Manual QA path:
  - Fresh free user → onboarding → tour
  - Fresh org plan user → checkout → return → tour
  - Accelerator add-on user → accelerator nav appears and route is accessible
  - Mobile viewport tour: no clipped content and targets scroll into view

## Rollout Plan
- Phase 1 (launch):
  - Implement stepper + welcome + short tour (5–8 steps).
  - Add “Replay tutorial” entry in an always-available settings/help menu.
  - Tie into pricing CTA query params and ensure payment returns to tutorial.
- Phase 2 (post-launch):
  - Expand tour steps and add contextual “help” menu to re-run tour.
  - Add onboarding checklist card on `/my-organization` (for unfinished setup).
- Rollback:
  - Feature flag `onboarding_v2` toggles new flow off and falls back to existing onboarding behavior.

## Dependencies
- Final decisions on onboarding required fields (org name + slug minimum).
- Final plan definitions:
  - Individual (Free)
  - Organization ($20/mo)
  - Accelerator ($499 one-time)
- Stripe price IDs in env for prod.
- If we ship social login:
  - Provider apps configured + secrets set (Google, Apple).
  - Decide whether LinkedIn is worth the launch risk (likely P1).

## Open Questions
- Where should the plan picker live when user comes from a specific CTA?
  - Option A: skip plan picker and honor the CTA selection.
  - Option B: show plan picker as confirmation (recommended for clarity).
- What is the minimum “org created” definition for launch?
  - Org name only vs name + slug vs name + stage.
- Should the tour run immediately after onboarding, or only after first roadmap interaction?
  - Recommendation: run immediately, but keep it short and skippable.
- Do we want a “Secure your account” step in onboarding, or a lightweight prompt + settings entry only?
- Which notification channels are in scope for launch (email only vs in-app + email)?
- Do we ship social login for launch?
  - Recommendation: P1 for Google/Apple; LinkedIn later (often slower due to review + restricted scopes).

## Moonshot
- Adaptive tour that responds to what the user clicks (e.g., detects “you opened Roadmap”, then guides the publish toggle).
