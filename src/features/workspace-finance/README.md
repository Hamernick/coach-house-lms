# Workspace Finance

## Ownership

- Domain logic: `src/features/workspace-finance/lib/**`
- UI components: `src/features/workspace-finance/components/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/workspace-finance.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
- Adapt existing organization program data through
  `buildWorkspaceFinanceProgramInputs`; the drawer must not duplicate finance
  mapping rules.
- Load records and opportunities through the server-only
  `loadWorkspaceFinanceReadModel` orchestrator. Its providers fail independently
  so one unavailable source cannot hide Raised or the other feed.
- Finance records, engagement events, and Opportunities have local,
  organization-scoped storage contracts with forced RLS and authenticated
  select-only access. The authenticated workspace server loads their read
  providers into one serializable drawer model; the browser never queries these
  tables directly.
- `pnpm test:rls:finance` applies those migrations only inside a disposable
  local Postgres cluster and proves owner, explicit viewer, cross-tenant,
  platform-admin, anonymous, and direct-write boundaries.
- Opportunity discovery starts with a server-only source registry and scan-run
  ledger. Registered network sources require HTTPS plus an explicit domain
  allowlist; browsers and authenticated members receive no direct table access.
- Ingestion accepts at most 500 candidates from one enabled registered source,
  normalizes only bounded display fields, rejects duplicate or malformed rows,
  and upserts by organization, provider, and external ID without overwriting a
  member's New, Reviewing, Saved, or Dismissed workflow status.
- Grants.gov is the first source adapter. It posts bounded keyword searches only
  to the official `search2` endpoint, requests posted and forecasted results,
  enforces a 10-second timeout and 2 MB response limit, and maps no attachments,
  descriptions, tokens, or contact data. The registered source remains disabled
  until its API terms are explicitly accepted.
- Grants.gov rows trigger its required non-endorsement notice once at the
  Activity-feed level. The adapter is not scheduled or exposed as a browser
  action; no request occurs until a trusted server job calls it for an enabled
  source.
- The Stripe seam is read-only and bounded to 500 Balance Transactions per
  import. It requires connected-account context and explicit income
  classification, so ordinary Stripe charges never become Donations by guess.
  Refunds and fees remain outbound History records and never contribute to
  Sources. Connection authorization and database writes remain unimplemented.
- The view header owns one compact Connections popover. CSV is the built-in,
  provider-independent import path. The same popover can add one manual record
  through a focused Date, Amount, Source, Type, and optional Program dialog. It
  validates files up to 2 MB and 5,000 records, auto-detects common headings,
  then maps Date, Amount, Source, Record type, and Currency in one CSV dialog.
- CSV imports are normalized client-side and revalidated server-side in bounded
  200-record batches. The organization owner or an explicitly assigned Finance
  manager may import. A trusted server client writes recorded rows only after
  authorization; the browser retains no direct table-write grant.
- A CSV import may assign every row to one active organization program or leave
  the file organization-wide. The server verifies the program belongs to the
  active organization, and a database foreign key plus constraint trigger
  enforce the same boundary. Deleting a program clears only its record link.
- Exact-file fingerprints plus source row numbers make retries idempotent. A
  repeated file skips existing rows instead of duplicating Raised or History.
- Manual entry records only external activity that already occurred. It creates
  a USD `recorded` row through the same Finance-manager authorization and active
  organization boundary as CSV import, then adds the returned row to Activity,
  and History without route navigation. Recorded rows do not count toward
  Raised until verified and cannot move money.
- A Finance manager can verify a recorded History row with one bounded
  external reference and one PDF, JPG, or PNG evidence file. The private file is
  signature-checked, hashed, and served only after Finance authorization. One
  database transition stores immutable evidence, updates the record, and emits
  an immutable audit event; failed transitions remove the uploaded object.
- A verified row is immutable. A correction preserves that original as
  Corrected and atomically creates a linked Verified replacement with a reason,
  corrected values, and new evidence. Raised excludes the superseded original
  and counts the replacement; no correction moves money.
- Local development includes an explicit Sample data switch. It replaces the
  browser read model through component-local state, never navigates or writes
  sample rows, disables real record controls while active, and is absent from
  production unless
  `NEXT_PUBLIC_ENABLE_FINANCE_SAMPLE_DATA=true` is intentionally configured.
- Stripe remains an optional source in that popover. Do not show a Connect
  action until a real Stripe App authorization endpoint and approved read
  permissions exist.

## Current boundary

- The drawer has two views: Activity and History. The switcher stays
  left-aligned while both views share one centered `max-w-5xl` content frame
  with equal responsive padding.
- Activity is one lightweight dashboard, not a stack of cards. It contains one
  Raised metric with a compact source-composition rail and one chronological,
  paginated feed for transactions and opportunities.
- Activity pagination is component-local. Previous and Next replace only the
  six visible rows; they never navigate, rebuild the workspace route, or remount
  the drawer.
- Raised uses only verified USD inbound Finance records when record
  storage is connected. It excludes drafts, engagement events, opportunities,
  outbound records, and other currencies. Until records are connected, it uses
  existing program `raised_cents` estimates without fabricating source detail.
- Each program contributes one target: its explicit fundraising goal when set,
  otherwise its budget. Those targets remain part of the single Raised metric;
  they do not create a second Budgeted or Raising metric.
- The source rail measures Raised against the combined target while preserving
  the same Donations, Grants, Earned revenue, and Other breakdown used by
  History. Its muted remainder is the amount still needed. A compact program
  popover identifies each goal or budget target and its current Raising or
  Complete status. When Finance records are connected, each program's Raised
  amount and progress come from its linked verified USD inbound
  records; the organization metric still includes organization-wide records.
- Opportunities never count as Raised. A grant or other opportunity contributes
  only after it produces an explicitly classified inbound Finance record.
- Source composition is limited to Donations, Grants, Earned revenue, and Other.
  It derives inbound totals from the same records shown in History, so graph and
  table totals cannot drift. An empty dataset displays `$0.00` and an unfilled
  rail without inventing a source.
- History owns a five-column record table: Date, Source, Type, Amount, Status.
- Recorded is the status action for attaching private verification evidence;
  verified rows can reopen their reference and integrity-checked evidence
  without adding a column, card, or page.
- On narrow drawers, the same History records collapse into compact activity
  rows; the five-column table remains the desktop presentation.
- Linked program names appear as secondary record context in Activity and the
  existing History Source cell. They do not add another column or repeat the
  organization-wide Raised metric.
- Financial History rows use that same secondary context as a compact Program
  menu while the row remains Recorded. Verification locks its program with the
  other display fields; later changes use the linked correction flow.
  Reassignment updates Activity and program progress from the same local
  record model immediately, then persists through a manager-authorized,
  active-organization-scoped server action. A failed write rolls the row back;
  sample-data changes remain browser-only.
- Its activity view model accepts views, clicks, conversions, donations, and
  external finance records. Engagement events show an em dash for inapplicable
  Amount and Status fields; they never contribute to source totals.
- Finance engagement storage is limited to view, click, and conversion events.
  It stores no visitor identifier or free-form metadata; a private provider key
  prevents duplicate imports, and an optional record link connects a conversion
  to its resulting Finance record without copying transaction data.
- Raised, Activity, and History have quiet loading, error, empty, and populated
  states without adding cards or synthetic values.
- Opportunities include grants, contracts, sponsorships, awards, partnerships,
  and other provider-discovered possibilities. The drawer receives only title,
  source, due date, and workflow status; provider identifiers remain private.
- Each opportunity row owns one compact status control. Finance managers may
  move it between New, Reviewing, and Saved or dismiss it. Dismissed rows leave
  Activity and offer immediate Undo; every real update is scoped to the active
  organization on the server. Sample opportunity updates remain browser-only.
- It does not move money, fabricate metrics, connect Stripe, or expose public
  fundraising pages. Finance records are created only by an authorized manual
  entry or CSV import in the current slice.
