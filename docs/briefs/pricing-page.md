# Pricing Page Redesign (Cal.com-inspired)
Status: Done
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Redesign `/pricing` so it feels modern, minimal, and “launch ready” while staying consistent with Coach House’s shadcn/dashboard design language.
- Align the pricing tiers and copy with the canonical spec in `docs/organize.md` (“Pricing Page Requirements (Must Match)”).

## Current State
- `src/app/(public)/pricing/page.tsx` shows outdated tiers (Platform/Community/Accelerator/Launch) and extra add-ons (Electives/Coaching) that don’t match the launch pricing spec.
- Layout is card-grid only; it does not include the reference page structure (hero → tier cards → callout → feature breakdown → bottom CTA).

## Scope
In scope:
- Update `/pricing` layout to match the reference screenshots (sections + spacing + hierarchy) while using Coach House tokens/components.
- Replace tiers + copy with the launch pricing spec:
  - Formation ($0/mo)
  - Organization ($20/mo)
  - The Accelerator ($499 one-time add-on)
- Build a “feature breakdown” comparison section for the three offerings (mobile-first, accessible).
- Include a bottom CTA block; skip the footer section at the very bottom.

Out of scope:
- Implementing Stripe product/price IDs, checkout modes (subscription vs one-time), or access gating changes.
- Adding real “trusted by” logos/claims (we should not invent endorsements).
- Content/SEO overhaul beyond `/pricing`.

## UX Flow
- Entry points: Public header “Pricing”; direct visit to `/pricing`.
- Primary user path:
  - User scans hero → compares tiers → clicks CTA (start free / upgrade / enroll).
  - CTAs route to auth/app entry points (no payment flow changes in this task).
- Empty / loading / error states:
  - None required (static page).

## UI Requirements
### Pricing spec (must match)
Source: `docs/organize.md` → “Pricing Page Requirements (Must Match)”.

Card 1: The Platform (Free)
- Title: Formation
- Price: $0 / month
- Subtitle: For founders forming their entity.
- Features:
  - 1 Admin Seat (Founder only)
  - 501(c)(3) Formation Flow (Guided)
  - Private Roadmap (Internal planning)
  - Resource Map Listing (Get discovered)
  - Community Access (Discord & WhatsApp)
  - Stripe Connect (Accept donations)
  - Secure Document Storage
- CTA: “Start Free”

Card 2: The Platform (Growth)
- Title: Organization
- Price: $20 / month
- Subtitle: For teams building momentum and funding.
- Features:
  - Everything in Free
  - Unlimited Admin & Staff Seats
  - Board Member Portal (Manage and update your board)
  - Public Shareable Roadmap (Your live pitch deck)
  - Community Access (Discord & WhatsApp)
  - AI Consultant (50 Credits / month)
  - Fundraising Campaign Tools (rename once fundraise term decided)
- CTA: “Upgrade Organization”

Card 3: The Accelerator (Add‑On)
- Title: The Accelerator
- Price: $499 (One‑time)
- Subtitle: The 9‑week playbook to funder‑readiness.
- Features:
  - 42‑Module Curriculum (Lifetime access)
  - Strategic Templates (Budgets, Narratives)
  - Single User License (Locked to one founder)
  - Expert Coaching Sessions (Discounted access)
  - Priority Support
  - Can be added to Free or Organization plans
- CTA: “Enroll in Accelerator”

### Reference layout notes (from screenshots)
Reference screenshots (single page captured across multiple images):
- `Screenshot 2026-01-12 at 11.08.22 PM` (top section)
- `Screenshot 2026-01-12 at 11.08.54 PM` + `11.08.58 PM` (mid page)
- `Screenshot 2026-01-12 at 11.09.02 PM` (bottom CTA + footer; footer can be skipped)

Top hero:
- Centered, minimal hero with generous vertical padding.
- Small “pill” label above the headline (“Pricing” in the reference) with a tiny icon.
- Large, bold headline with a clean 2-line break (high contrast).
- Single paragraph subheading in muted gray (short, readable, max-width constrained).

Tier cards section:
- A row of equal-height tier cards with consistent padding, rounded corners, subtle border, and light shadow.
- One “featured/recommended” tier uses an inverted/dark card background with light text.
- Tier card structure:
  - Small plan category label at top (e.g., “Individuals / Teams / …” in reference).
  - Prominent price line; optional small price note (e.g., “per month”).
  - Short description paragraph.
  - Primary CTA button (full width). In reference: dark button on light cards; light button on the dark featured card.
  - Divider line.
  - Feature list block with small heading (e.g., “Free, forever” / “Plan features, plus:”).
  - Feature rows have check icons; secondary items appear muted/disabled.

Mid page trust row + callout:
- A subtle “trusted by …” row with brand marks; for Coach House we should replace with non-endorsement content (e.g., “Built for founders + teams” with neutral tags).
- A wide, rounded callout card with faint patterned background, centered heading, short supporting text, and 1–2 CTA buttons.

Feature breakdown section:
- Repeats the pill label pattern (e.g., “Features”) above a “Feature breakdown” heading + short subtitle.
- Two CTAs under the subtitle (primary + secondary) centered.
- Comparison table below:
  - Left column has feature categories and feature names.
  - Multiple plan columns with checkmarks/“x”.
  - One column is visually emphasized (raised/bright column) against a subtle gray table background.
  - Categories are grouped (e.g., “Scheduling features”, “Teams”, “Security”, “Integrations”).
  - Table is tall and scrolls with the page (not constrained to a tiny container).

Bottom CTA:
- A final wide callout card with short bold headline and a single primary CTA button.
- Footer exists in the reference but can be skipped for Coach House.

### Visual style constraints
- Mobile-first: cards stack; comparison table must remain usable (allow horizontal scroll if needed).
- Dark/light/system supported; no hard-coded black/white that breaks theme.
- Use shadcn/ui components where possible (Card, Button, Badge, Separator) but allow custom layout classes for the Cal.com-inspired structure.

## Data & Architecture
- Static marketing page under `src/app/(public)/pricing/page.tsx`; keep as an RSC (no client state).
- Avoid pulling user/session data or Stripe data for this redesign task.
- Keep ISR as currently configured (hourly revalidate is fine).

## Integrations
- Auth entry points for CTAs (`/sign-up`, `/login`) only; no checkout wiring changes in this task.

## Security & Privacy
- No sensitive data; ensure no misleading “trusted by” claims or fake logos.

## Performance
- Keep the page lightweight: no heavy client bundles, no animation libraries, no unnecessary images.
- Ensure the comparison table is semantic and doesn’t cause layout shift.

## Accessibility
- Heading hierarchy (H1 → H2 sections).
- CTA buttons have clear labels; focus rings visible.
- Comparison table: use `<table>` semantics with accessible headers (or an equivalent ARIA-safe grid pattern).
- Respect reduced motion (no motion required for this task).

## Analytics & Tracking
- Optional later: track pricing CTA clicks; not required for launch redesign.

## Edge Cases
- Very narrow screens: tier cards stack; long feature labels wrap cleanly.
- Dark mode: featured tier contrast remains readable; borders/dividers visible.
- Users already signed in: CTA should still be useful (can be refined later).

## Migration / Backfill
- None.

## Acceptance Criteria
- `/pricing` reflects the exact tier names, prices, subtitles, and feature bullets from `docs/organize.md`.
- Layout matches the reference structure: hero → tier cards (with featured card) → callout → feature breakdown (with comparison table) → bottom CTA.
- Footer at the bottom is not required.
- Passes: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.

## Test Plan
- Automated:
  - `pnpm lint`
  - `pnpm test:snapshots`
  - `pnpm test:acceptance`
  - `pnpm test:rls`
- Manual:
  - `/pricing` in light + dark mode, mobile + desktop widths.
  - Check CTA links route correctly (no JS errors, no broken navigation).

## Rollout Plan
- Ship as a direct replacement of `/pricing` (no feature flag) to match launch requirements.
- If needed, keep the old tier copy in git history for rollback.

## Dependencies
- Confirm final wording for “Fundraising Campaign Tools” naming (placeholder until decision is made).

## Open Questions
- Should the featured tier be “Organization” (recommended) or “The Accelerator” (add-on)?
- Should “Community Access” and “Resource Map Listing” be free at launch (noted as a pending decision in `docs/organize.md`)?

## Moonshot
- Add plan-aware checkout (subscription + one-time add-on) with Stripe Customer Portal + upgrade flows, plus analytics for conversions.
