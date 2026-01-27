# Coach House — System Overview

> Ultra‑condensed, structured, and grounded in the current codebase.  
> “Roadmap” items are called out explicitly so they don’t get confused with what already exists.

---

## 1. Purpose (Current)

Coach House is a **nonprofit accelerator + LMS**:

- Runs the I2I Accelerator curriculum (Strategic Foundations → Mission/Vision/Values → Theory of Change & Systems Thinking → Piloting Programs, etc.).
- Gives founders a **My Organization** profile that is gradually built from homework.
- Provides a small but real SaaS surface: auth, billing, classes/modules, homework, org profile, and public org pages.

Long‑term it aims at a broader “operating system for nonprofits” (see Roadmap).

---

## 2. Core Users (Current)

- **Nonprofit founders / EDs / ops leads** in accelerator cohorts.
- **Coach House staff** (Joel, Paula, others) running cohorts and reviewing work.
- **Students** moving through classes and modules.

---

## 3. Product Surface Today

### 3.1 Learning & Homework

- Class + module flow at `/class/[slug]/module/[index]`.
- Each module can have:
  - Video
  - Lesson notes (markdown)
  - Resources
  - Homework / assignment form (`module_assignments.schema` → `AssignmentForm`).
- Structured homework exists for:
  - Strategic Foundations (Origin Story, Need).
  - Mission / Vision / Values.
  - Theory of Change & Systems Thinking.
  - Piloting Programs (Pilot Design Questions).
  - Branding elective (Brand Messaging Blueprint).

### 3.2 Organization Profile

- Single `organizations` row per user with JSONB `profile`.
- My Organization page (`/my-organization`):
  - Org profile fields (name, description, tagline, EIN, contact, address, social links, mission, vision, need, values, programs, reports, boilerplate, brand colors, public slug, is_public).
  - Programs list with basic fields.
- Public org surfaces:
  - Community listing and per‑org public page using `public_slug` + `is_public`.

### 3.3 Dashboard & Admin

- Dashboard (`/dashboard`) with:
  - “Today / Backlog / In progress / Done” cards (currently mostly placeholder).
  - Progress cards (Organization Completeness, Your Next Class, per‑class progress).
- Admin functions:
  - Class + module CRUD via lesson wizard.
  - Module content (video, notes, resources) and homework configuration.

### 3.4 Billing & Auth

- Supabase Auth (email/password, magic links, etc. per AGENTS/steps).
- Stripe subscriptions (schema + webhooks wired; productization in progress).

---

## 4. Data Model & Linking (Current)

### 4.1 Core Entities

- `profiles` — user metadata + role (member/admin).
- `classes` — accelerator sessions (Strategic Foundations, Mission/Vision/Values, etc.).
- `modules` — ordered lessons inside classes.
- `enrollments` — which users are in which classes.
- `module_assignments` — JSON schemas for homework fields.
- `assignment_submissions` — answers per user per module.
- `module_content` — video/resources/legacy homework.
- `organizations` — per‑user organization profile JSON.
- `module_progress` — completion status per module/user.
- `subscriptions` — Stripe subscription state.

### 4.2 Homework → Org Profile Mapping

Some homework fields carry an `org_key` and are synced into `organizations.profile` via
`src/app/api/modules/[id]/assignment-submission/route.ts`.

Examples:

- Strategic Foundations:
  - Origin Story draft → `boilerplate`.
  - Need statement modules → `need`.
- Mission / Vision / Values:
  - Mission module → `mission`.
  - Vision module → `vision`.
  - Values module → `values`.
- Piloting Programs:
  - Pilot Program Summary → `programs`.
- Branding elective:
  - Organization name → `name`.
  - Boilerplate paragraph → `boilerplate`.

This is how **learning outputs** gradually build the org profile.

---

## 5. Brand & Design Principles (Current)

- Next.js App Router, RSC‑first.
- Tailwind + shadcn/ui components.
- Dashboard shell based on shadcn `dashboard-01`:
  - Inset card shell, collapsible sidebar, independent scrolling for nav.
- Unified app shell contract for layout, slots, and rail placement: `docs/app-shell.md`.
- Layout language:
  - Cards with clear headers + content.
  - Lesson pages: video → notes → resources → homework → next module.
  - News pages (`/news/how-we-think-about-AI`) used as reference for narrative layouts.

---

## 6. Business / Pricing (Current)

- Stripe subscription plumbing exists (schema, webhooks).
- Exact tiers (free vs paid vs partner) are not fully encoded in the UI yet; those live more in product strategy than code.

---

## 7. Roadmap (Explicitly Future / In Progress)

The following are **design/strategy goals** and partially implemented ideas, not fully shipped features:

- **Expanded CRM & Contacts**
  - Rich contacts, tagging, and relationship tracking.
  - Tighter link between people, orgs, and programs.

- **Marketing & Email Sequences**
  - Automated onboarding and educational sequences.
  - Campaigns tied to program milestones and homework completion.

- **Finance & Donor Flows**
  - Donor tiers, giving pages, embedded donation flows.
  - Reporting views for fundraising performance.

- **Strategic Roadmap Page**
  - Narrative roadmap editor and public view for each org.
  - Section‑level sharing and social‑ready artifacts.

- **Homework UX Enhancements**
  - TipTap “Assist” tools powered by AI with org‑aware prompts.
  - Better visualization of org profile fields that are “drafted via coursework” vs “manually edited”.

- **Onboarding Questionnaire**
  - Stepped, visually rich baseline questionnaire for founders.
  - Pre/post cohort comparisons surfaced on the admin dashboard.

- **“Nonprofit Operating System” Vision**
  - Converging LMS + CRM + finance + communications.
  - Future expansion to foundations, municipalities, and networks.

These roadmap items are captured in more detail in:

- `docs/RUNLOG-strategic-roadmap.md`
- `docs/RUNLOG.md`
- `docs/CODEX_RUNBOOK.md` (stepper and PR‑level tasks)
