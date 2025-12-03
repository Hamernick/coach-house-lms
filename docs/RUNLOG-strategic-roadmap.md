# RUNLOG — Strategic Roadmap & Homework UX

## 0. Context & Goals

- Product: Coach House LMS powering the I2I Accelerator.
- Goal: Make the “learning → organization” link obvious and delightful:
  - Homework feels like a guided studio, not a form.
  - Outputs flow cleanly into My Organization and shareable artifacts.
  - Strategic roadmap surfaces as a narrative, not a dashboard of fields.
- Constraints:
  - DRY, component-driven; avoid files > ~400 LOC.
  - Prefer existing components (shadcn/ui, kibo-ui, rich-text-editor, AssignmentForm, sidebar primitives).
  - No speculative new services; use current Supabase/Stripe/Next.js architecture.

## 1. Understanding the Current System

- Homework & modules:
  - `module_assignments.schema` → `AssignmentForm` → `assignment_submissions`.
  - Legacy `module_content.homework` still present; we are gradually replacing it with structured schemas.
  - Some fields have `org_key` and sync into `organizations.profile` (e.g. need, mission, vision, values, boilerplate, programs).
- Org Profile:
  - Single `organizations` row per user, JSON `profile` + derived columns and RLS.
  - My Organization page lets users edit profile and related programs.
- Editing surfaces:
  - Admin lesson wizard builds modules, content, resources, and homework fields.
  - Students see `ModuleDetail` (video, notes, resources, homework).
- Visual language:
  - Dashboard shell + sidebar from shadcn `dashboard-01`.
  - News detail (`/news/how-we-think-about-AI`) gives us a narrative page layout and gradient hero reference.

## 2. Major Workstreams

### A) Homework editor improvements (TipTap + AI assist)

- Objective:
  - Turn long-answer homework fields into a guided, assistive writing experience without cluttering the UI.
- Requirements:
  - Add a single “Assist” tool button in the homework TipTap toolbar:
    - On hover: popover with 1–2 sentence explanation (“Generate a first draft or revision based on your answers and org profile.”).
    - On click: calls a server action / route that:
      - Receives: field name, prompt context, current answer, module & class, and org profile snapshot for the user.
      - Returns: suggested text; editor replaces or inserts inline with a soft confirmation.
  - UX:
    - Disable button while a request is in-flight; show subtle loading state.
    - Never auto-submit; suggestions are editable before saving.
  - Implementation sketch:
    - Reuse `RichTextEditor` with a `mode="homework"` variant:
      - Renders a compact toolbar plus a right-aligned `Assist` button (uses existing `Button` + `Tooltip`/`Popover` from shadcn).
    - New server route (edge or node) under `/api/homework/assist`:
      - Reads Supabase session, loads `organizations.profile`, class + module metadata.
      - Delegates to an internal `generateHomeworkSuggestion` helper (wired later to the LLM of choice).
    - Wire `AssignmentForm` long_text/custom_program fields to pass a “domain prompt” (e.g. “origin_story”, “need_statement”) so the server can pick the right instruction template.

### B) Strategic Roadmap page (+ public view & shareables)

- Objective:
  - Give each org a narrative strategic roadmap page that:
    - Feels like the `/news/how-we-think-about-AI` essay layout.
    - Can be toggled public and shared section-by-section as micro-landing pages / social posts.
- Data model:
  - Add `organizations.profile.roadmap` JSON with sections:
    - `introduction`, `foundations`, `programs_and_pilots`, `funding`, `metrics_and_learning`, `timeline`.
  - Each section: `{ id, title, slug, content_md, last_updated, is_public }`.
- UX:
  - New sidebar nav item: “Strategic Roadmap” with a distinct icon (reuse a shadcn icon via Lucide, e.g. `Route` or `Map`), under the dashboard group.
  - Private editor route: `/strategic-roadmap` (inside dashboard shell):
    - Hero gradient: reuse `NewsGradientThumb` for the hero block.
    - Top-left: shadcn `Switch` labeled “Public roadmap” controlling `organizations.is_public_roadmap`.
    - Top-right: “Edit / Save / Revert” buttons (reuse header actions pattern).
    - Body:
      - For each section:
        - Title + description.
        - TipTap-based rich text editor (same homework editor, `mode="roadmap"`).
        - “Update section” button that saves just that section.
        - “Share section” action (opens right-side drawer).
  - Public route: `/org/[slug]/roadmap`:
    - Layout mirrors `/news/how-we-think-about-AI`:
      - Hero gradient + meta (org name, city, “Roadmap” tag).
      - Sequence of sections rendered as markdown.
    - Honors per-section `is_public`; hidden sections omitted.
- Shareables & social posts:
  - Right sidebar (sheet/drawer) accessible from roadmap editor:
    - “Create shareable card” flow:
      - Choose section(s), choose layout variant (square, vertical, Story-style).
      - Configure optional CTA buttons (label + URL).
      - Preview card with gradient + title + short summary.
    - Outputs:
      - A “share URL” pointing to a section-anchored public view (e.g. `/org/[slug]/roadmap#systems-thinking`).
      - Later: generate image assets or social-ready snippets (stub now, implementation later).
  - Reuse:
    - `NewsGradientThumb` for hero imagery.
    - Existing `Card`, `Button`, `Sheet`, `Tabs`, `Calendar` components from shadcn.

### C) Onboarding questionnaire (stepped form)

- Objective:
  - Capture baseline data about founder confidence + org readiness, then compare post-accelerator.
- UX:
  - Stepped dialog or full-page flow reminiscent of the existing account settings dialog:
    - Step 1–3: single, focused question with large graphic placeholder on the left, prompt + input on the right.
    - Inputs:
      - 1–10 sliders for confidence in: operating as an org, being ready for funding, finding/communicating with funders.
      - Optional free text at the end for context.
  - At completion:
    - Store responses tied to the user (and org).
    - Offer an optional “Follow-up survey later” flag used to prompt them post-cohort.
- Data:
  - New table `onboarding_responses` with `user_id`, `org_id`, numeric scales, free-text, timestamps.
  - Admin dashboard can later visualize this via existing TanStack table patterns.

### D) Curriculum copy + homework alignment

- Objective:
  - Align class/module names, subtitles, lesson notes, and homework fields with the accelerator’s actual pedagogy.
- Already captured edits (to implement systematically):
  - Strategic Foundations: class description, module titles, lesson notes removals, need statement questions, etc.
  - Mission / Vision / Values: updated class description, module subtitles, first-draft framing on homework.
 - Theory of Change & Systems Thinking: new subtitles, lesson note removals, structured IF–THEN–SO fields, systems-thinking copy updates.
- Approach:
  - Treat curriculum edits as data changes first (via seeds/migrations).
  - Avoid hard-coded per-module overrides in React except where absolutely necessary; prefer updating `modules` and `module_assignments` instead.

## 3. Implementation Attack Plan

1. **Normalize curriculum data**
   - [x] Systems Thinking: cleared legacy lesson notes/homework and seeded the full worksheet via `20251119123000_seed_systems_thinking_structured_homework.sql`.
   - [ ] Refactor seeds so modules + assignments can be selectively re-run without clobbering custom content.
   - [ ] Encode all copy changes (titles, subtitles, lesson notes, homework schemas) via migrations/seed scripts only.

2. **Homework TipTap assist**
   - [x] Extend `RichTextEditor` to accept `mode` prop and render a right-aligned `Assist` button for homework.
   - [x] Add `/api/homework/assist` route:
     - Pulls `organizations.profile` + module context.
     - Calls a placeholder `generateHomeworkSuggestion` util.
   - [x] Wire `AssignmentForm` long_text/custom_program fields to use the “assist” editor and pass domain hints.

3. **Strategic Roadmap (app + public view)**
   - [x] Add `roadmap` structure inside `organizations.profile` and helpers to read/write it.
   - [x] Create `/strategic-roadmap` RSC page using dashboard shell.
   - [x] Build a `RoadmapSectionEditor` component that reuses the homework editor and buttons.
   - [x] Implement public view `/org/[slug]/roadmap` reusing the news detail layout + `NewsGradientThumb`.
   - [x] Add sidebar nav + new icon for Strategic Roadmap.

4. **Shareable sections & social cards**
   - [x] Add right-side `Sheet` with “Share section” and social card previews.
   - [x] Create data shape for shareables (section id, layout, CTA buttons).
   - [x] Implement simple “copy link” & “download image placeholder” paths; leave actual posting + scheduling for a later pass.

5. **Onboarding questionnaire**
   - [x] Add `onboarding_responses` table (migration + RLS).
   - [x] Build a stepped `OnboardingWizard` component (using existing dialog/sheet and slider UI).
   - [x] Hook into first-login / “My Organization” empty state to prompt completion.

6. **Design pass & polish**
   - [ ] Ensure all new layouts inherit existing spacing, typography, and card patterns.
   - [ ] Keep new components small and focused; pull out shared bits (e.g. section header, gradient hero) into `src/components/shared/**`.
