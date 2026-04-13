# Member Workspace Project Detail Inline Edit Audit — 2026-04-10

This audit covers the member workspace project detail route at `/projects/[id]` and treats the current ask literally:

- the page should be able to flip into an inline editable state instead of opening modal flows
- every visible content field should be classified as:
  - already persisted and reusable
  - persisted but not wired on this route
  - derived from other fields
  - dummy / fallback / misleading
  - missing a delete path or missing a first-class schema shape

## Current Route Truth

- The detail route currently passes only:
  - task create
  - task status toggle
  - task reorder
  - note create / update / delete
  - quick link create / update / delete
- It does not pass:
  - project update
  - project status update
  - project schedule update
  - full task update
  - task delete
- The page still mounts modal editors for tasks, notes, quick links, and assets instead of a page-wide inline edit state.

## Edit Surface Inventory

### Page Chrome

| Surface | Field / action | Source today | Current write path | Inline edit mode? | Status |
| --- | --- | --- | --- | --- | --- |
| Header chrome | Sidebar trigger | local UI state in shared sidebar shell | existing sidebar state | no | real UI chrome, not content |
| Header chrome | Breadcrumbs | derived from route + project name | none | no | derived viewer chrome |
| Header chrome | Copy link | `window.location.href` | existing utility action | no | real utility, not content |
| Header chrome | Meta panel toggle | local `showMeta` state | existing local state | no | real UI chrome, not content |
| Main body | Tab selection | local tabs state | existing local state | no | real UI chrome, not content |

### Project Header

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Header | Project name | `organization_projects.name` | `updateMemberWorkspaceProjectAction` exists but is not wired on this route | inline text input | ready, wiring needed |
| Header | Project status badge | `organization_projects.status` via backlog label mapping | `updateMemberWorkspaceProjectStatusAction` exists but is not wired on this route | segmented select / status menu | ready, wiring needed |
| Header | Project ID | `organization_projects.id` | none | read-only | real, should stay read-only |
| Header meta | Priority badge | `organization_projects.priority` | `updateMemberWorkspaceProjectAction` | inline select | ready, wiring needed |
| Header meta | Location label | hardcoded `"Organization workspace"` | none | text field only if we add a real source | dummy |
| Header meta | Sprint label | derived from `type_label + duration_label`, else date span | `updateMemberWorkspaceProjectAction` for `type_label` and `duration_label` | likely split into two separate controls | derived / overloaded |
| Header meta | Last sync | derived from `organization_projects.updated_at` | none | read-only | real, derived, should stay read-only |
| Header badge | `Assigned` pill | derived from `project.backlog.picUsers.length > 0` | none | likely replace with actual assignee summary, not an editable field | misleading |

### Overview Tab

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Overview | Summary paragraph | parsed from `organization_projects.description` | `updateMemberWorkspaceProjectAction` writes `description` | rich text / markdown block | persisted, but not first-class |
| Overview | In-scope list | parsed from `description`; falls back to tags/default copy | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Out-of-scope list | parsed from `description`; falls back to default copy | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Expected outcomes | parsed from `description`; falls back to project dates, task count, and member count | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Key features P0 | parsed from `description`; falls back to tags/tasks | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Key features P1 | parsed from `description`; falls back to tags/tasks | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Key features P2 | parsed from `description`; falls back to tags/tasks | only indirect through `description` | repeating list editor | derived / fallback |
| Overview | Timeline row title | `organization_tasks.title` if tasks exist; synthetic project row if none exist | `updateMemberWorkspaceTaskAction` exists but is not wired here | inline text input per row | mixed real + synthetic fallback |
| Overview | Timeline row start date | `organization_tasks.start_date`; synthetic project start if no tasks exist | `updateMemberWorkspaceTaskAction` exists but is not wired here | date picker | mixed real + synthetic fallback |
| Overview | Timeline row end date | `organization_tasks.end_date`; synthetic project end if no tasks exist | `updateMemberWorkspaceTaskAction` exists but is not wired here | date picker | mixed real + synthetic fallback |
| Overview | Timeline row status | task status or mapped project status | task status update exists; project status update exists but not wired here | status select | mixed real + synthetic fallback |

### Workstream Tab

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Workstream | Workstream group name | `organization_tasks.workstream_name`; falls back to task type buckets | `updateMemberWorkspaceTaskAction` exists but is not wired here | inline group title / task field | real when set, derived when blank |
| Workstream | Group progress meter | derived from task statuses inside group | none | read-only | real derived summary |
| Workstream | Add task | modal quick-create today | `createMemberWorkspaceTaskAction` | inline insert row | ready, UX change needed |
| Workstream task row | Checkbox status | `organization_tasks.status` | `updateMemberWorkspaceTaskStatusAction` is already wired | checkbox | ready |
| Workstream task row | Task title | `organization_tasks.title` | `updateMemberWorkspaceTaskAction` exists but is not wired here | inline text input | ready, wiring needed |
| Workstream task row | Due label | derived from `organization_tasks.end_date` | `updateMemberWorkspaceTaskAction` exists but is not wired here | date picker | ready, wiring needed |
| Workstream task row | Assignee avatar / name | `organization_task_assignees.user_id` joined through profiles | `updateMemberWorkspaceTaskAction` exists but is not wired here | assignee picker | ready, wiring needed |
| Workstream task row | Default assignee fallback | first project member if task has no assignee | none | no | misleading fallback |
| Workstream task row | Reorder handle | `organization_tasks.sort_order` | `updateMemberWorkspaceTaskOrderAction` is already wired | drag handle | ready |

### Tasks Tab

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Tasks header | Filter/search state | local client state | none | no | viewer tooling, not project content |
| Tasks header | `View` button | no handler | none | maybe remove or replace | dummy button |
| Tasks header | New task | modal quick-create today | `createMemberWorkspaceTaskAction` | inline insert row | ready, UX change needed |
| Task row | Title | `organization_tasks.title` | `updateMemberWorkspaceTaskAction` exists but is not wired here | inline text input | ready, wiring needed |
| Task row | Workstream badge | `organization_tasks.workstream_name` | `updateMemberWorkspaceTaskAction` exists but is not wired here | inline select / text input | ready, wiring needed |
| Task row | Status label | `organization_tasks.status` | only checkbox toggle is wired | inline select | partly ready |
| Task row | Due label | derived from `organization_tasks.end_date` | `updateMemberWorkspaceTaskAction` exists but is not wired here | date picker | ready, wiring needed |
| Task row | Assignee avatar | `organization_task_assignees.user_id` | `updateMemberWorkspaceTaskAction` exists but is not wired here | assignee picker | ready, wiring needed |
| Task row | Reorder handle | `organization_tasks.sort_order` | `updateMemberWorkspaceTaskOrderAction` is already wired | drag handle | ready |
| Task details for expanded inline editor | Description | `organization_tasks.description` | `updateMemberWorkspaceTaskAction` exists but is not wired here | text area / rich text | ready, hidden today |
| Task details for expanded inline editor | Start date | `organization_tasks.start_date` | `updateMemberWorkspaceTaskAction` exists but is not wired here | date picker | ready, hidden today |
| Task details for expanded inline editor | Priority | `organization_tasks.priority` | `updateMemberWorkspaceTaskAction` exists but is not wired here | select | ready, hidden today |
| Task details for expanded inline editor | Tag / classification | `organization_tasks.tag_label` plus `task_type` mapping | `updateMemberWorkspaceTaskAction` exists but is not wired here | select / free tag input | ready, but dual-field model is awkward |
| Task details for expanded inline editor | Delete task | no route-level action found | none | destructive inline action | missing server action |

### Notes Tab

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Notes | Add note | modal create today | `createMemberWorkspaceProjectNoteAction` | inline composer | ready, UX change needed |
| Notes card / table | Note title | `organization_project_notes.title` | create/update note actions are already wired | inline text input | ready |
| Notes preview / edit | Note content | `organization_project_notes.content` | create/update note actions are already wired | inline rich text / markdown | ready |
| Notes table | Added by | derived from `created_by` profile join | none | read-only | real derived metadata |
| Notes table | Added date | `organization_project_notes.created_at` | none | read-only | real derived metadata |
| Notes table | Status | `organization_project_notes.status` | create path hardcodes `completed`; no explicit status editor | select only if we expose workflow | persisted but not meaningfully editable |
| Notes icon / type | Note type | `organization_project_notes.note_type` | create path hardcodes `general`; no type picker | select if we want general/meeting/audio | persisted but not meaningfully editable |
| Notes | Delete note | `organization_project_notes.id` | delete note action is already wired | destructive inline action | ready |
| Notes | Audio upload flow | purely simulated toast path today | none | inline upload/transcription flow | mock / missing backend workflow |
| Notes preview | Audio transcript / AI summary fields | upstream type supports them, member workspace does not load them | none | read-only/generated subpanel | unsupported in current schema path |

### Assets & Files Tab

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Assets | Add file / link | modal add flow today | `/api/account/project-assets` POST | inline upload row / link row | ready, UX change needed |
| Assets card / table | Asset name | `organization_project_assets.name` | assets PATCH route | inline text input | ready |
| Assets editor | Asset description | `organization_project_assets.description` | assets PATCH route | inline text area | ready |
| Assets card / table | Asset type icon | `organization_project_assets.asset_type` or inferred from link/file name | auto inferred on create/update | likely read-only | real but inferred |
| Assets card / table | Link/file size label | `size_bytes` for uploads, `Link` or `0` for external links | none | read-only | partly real |
| Assets table | Added by | derived from `created_by` profile join | none | read-only | real derived metadata |
| Assets table | Added date | `organization_project_assets.created_at` | none | read-only | real derived metadata |
| Link asset editor | External URL | `organization_project_assets.external_url` | assets PATCH route | inline URL input | ready for link assets |
| Uploaded asset editor | Replace uploaded file | not supported | none | file replace action | missing workflow |
| Assets | Delete asset | `organization_project_assets.id` | assets DELETE route | destructive inline action | ready |

### Right Meta Panel — Time

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Time card | Estimate | `duration_label`, else day span from project dates | `updateMemberWorkspaceProjectAction` | likely separate effort field, not raw text badge | overloaded / derived |
| Time card | Due date | `organization_projects.end_date` | `updateMemberWorkspaceProjectScheduleAction` exists but is not wired here | date picker | ready, wiring needed |
| Time card | Days remaining | derived from end date | none | read-only | real derived metadata |
| Time card | Progress bar | `organization_projects.progress` | no route-level write on detail page; project update action does not expose dedicated progress UX here | slider or computed summary | persisted but effectively read-only here |

### Right Meta Panel — Backlog

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Backlog | Status | mapped from `organization_projects.status` | `updateMemberWorkspaceProjectStatusAction` exists but is not wired here | select | ready, wiring needed |
| Backlog | Group | `organization_projects.type_label`, else `General` | `updateMemberWorkspaceProjectAction` | classification select / text input | ready, but overloaded with sprint label |
| Backlog | Priority | `organization_projects.priority` | `updateMemberWorkspaceProjectAction` | select | ready, wiring needed |
| Backlog | Label badge | first item in `organization_projects.tags`, else `Project` | `updateMemberWorkspaceProjectAction` | tag picker | ready, but currently single-badge projection of multi-tag source |
| Backlog | PIC users | `organization_projects.member_labels` mapped to people by name | `updateMemberWorkspaceProjectAction` writes plain string labels | multi-person picker | persisted, but weak data model |
| Backlog | Support users | always `[]` | none | multi-person picker | dummy / missing model |

### Right Meta Panel — Organization Card

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Organization card | Organization status | `organizations.status` via organization summary loader | outside this page | likely keep read-only here | real org-level data |
| Organization card | Organization name | `organizations.profile.name` fallback chain | outside this page | likely keep read-only here | real, but org-level |
| Organization card | Website link | `organizations.profile.website/publicUrl/public_url` | outside this page | likely keep read-only here | real, but profile JSON |
| Organization card | Contact name/email | owner or first member from org summary | outside this page | likely keep read-only here | derived org-level display |

### Right Meta Panel — Quick Links

| Surface | Field / action | Source today | Current write path | Inline control | Status |
| --- | --- | --- | --- | --- | --- |
| Quick links | Add link | modal dialog today | quick link create action is already wired | inline row | ready, UX change needed |
| Quick links | Link title | `organization_project_quick_links.name` | quick link update action is already wired | inline text input | ready |
| Quick links | Link URL | `organization_project_quick_links.url` | quick link update action is already wired | inline URL input | ready |
| Quick links | Link icon/type | inferred from title/url into `link_type` | quick link actions infer this automatically | likely read-only | real but inferred |
| Quick links | Link size label | `size_mb`, currently written as `0` on create | quick link create always writes `0` | probably hide or replace | misleading |
| Quick links | Delete link | quick link id | quick link delete action is already wired | destructive inline action | ready |
| Quick links fallback | Sidebar links when no explicit links exist | first three project files | none | no | misleading fallback, not curated quick links |

## Highest-Value Gaps Before Inline Editing

### 1. The route is missing the core write actions needed for inline mode

- `updateMemberWorkspaceProjectAction`
- `updateMemberWorkspaceProjectStatusAction`
- `updateMemberWorkspaceProjectScheduleAction`
- `updateMemberWorkspaceTaskAction`
- a new `deleteMemberWorkspaceTaskAction`

Without those, the page cannot support a stable inline edit mode for the actual content already shown on screen.

### 2. The overview content is stored in the wrong shape for inline editing

Today these fields are parsed out of a single `organization_projects.description` blob:

- summary paragraph
- in scope
- out of scope
- expected outcomes
- key features P0/P1/P2

That means the page is displaying structured UI backed by unstructured storage plus fallback synthesis. Inline editing will be brittle unless we either:

- keep a single rich overview editor and regenerate the sections from one canonical description field
- or add first-class structured fields / a child table for overview content

### 3. Several visible fields are dummy or misleading

- `locationLabel` is hardcoded to `Organization workspace`
- support users are always empty
- quick links fall back to files when no explicit quick links exist
- quick link `size_mb` is effectively fake for normal links
- workstream rows assign the first project member when a task has no assignee
- the `Assigned` badge in the header does not mean “assigned to me”
- the Tasks tab `View` button has no behavior
- note audio upload is simulated only

These should be corrected before the page gets an always-on inline edit mode, otherwise the edit state will expose fake data as if it were authoritative.

### 4. Project member ownership is persisted as plain strings, not a relation

`organization_projects.member_labels` is a `string[]`, not a normalized join. That is enough for display, but it is weak for:

- reliable PIC editing
- support-role editing
- current-user assignment checks
- avatar resolution
- permission-aware people pickers

If project-level staffing becomes important on this page, a relational project-members table is the cleaner long-term model.

## Recommended Phase Order

### Phase 1 — Inline Mode Without Schema Changes

Ship inline editing for fields that are already persisted and can reuse existing write paths:

- project name
- project status
- priority
- start date
- end date
- tags
- task title
- task status
- task dates
- task assignee
- task workstream
- task priority
- task description
- note title/content
- quick link title/url
- asset name/description/link

### Phase 2 — Remove Misleading Display Fallbacks

- drop the fake location label
- stop falling back quick links to files
- remove or fix the dead `View` button
- replace the fake `Assigned` badge logic
- stop showing a fake assignee on unassigned tasks

### Phase 3 — Fix Data Modeling For The Overview / Teaming Layer

- decide whether overview stays one canonical rich text block or becomes structured fields
- add a true project membership / support-role model if the header and backlog panel should be editable
- decide whether progress is user-entered or derived from tasks
- decide whether note types and audio processing are real product requirements

## Build Checklist For The Actual Inline-Edit Pass

- add a page-level `isEditing` state instead of opening task/link/note/file dialogs
- pass project and full task update actions into the route
- add task delete
- replace modal-only quick-create flows with inline row or section editors
- choose a single source of truth for overview sections
- remove dummy and fallback displays before exposing inline editing
- keep metadata-only fields read-only:
  - project id
  - last sync
  - created by / added by
  - added date
  - days remaining
