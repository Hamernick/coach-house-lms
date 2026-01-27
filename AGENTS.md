# AGENTS.md — Coach House LMS (Merged v5)

> **Purpose:** Canonical agent + repository contract. Execution-ready, deterministic, testable. For deeper context, cross-reference all companion documents under `/docs`.

---

## 0) Ground Rules

* **Source of truth:** this file.
* **Additional context:** see `/docs` for architecture, schema, and runbook details.
* **No inline code:** implement in `src/**`, `app/**`, `migrations/**`, `docs/**`.
* **Small PRs:** each passes `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
* **Design:** RSC-first, mobile-first, HIG-inspired; dark/light/system; shadcn/ui.

---

## 1) Scope (MVP)

**Public:** Landing, Pricing.
**Auth:** email+password, magic link, verify, reset.
**Payments:** Stripe subscriptions (checkout → webhook → subscription record → access).
**Student:** dashboard, classes → modules (video, markdown, inputs, deck download), sequential unlock.
**Admin:** CRUD classes/modules/content; reorder modules; PDF upload; publish/unpublish; user mgmt (list/search/filter, view progress & subs, role change); admin dashboard (KPIs, completion %, MRR, recent signups/payments).

---

## 2) Architecture

* **Next.js App Router (RSC-first)** with Supabase + Stripe webhooks.
* **Runtimes:** Node for Stripe/webhooks; Edge/ISR for static/public.
* **Cache:** Marketing via ISR; authed data `no-store`.
* **Error surfaces:** structured server errors; friendly UI.
* **HTML sanitization:** all user/admin markdown.

---

## 3) Technical Directives

* Store **UTC TIMESTAMPTZ**; display in user locale/time zone.
* Locale-aware currency/number formatting.
* Sanitize HTML; prevent XSS.

---

## 4) Data Model (Contract)

Entities: `Profile`, `Class`, `Module`, `Enrollment`, `ModuleProgress`, `Subscription`.

Extended: `ModuleAssignment`, `AssignmentSubmission`, `Nonprofit`.

Constraints:

* Unique slugs and `(class_id, idx)`.
* FKs cascade.
* Stripe `event_id` idempotent.

Admin Views:

* `progress_summary`, `subscription_summary`.
* Cached nightly revenue snapshots.

---

## 5) Access Control (RLS)

* **RLS on all tables.**
* Students: read published classes/modules; edit own data.
* Admins: full access via role in `profiles`.
* JWT includes role; audit all admin actions.

---

## 6) Routing & Navigation

Groups: `(public) / (auth) / (dashboard)`; `/admin/**`; `/billing`.

Canonical URLs:

```
/dashboard
/class/{slug}
/class/{slug}/module/{index}
/pricing
/billing
/admin/*
```

Breadcrumbs: contextual; skeletons while resolving; mobile truncate.

Guards: 401→login; 403→message; unpublished disabled; 404 empty.

---

## 7) UI/UX Layouts

### Student

* Dashboard: Next Up, Progress Overview, Nonprofit Canvas, Upcoming Schedule, Classes, Assignments Due, Recent Activity.
* Class: sidebar modules with progress.
* Module: video, markdown, inputs; Prev/Next buttons.
* Nonprofit: compiled canvas from submissions.

### Admin

* Dashboard: KPI cards, tasks, recent submissions.
* Classes: table with publish switch, count, actions.
* Editor: details, modules list (drag handle), module CRUD.
* Users: list/search/filter/pagination/export.
* Payments: drill-downs, link to Stripe portal.

Design: shadcn dashboard shell; Tailwind tokens; dark/light; React Hook Form; accessible; responsive; YouTube unlisted embeds.

---

## 8) UX Flows

* Auth: signup→verify→signin→reset.
* Payments: pricing→checkout→return; webhook→sync subscription.
* Billing mgmt: card update, invoices, cancel/resubscribe.
* Onboarding: first-login wizard; inactivity nudge.
* Admin: CRUD content, reorder, upload, preview, publish.

---

## 9) States

* Loading: skeletons/spinners.
* Empty: friendly CTAs.
* Error: inline + toast.
* Success: confirmation; UI updates.
* Coverage matrix: key screens × (loading, empty, error, success).

---

## 10) Performance

* LCP ≤2.5s, TTI ≤4s mid-range mobile.
* Hydration minimization; lazy/dynamic heavy widgets.
* Paginate long lists; stream large payloads.

---

## 11) Security

* Secrets server-side (Stripe, Supabase service key).
* Verify webhook signature; idempotency via `event_id`.
* Server-side authz for all actions.
* Sanitize HTML; enforce CSP.
* HTTPS only; Secure+HttpOnly cookies; admin audit log.

---

## 12) Observability & Errors

* Structured logs; webhook events; admin audit.
* No silent failures; actionable errors.
* Minimal analytics: page/module view, completion.

---

## 13) File & Module Layout

```
src/app/(public|auth|dashboard)/**
src/app/admin/**
src/app/billing/**
src/components/**  # shadcn ui, tables, skeletons, etc.
src/lib/**         # supabase/stripe clients
src/hooks/**       # shared logic
supabase/**        # schema, policies, tests
public/**          # static assets
docs/**            # runbooks, contracts, diagrams, context extensions
```

---

## 14) Integrations

* **Supabase:** env vars; SSR cookies; `decks` bucket private w/ signed URLs.
* **Stripe:** dashboard products/prices; webhook signature verify; Customer Portal for billing.

---

## 15) CI/CD & Environments

* Single env `prod` (Supabase + Stripe test/live).
* Migrations versioned & reversible.
* GitHub Actions: typecheck, lint, build, preview deploys.
* Feature flags for risky changes.

---

## 16) Internationalization & Time Zones

* Labels not hard-coded; base i18n scaffolding.
* Store UTC; display local; locale-aware currency/number.

---

## 17) Acceptance Criteria

* Paid signup → dashboard reflects subscription.
* Student completes module → unlocks next.
* Dashboard shows accurate Next Up/progress.
* Nonprofit Canvas updates instantly.
* Admin manages users, reviews submissions, edits content.
* Meets perf budgets, WCAG AA, zero console errors.

---

## 18) Agent Workflow

1. Plan: list files to touch; propose diffs.
2. Implement: code/migrations/docs in correct dirs.
3. Validate: run checks; smoke test (auth, payment, unlock, billing, admin).
4. Deliver: PR with screenshots (light/dark/mobile) + state coverage notes.
5. Log: append a concise entry to `docs/RUNLOG.md` for every ad‑hoc or Codex session (what changed, what worked, what didn’t, and where to pick up next).

---

## 19) Backlog

1. Env bootstrap (clients/config/shell).
2. Auth flow.
3. Pricing/checkout.
4. Webhooks/subscription sync.
5. Student flow (class list, module unlocks).
6. Admin content CRUD.
7. Admin users/dashboard.
8. Billing mgmt.
9. Perf + a11y polish.

---

## 20) Non-goals

Teams, mentors, certificates, deep analytics, multi-tenant orgs.

---

## 21) Maintainer Notes

Keep concise; move extra detail to `/docs/**`.

---

## 22) Testing & QA

* **Vitest**: acceptance, snapshots; mirror CI locally.
* RLS tests after every migration/policy edit.
* Snapshots updated via `pnpm snapshots:update`.
* Mirror CI: `pnpm lint && pnpm test:snapshots && pnpm test:acceptance`.
* Add targeted edge cases.

---

## 23) Git & PR Workflow

* Branch: `feat|fix|chore/<slug>`.
* Commit present tense (e.g., `docs: mark S32 complete`).
* PR title `[STEP SNN] <title>` with checklist, linked issue, UI artifacts.
* Flag risks and env notes for reproducibility.

---

## 24) Build & Dev Commands

* Install: `pnpm install`.
* Dev: `pnpm dev` → `http://localhost:3000`.
* Build: `pnpm build` → `pnpm start`.
* Guardrails: lint/tests/RLS.
* Utilities: `pnpm check:perf`, `pnpm db:push`, `pnpm create:admin`, `pnpm verify:settings`.

---

## 25) Performance, Security & Observability Summary

* **Performance:** LCP ≤2.5s, lazy media, paginated tables.
* **Security:** CSP, signed URLs, verified webhooks.
* **Observability:** structured logs, alerts, no silent failures.

---

## 26) Agent Tooling

* Workspace `mcp.json` provisions `filesystem`, `shell`, `ripgrep`, and `git` MCP servers via `npx`; they default to the repo root.
* Install `rg` (ripgrep) locally so the search server succeeds (`brew install ripgrep` on macOS).
* Approve the servers in your MCP-aware client (Claude Desktop, VS Code MCP) before starting runs.

---

## 27) UI Quality Rubric (MUST/SHOULD/NEVER)

Concise rules for building accessible, fast, delightful UIs. Use MUST/SHOULD/NEVER to guide decisions.

### Interactions

**Keyboard**
* MUST: Full keyboard support per WAI-ARIA APG.
* MUST: Visible focus rings (`:focus-visible`; group with `:focus-within`).
* MUST: Manage focus (trap, move, return) per APG patterns.
* NEVER: `outline: none` without visible focus replacement.

**Targets & Input**
* MUST: Hit target ≥24px (mobile ≥44px); if visual <24px, expand hit area.
* MUST: Mobile `input` font-size ≥16px to prevent iOS zoom.
* NEVER: Disable browser zoom (`user-scalable=no`, `maximum-scale=1`).
* MUST: `touch-action: manipulation` to prevent double-tap zoom.
* SHOULD: Set `-webkit-tap-highlight-color` to match design.

**Forms**
* MUST: Hydration-safe inputs (no lost focus/value).
* NEVER: Block paste in `input`/`textarea`.
* MUST: Loading buttons show spinner and keep original label.
* MUST: Enter submits focused input; in `textarea`, Cmd/Ctrl+Enter submits.
* MUST: Keep submit enabled until request starts; then disable with spinner.
* MUST: Accept free text, validate after—don't block typing.
* MUST: Allow incomplete form submission to surface validation.
* MUST: Errors inline next to fields; on submit, focus first error.
* MUST: `autocomplete` + meaningful `name`; correct `type` and `inputmode`.
* SHOULD: Disable spellcheck for emails/codes/usernames.
* SHOULD: Placeholders end with `…` and show example pattern.
* MUST: Warn on unsaved changes before navigation.
* MUST: Compatible with password managers & 2FA; allow pasting codes.
* MUST: Trim values to handle text expansion trailing spaces.
* MUST: No dead zones on checkboxes/radios; label+control share one hit target.

**State & Navigation**
* MUST: URL reflects state (deep-link filters/tabs/pagination/expanded panels).
* MUST: Back/Forward restores scroll position.
* MUST: Links use `a`/`Link` for navigation (support Cmd/Ctrl/middle-click).
* NEVER: Use `div onClick` for navigation.

**Feedback**
* SHOULD: Optimistic UI; reconcile on response; on failure rollback or offer Undo.
* MUST: Confirm destructive actions or provide Undo window.
* MUST: Use polite `aria-live` for toasts/inline validation.
* SHOULD: Ellipsis (`…`) for options opening follow-ups ("Rename…") and loading states ("Loading…").

**Touch & Drag**
* MUST: Generous targets, clear affordances; avoid finicky interactions.
* MUST: Delay first tooltip; subsequent peers instant.
* MUST: `overscroll-behavior: contain` in modals/drawers.
* MUST: During drag, disable text selection and set `inert` on dragged elements.
* MUST: If it looks clickable, it must be clickable.

**Autofocus**
* SHOULD: Autofocus on desktop with single primary input; rarely on mobile.

### Animation

* MUST: Honor `prefers-reduced-motion` (provide reduced variant or disable).
* SHOULD: Prefer CSS > Web Animations API > JS libraries.
* MUST: Animate compositor-friendly props (`transform`, `opacity`) only.
* NEVER: Animate layout props (`top`, `left`, `width`, `height`).
* NEVER: `transition: all`—list properties explicitly.
* SHOULD: Animate only to clarify cause/effect or add deliberate delight.
* SHOULD: Choose easing to match the change (size/distance/trigger).
* MUST: Animations interruptible and input-driven (no autoplay).
* MUST: Correct `transform-origin` (motion starts where it "physically" should).
* MUST: SVG transforms on `g` wrapper with `transform-box: fill-box`.

### Layout

* SHOULD: Optical alignment; adjust ±1px when perception beats geometry.
* MUST: Deliberate alignment to grid/baseline/edges—no accidental placement.
* SHOULD: Balance icon/text lockups (weight/size/spacing/color).
* MUST: Verify mobile, laptop, ultra-wide (simulate ultra-wide at 50% zoom).
* MUST: Respect safe areas (`env(safe-area-inset-*)`).
* MUST: Avoid unwanted scrollbars; fix overflows.
* SHOULD: Flex/grid over JS measurement for layout.

### Content & Accessibility

* SHOULD: Inline help first; tooltips last resort.
* MUST: Skeletons mirror final content to avoid layout shift.
* MUST: `title` matches current context.
* MUST: No dead ends; always offer next step/recovery.
* MUST: Design empty/sparse/dense/error states.
* SHOULD: Curly quotes (“ ”); avoid widows/orphans (`text-wrap: balance`).
* MUST: `font-variant-numeric: tabular-nums` for number comparisons.
* MUST: Redundant status cues (not color-only); icons have text labels.
* MUST: Accessible names exist even when visuals omit labels.
* MUST: Use `…` character (not `...`).
* MUST: `scroll-margin-top` on headings; "Skip to content" link; hierarchical `h1`-`h6`.
* MUST: Resilient to user-generated content (short/avg/very long).
* MUST: Locale-aware dates/times/numbers (`Intl.DateTimeFormat`, `Intl.NumberFormat`).
* MUST: Accurate `aria-label`; decorative elements `aria-hidden`.
* MUST: Icon-only buttons have descriptive `aria-label`.
* MUST: Prefer native semantics (`button`, `a`, `label`, `table`) before ARIA.
* MUST: Non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names.

### Content Handling

* MUST: Text containers handle long content (`truncate`, `line-clamp-*`, `break-words`).
* MUST: Flex children need `min-w-0` to allow truncation.
* MUST: Handle empty states—no broken UI for empty strings/arrays.

### Performance

* SHOULD: Test iOS Low Power Mode and macOS Safari.
* MUST: Measure reliably (disable extensions that skew runtime).
* MUST: Track and minimize re-renders (React DevTools/React Scan).
* MUST: Profile with CPU/network throttling.
* MUST: Batch layout reads/writes; avoid reflows/repaints.
* MUST: Mutations (`POST`/`PATCH`/`DELETE`) target <500ms.
* SHOULD: Prefer uncontrolled inputs; controlled inputs cheap per keystroke.
* MUST: Virtualize large lists (>50 items).
* MUST: Preload above-fold images; lazy-load the rest.
* MUST: Prevent CLS (explicit image dimensions).
* SHOULD: `link rel="preconnect"` for CDN domains.
* SHOULD: Critical fonts: `link rel="preload" as="font"` with `font-display: swap`.

### Dark Mode & Theming

* MUST: `color-scheme: dark` on `html` for dark themes.
* SHOULD: `meta name="theme-color"` matches page background.
* MUST: Native `select`: explicit `background-color` and `color` (Windows fix).

### Hydration

* MUST: Inputs with `value` need `onChange` (or use `defaultValue`).
* SHOULD: Guard date/time rendering against hydration mismatch.

### Design

* SHOULD: Layered shadows (ambient + direct).
* SHOULD: Crisp edges via semi-transparent borders + shadows.
* SHOULD: Nested radii: child ≤ parent; concentric.
* SHOULD: Hue consistency: tint borders/shadows/text toward bg hue.
* MUST: Accessible charts (color-blind-friendly palettes).
* MUST: Meet contrast—prefer APCA over WCAG 2.
* MUST: Increase contrast on `:hover`/`:active`/`:focus`.
* SHOULD: Match browser UI to bg.
* SHOULD: Avoid dark color gradient banding (use background images when needed).

---

**End of file — canonical agent & repo contract for Coach House LMS.
For extended documentation and reasoning, review `/docs` files.**
