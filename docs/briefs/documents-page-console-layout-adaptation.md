# Documents Page Adaptation Notes (Based on Console-Style Screenshot)

## Context

Goal: adapt the current Coach House documents experience into a cleaner, high-clarity filing system inspired by the screenshot layout, while keeping Accelerator roadmap editing flows intact.

What this system needs to support:
- Find documents quickly.
- View and edit documents quickly.
- Handle multiple document categories.
- Treat roadmap sections as first-class documents in the same filing system.
- Keep existing roadmap editing/presentation locations (Accelerator + Roadmap routes).

Current implementation references:
- `src/app/(dashboard)/my-organization/documents/page.tsx`
- `src/components/organization/org-profile-card/tabs/documents-tab.tsx`
- `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/programs-reports.tsx`
- `src/lib/roadmap.ts`

---

## Screenshot Teardown (What It Is Doing Well)

The screenshot uses a control-console pattern with this vertical structure:

1. Utility header bar (`Organization policies`) with global context.
2. Prominent announcement panel with CTA buttons.
3. Page title + short explanatory text.
4. KPI summary strip with 3-4 compact cards.
5. Dense filter/search toolbar.
6. High-density table with status-first rows and right-edge actions.

### Functional patterns worth borrowing

- Status-first scanning:
  Each row starts with a state signal (icon + label), so users triage quickly.
- Progressive detail:
  Summary cards give “at a glance” health; table handles detail.
- Always-available filtering:
  Filter chips and search are visible above the table.
- Action containment:
  Row-level kebab menu avoids clutter while preserving power.
- Enterprise readability:
  Tight spacing, restrained color usage, and clear column alignment make large lists manageable.

### UX strengths

- Excellent information density without becoming unreadable.
- Strong “this is a control center” feeling.
- Fast cognition loop: status -> filter -> action.

### UX pitfalls to avoid copying directly

- Too much “policy/admin” complexity for nonprofit operators.
- Overly technical labels.
- Too many adjacent controls can create fatigue on smaller screens.

---

## What To Keep, Remove, and Adapt

## Keep

- Top-level title + helper copy.
- A compact summary strip (3-4 cards max).
- Sticky filter/search row before the list.
- Tabular list with sortable columns.
- Per-row overflow menu for secondary actions.
- Status dots/chips and small icons for scanning.

## Remove

- Announcement/promo card at top (not needed on every visit).
- “Dry-run,” “inherit parent policy,” and policy-source concepts.
- Security-insight column equivalents that do not map to document work.
- Excess admin terminology.

## Adapt

- Replace “policy” mental model with “document filing system.”
- Replace technical columns with document-specific ones.
- Replace “active/inactive” with meaningful doc states (Draft, Missing, Ready, Published, Archived).
- Convert filters to nonprofit workflow dimensions (category, source, visibility, status).

---

## Recommended Information Architecture for Coach House Documents

## Page Header

- Title: `Documents`
- Subtitle: `Manage roadmap sections and organization files in one place.`
- Primary CTA: `Upload file`
- Secondary CTA: `Create folder` (optional phase 2) or `New note` (if supported)

## Summary Strip (4 cards max)

1. `Total documents`
2. `Roadmap documents`
3. `Files uploaded`
4. `Needs attention` (missing required or stale docs)

Optional 5th (if space permits desktop only): `Publicly shared`

## Filter + Search Row

Recommended controls:
- Search input (`Search by title, tag, or section…`)
- Filter chips/dropdowns:
  - `Category`
  - `Source` (`Roadmap`, `Upload`, `Generated`)
  - `Visibility` (`Private`, `Public`, `Team`)
  - `Status`
- Quick toggles:
  - `Only missing`
  - `Only roadmap`
  - `Updated in last 30 days`

## Document Table

Suggested columns:
1. `Status`
2. `Name`
3. `Category`
4. `Source`
5. `Visibility`
6. `Last updated`
7. `Owner` (optional)
8. `Actions`

Row actions:
- `View`
- `Edit`
- `Replace file` (upload docs)
- `Open roadmap section` (roadmap docs)
- `Download`
- `Copy link` (if shareable)
- `Move category`
- `Archive`

---

## Category Model (Proposed)

Use a hybrid model that supports both classic files and roadmap-derived docs.

Primary categories:
- `Roadmap` (auto-generated from roadmap sections)
- `Governance`
- `Compliance`
- `Finance`
- `Fundraising`
- `Programs`
- `Operations`
- `Communications`
- `Board`
- `Public-facing`

This keeps categories intuitive while allowing roadmap sections to be grouped meaningfully.

---

## Roadmap-as-Document Mapping (Core Requirement)

Treat each roadmap section as a document record in the index (not necessarily a PDF file).

Source roadmap sections (from `src/lib/roadmap.ts`) include:
- Origin Story
- Need
- Mission, Vision, Values
- Theory of Change
- Program
- Evaluation
- People
- Budget
- Fundraising
- Strategy
- Presentation
- Treasure Map / CRM Plan
- Communications
- Board Strategy
- Calendar
- Handbook
- Next Actions

Each roadmap section record should expose:
- Document name (section title)
- Category (auto-suggested)
- Source = `Roadmap`
- Status (from roadmap section status)
- Last updated (from roadmap `lastUpdated`)
- Visibility (from section `isPublic`, if applicable)
- Primary action = `Edit in Roadmap`

### Recommended status mapping

Roadmap status -> Document status:
- `not_started` -> `Missing`
- `in_progress` -> `Draft`
- `complete` -> `Ready`

Optional published state:
- if section is complete + public enabled -> `Published`

---

## Current System Gaps (Observed)

Current docs page is a fixed card list of required PDFs only:
- 501(c)(3) determination letter
- Articles of incorporation
- Bylaws
- State registration
- Certificate of good standing
- W-9
- Tax exempt certificate

Gaps versus desired system:
- No unified index of roadmap + files.
- No global search/filter/sort.
- No category layer.
- No status-centric table view.
- No consolidated list of private/public/roadmap artifacts.

---

## Proposed Copy (Updated for Reality)

## Header copy options

Option A (recommended):
- Title: `Documents`
- Subtitle: `Your filing system for roadmap sections, compliance files, and shared organization documents.`

Option B:
- Title: `Document Center`
- Subtitle: `Find, manage, and update roadmap and organization documents in one workspace.`

## Summary card copy

- `Total documents`
- `Roadmap sections`
- `Uploaded files`
- `Needs attention`

## Empty state copy

If no files uploaded:
- `No files uploaded yet`
- `Start by uploading core documents or completing roadmap sections to build your document library.`

If search/filter returns none:
- `No documents match this view`
- `Try removing a filter or searching by another keyword.`

## Row action copy

- `View`
- `Edit`
- `Open in roadmap`
- `Replace file`
- `Download`
- `Move`
- `Archive`

---

## Layout Adaptation by Screenshot Section

## Section 1: Top utility bar

Screenshot equivalent: `Organization policies`
Coach House adaptation:
- Keep minimal breadcrumb/context label only if needed (`My Organization / Documents`).
- Otherwise remove for cleaner first paint.

## Section 2: Announcement banner

Screenshot equivalent: baseline recommendation card.
Coach House adaptation:
- Remove from main layout.
- If needed, use dismissible inline notices only for one-time onboarding tips.

## Section 3: Page intro

Screenshot equivalent: `Policies for project...`
Coach House adaptation:
- Keep as page title + subtitle with plain language.

## Section 4: KPI strip

Screenshot equivalent: active policy counts.
Coach House adaptation:
- Keep, but use document progress metrics.
- Cards should be clickable filters (e.g., click `Needs attention` -> filtered list).

## Section 5: Filter toolbar

Screenshot equivalent: enforcement filter chips + search.
Coach House adaptation:
- Keep this strongly.
- Replace filter language with status/category/source/visibility.

## Section 6: Main table

Screenshot equivalent: policy table with dense columns.
Coach House adaptation:
- Keep dense but readable table.
- Use first column for status dot + label.
- Keep actions menu at right.

---

## Interaction and Behavior Recommendations

- Keep keyboard-first table navigation and menu controls.
- Preserve focus when dialogs/drawers close.
- Use sticky filter bar when scrolling long lists.
- Do not close modals on wheel scroll; trap scroll inside modal (`overscroll-behavior: contain`).
- Persist filters in URL query params for shareable views.
- Use locale-aware date formatting in `Last updated`.

---

## Suggested Mobile Pattern

Desktop table should collapse to stacked cards on mobile:
- First row: status + name + quick action.
- Second row: category/source/visibility chips.
- Third row: last updated + overflow menu.

Keep filter controls in a mobile drawer (`Filters`) rather than inline.

---

## Recommended Implementation Path

## Phase 1 (Fastest, no schema migration)

- Keep existing private document storage APIs (`/api/account/org-documents`).
- Build a unified “document index” in UI by combining:
  - existing uploaded docs from `profile.documents`
  - virtual roadmap docs derived from `profile.roadmap.sections`
- Render a table + filters + summary cards.
- Route roadmap rows to existing roadmap editor paths.

Pros:
- Fastest delivery.
- No risky data migration.
- Immediate user value.

## Phase 2 (Normalization)

- Add a normalized `organization_documents` table for indexing metadata:
  - `id`, `org_id`, `source_type`, `source_ref`, `name`, `category`, `status`, `visibility`, `updated_at`, `tags`, etc.
- Backfill existing docs + roadmap references.
- Keep storage paths where they are; normalize metadata first.

Pros:
- Better scalability.
- Better search/sort/reporting.
- Future automation becomes easier.

---

## What We Can Safely De-Scope Right Now

To keep this focused and shippable, de-scope initially:
- Advanced recommendations panel.
- Policy-style inheritance complexity.
- Multi-level folder trees.
- Bulk edit flows.
- Audit-log timeline UI.
- Cross-org sharing controls.

Start with one clean index, strong filters, and reliable edit/view actions.

---

## Proposed “v1” Wireframe (Text)

```text
Documents
Manage roadmap sections and organization files in one place.

[Total documents] [Roadmap sections] [Uploaded files] [Needs attention]

[Search............................] [Category v] [Source v] [Visibility v] [Status v] [Only missing]

| Status   | Name                         | Category   | Source   | Visibility | Last updated | Actions |
| Missing  | Board Handbook               | Board      | Roadmap  | Private    | --           | ...     |
| Draft    | Theory of Change             | Roadmap    | Roadmap  | Private    | 2 days ago   | ...     |
| Ready    | 501(c)(3) determination      | Compliance | Upload   | Private    | Jan 12, 2026 | ...     |
| Published| Program Overview 2026        | Programs   | Upload   | Public     | Feb 1, 2026  | ...     |
```

---

## Final Recommendation

Use the screenshot as a layout and interaction reference, not a content template.

For Coach House, the winning adaptation is:
- Keep the console-style clarity (summary strip + filters + status table).
- Remove enterprise policy complexity.
- Merge roadmap sections and files into one searchable index.
- Preserve current roadmap editing locations by linking from document rows.

This will give users one clean filing system for everything without disrupting the existing accelerator experience.
