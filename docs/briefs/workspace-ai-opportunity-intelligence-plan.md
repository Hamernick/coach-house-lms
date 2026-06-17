# Workspace AI, Credits, And Opportunity Intelligence Plan
Status: Active
Owner: Caleb + Codex
Priority: P0
Target release: Multi-phase product build
Last updated: 2026-06-05

---

## Purpose

Build the product layer that turns Coach House from a static workspace into an intelligent operating canvas for nonprofit builders: secure documents, fiscal sponsorship workflows, coach review, credit-backed AI actions, opportunity discovery, and activity monitoring.

This is not a one-shot UI pass. The work must establish the backend, security, credit, observability, and internal tooling layers before large AI/automation features are exposed in the canvas.

## Current State

- The workspace canvas already has card/node infrastructure, React Flow-style placement, data drawer work, document surfaces, fiscal sponsorship prototype work, activity data, and many active canvas edits in the worktree.
- Fiscal sponsorship is still mostly prototype UI: placeholder docs, placeholder signing/action behavior, and no complete secure document execution path.
- Billing exists around Stripe subscription checkout and webhook idempotency, but there is not yet an AI credit purchase/reservation/spend/refund ledger.
- OpenAI usage exists only as an internal SQL helper at `src/app/api/ai/sql/route.ts`; there is no product AI runtime, action manifest system, context retrieval layer, streaming delivery layer, or model registry.
- Observability already exists: Vercel Analytics, Speed Insights, JSON logs, OTel registration, and Supabase journey telemetry. The AI/credit/opportunity layer must extend that instead of inventing a parallel system.
- The account settings dialog exists and should become the entry point for billing/credits. Billing should not be a standalone sidebar destination; the sidebar nav item should open account settings to the Billing/Usage tab.

## Current Next Build Slice

Use this section as the first pickup point after context compaction. The full plan below remains the product and architecture contract, but the next implementation pass should stay narrow.

What is now stabilized:

- Fiscal sponsorship node placement is treated as user-owned canvas geometry. Do not re-run base/tutorial layout when a user drags, reloads, navigates, opens/closes, or uses viewport controls.
- The workspace viewport toolbar no longer exposes `Reset view`; it keeps zoom, recenter, and help only.
- Billing should be built into account settings, not as a standalone sidebar page.

Next build order:

1. Foundation audit document/update:
   - Inventory account settings dialog ownership, sidebar/account-menu action ownership, Stripe checkout/webhook code, existing billing tables, existing OpenAI route, document storage, fiscal sponsorship UI, and workspace telemetry.
   - Record exact file owners before building.
2. Account Billing/Usage shell:
   - Add an account settings tab entry for `Usage` or `Billing`.
   - Build the screenshot-derived balance cards and purchase modal shell with mocked/empty data.
   - Add the sidebar/account action that opens account settings directly to that tab.
   - No Stripe checkout yet.
3. Credit ledger schema:
   - Add migrations for balances, ledger entries, reservations, packages, purchase records, caps, and admin audit fields.
   - Add RLS and service-role-only mutation paths.
   - Add acceptance/RLS coverage before UI connects to real data.
4. Stripe credit checkout:
   - Create checkout sessions for credit packages.
   - Fulfill credits only from verified webhook events.
   - Use Stripe event id idempotency and app-ledger idempotency.
5. AI action foundation:
   - Add typed action manifest, model registry, context builder interface, job table, event stream table, credit reservation/spend/refund hooks, and audit trail.
   - Do not expose member-facing free-form AI until the action/runtime/credit/security path is proven.
6. First member-facing AI action:
   - Choose one low-risk action, likely `summarize workspace context` or `draft grant opportunity review`.
   - Require context preview, estimated credits, human confirmation, saved artifact, spend history, and retry/error states.

Do not start with:

- A broad AI chat window.
- Internet browsing from arbitrary prompts.
- Auto-apply, auto-send, auto-sign, or auto-publish actions.
- Final Frame restyling of every canvas node before the billing/credit/runtime foundation exists.

## Product Principles

- The canvas is the work surface. Nodes show live state, suggested actions, and trustworthy status. They should not become decorative cards.
- AI suggests, drafts, summarizes, matches, and prepares. Humans confirm sending, signing, publishing, sharing, applying, buying, and spending above cap.
- Secure source access comes before model access. The model never decides what it is allowed to read.
- Stripe handles payments and receipts. Coach House owns the application credit ledger, reservations, spend history, caps, and refunds.
- Opportunity intelligence is a registered-source pipeline, not arbitrary internet browsing from a prompt.
- Coaches and super admins need operational tooling from day one. If the system can recommend or spend credits, internal staff need traceability and override controls.

## Explicit Non-Goals For V1

- Do not build a free-form agent that can browse any URL, submit applications, send emails, publish social posts, or sign documents without explicit human confirmation.
- Do not store payment details outside Stripe.
- Do not expose OpenAI API keys, Supabase service-role keys, DocuSeal keys, Stripe secrets, or source API credentials to the browser.
- Do not add AI features that bypass RLS, organization membership, role checks, document visibility, or audit logging.
- Do not replace coaches with AI. AI should promote coach/grant-writer review for high-stakes actions.

## Screenshot-Derived Billing Flow

The provided billing screenshots show a quiet account-style usage surface, not a marketing pricing page.

Observed flow:

- Account area has top tabs: `Usage` and `Code review`.
- `Usage` tab shows `Balance`.
- Helper copy says usage draws from a shared agentic usage limit.
- Two large usage cards appear in the first row:
  - `5 hour usage limit`, percent remaining, horizontal progress bar, reset timestamp.
  - `Weekly usage limit`, percent remaining, horizontal progress bar.
- A smaller `Credits remaining` card appears below with a plus icon button in the top-right corner.
- Pressing plus opens a modal.
- Modal title: `Buy more credits`.
- Modal body explains that credits extend use beyond plan limits and includes a `View rate card` link.
- Amount picker is a large single-row select/dropdown: `1,000 credits` on the left and `$40.00` on the right with a chevron.
- Footer actions are `Cancel` and `Next`, right-aligned.

Coach House adaptation:

- Sidebar nav item label: `Account` or `Billing`, depending on final nav IA, opens `AccountSettingsDialog`.
- Account settings gets a `Usage` or `Billing` tab.
- The account dialog owns credit balance, plan allowance, purchase modal, usage history, caps, and payment method links.
- The sidebar must not route users to a separate billing page unless we later need a full invoices/admin page.

Billing UI anti-patterns:

- Do not put billing as a marketing-style pricing hero inside the app.
- Do not make each metric a colorful SaaS card pile.
- Do not show raw token counts as the primary user concept.
- Do not hide spend history behind only Stripe invoices; users need app-level AI credit history.
- Do not use the sidebar itself as the billing surface.

## Existing UI Pattern Contract

### Canvas Nodes

All workspace canvas nodes should move toward the fiscal sponsorship tile's Frame-style structure, not one-off card layouts.

Required frame anatomy:

- Outer frame: solid readable surface, border, shadow, stable radius, stable min/max dimensions.
- Header: icon or mark, title, compact status/metadata, primary quick action when useful.
- Body: dense task/state content with predictable spacing and no marketing copy.
- List rows: icon/checkbox/status dot, label, metadata, optional right-side action.
- Footer/action band: explicit actions with icons where possible; destructive or external actions require confirmation.
- Empty state: one short operational sentence and one clear next action.
- Loading state: skeleton rows that preserve exact dimensions.
- Error state: recoverable action and trace id when applicable.

Canvas node anti-patterns:

- Do not nest cards inside cards.
- Do not use transparent surfaces when text must be readable over the canvas.
- Do not let dynamic content resize the node unexpectedly.
- Do not show multiple unrelated CTAs with equal weight.
- Do not expose raw AI/backend terminology such as `job id`, `embedding`, `vector`, or `token` to members.
- Do not auto-open or reposition nodes after the user has placed them.

### Account Billing Dialog

Pattern:

- Existing account settings dialog shell.
- Tabs for account sections.
- Billing/Usage tab contains balance cards, caps, credit purchase modal, usage history, and payment links.
- Purchase modal follows the screenshot pattern: title, short copy, amount select, Cancel/Next.

Anti-pattern:

- No billing page as a standalone app destination for member users in v1.
- No plan upgrade maze before users can buy credits.
- No purchase action that skips confirmation or webhook-backed fulfillment.

### AI Action Panel

Pattern:

- Action title and one-sentence intent.
- Context summary: what will be used, with source counts and sensitive-source warnings.
- Cost estimate: credits reserved, cap, and refund behavior.
- Output mode: draft, saved doc, task, coach review, or activity item.
- Streaming progress: context, draft, save, final.
- Final state: saved artifact link, usage event, next action.

Anti-pattern:

- No free-form "agent is thinking" wall of text.
- No AI action without cost estimate when it may spend paid credits.
- No hidden use of private documents.
- No generated application/send/sign step without human confirmation.

### Coach Dashboard Tasks

Pattern:

- Use the existing admin/task UI language and small action buttons.
- Two-column layout:
  - Left: member/org queue grouped by urgency.
  - Right: selected task detail, evidence, recommended action, and history.
- Task rows use checkbox/status style, org/member metadata, due date, and source.
- Include AI-generated context as evidence, not as final truth.

Anti-pattern:

- No single endless column of coach tasks.
- No AI-only explanation without source references.
- No shared super-admin-only view as the final coach experience; coaches need scoped per-coach queues.

## User Journey Contracts

Every new flow must be represented in the user journey atlas with:

- Entry point.
- User intent.
- Surface.
- Required state.
- Primary action.
- System event.
- Success state.
- Recovery state.
- Telemetry/activity event.
- Next handoff.

### Journey: Buy AI Credits

1. User opens account menu or sidebar account item.
2. App opens account settings dialog to Billing/Usage tab.
3. User sees included allowance, purchased credits, spend caps, and history.
4. User presses plus on `Credits remaining`.
5. Purchase modal opens with amount picker.
6. User selects package and presses `Next`.
7. Server creates Stripe Checkout session for the selected credit package.
8. User pays in Stripe.
9. Stripe webhook verifies signature and idempotently records payment.
10. Server creates an app credit grant and ledger entry.
11. Billing tab refreshes balance and history.
12. Telemetry records checkout start, checkout complete, credit grant created.

Recovery:

- If checkout is cancelled, return to Billing tab with non-destructive cancelled state.
- If webhook is delayed, show `Payment pending` with refresh.
- If webhook fails, internal Billing Ops queue shows the event and error.

### Journey: Run An AI Action

1. User presses an AI-enabled action from a node, document, activity item, or roadmap editor.
2. Server resolves the action manifest.
3. Server checks membership, role, plan, credit balance, spend cap, and action permission.
4. Server builds context from allowed sources only.
5. UI shows context summary and estimated credit reservation.
6. User confirms if spend or high-impact action requires confirmation.
7. Server creates `ai_jobs` row and `ai_credit_reservations` row.
8. Route streams progress and partial output.
9. Server writes final artifact, settles actual credit spend, refunds unused reservation.
10. UI shows saved draft/document/task and next action.
11. Activity monitor records the action with source references.

Recovery:

- If context is missing, show exactly what is missing and offer a task/doc upload path.
- If credits are insufficient, open Billing tab purchase modal.
- If model/tool fails, refund reserved credits unless partial output was intentionally saved.
- If output requires coach review, create coach task instead of presenting it as ready-to-send.

### Journey: Opportunity Discovery

1. User completes or updates org profile, roadmap, documents, readiness answers, social links, and funding preferences.
2. Scheduled scan or explicit `Scan opportunities` action creates scan jobs.
3. Source dispatcher fetches registered sources only.
4. Raw snapshots are stored with source trust level and hash.
5. Normalizer extracts structured opportunity records.
6. Matcher evaluates org fit deterministically first, then uses AI for explanation/summarization where needed.
7. Activity monitor shows new opportunities with fit, deadline, source, why it matches, and missing data.
8. User saves, dismisses, assigns to coach, creates task, drafts response, or requests grant-writer review.
9. Drafting uses the AI action flow and credit ledger.
10. Coach dashboard receives review tasks where user requested review or policy requires review.

Recovery:

- Expired opportunities are archived but remain visible in history.
- Low-confidence opportunities are quarantined for staff QA.
- Sources with repeated failures are paused and shown in AI Ops.

### Journey: Fiscal Sponsorship Documents

1. User opens fiscal sponsorship node.
2. Node shows real checklist: eligibility, required docs, agreement, signing, submitted/stored status.
3. User opens a document action.
4. Server checks org role, document access, and fiscal workflow state.
5. User can preview, fill, sign, save, or request review depending on document status.
6. Signing goes through the chosen e-sign provider flow.
7. Signed document is stored in private org storage and indexed in Documents.
8. Activity monitor records signed/stored/review events.
9. Coach/admin dashboard receives review or exception tasks.

Recovery:

- Failed signing returns to the document row with provider error and retry.
- Missing required org data opens the specific profile/document editor surface.
- Expired signing links are regenerated server-side after permission check.

### Journey: Coach Review

1. Coach opens coach dashboard.
2. Dashboard shows two-column queue with assigned orgs and tasks.
3. Coach selects task.
4. Detail panel shows member context, source artifacts, AI draft, history, and recommended action.
5. Coach can approve, request changes, assign back, schedule session, or mark reviewed.
6. User sees the review result in workspace activity and relevant node.

Recovery:

- If coach is not assigned to org, route denies access even if the coach has general app access.
- If AI trace is unavailable, task still shows source artifacts and manual note path.

## Backend Architecture

### AI Action Manifest

Every AI capability must be declared in a typed manifest. The UI never calls a raw prompt endpoint.

Required manifest fields:

```ts
type AiActionManifest = {
  id: string
  version: number
  label: string
  description: string
  surface: "workspace_node" | "document" | "roadmap" | "activity" | "coach_dashboard" | "account"
  modelAlias: string
  allowedRoles: Array<"owner" | "admin" | "staff" | "coach" | "member" | "super_admin">
  contextScopes: AiContextScope[]
  tools: AiToolPermission[]
  outputSchemaId: string
  defaultDelivery: "stream" | "background"
  maxEstimatedCredits: number
  requiresUserConfirmation: boolean
  requiresCoachReview: boolean
  storesArtifact: boolean
  auditLevel: "standard" | "sensitive" | "regulated"
}
```

Initial manifests:

- `opportunities.scan_sources`
- `opportunities.match_org`
- `opportunities.summarize_match`
- `grant.draft_response`
- `documents.summarize`
- `documents.prepare_signing_packet`
- `fiscal.review_readiness`
- `roadmap.prefill_from_context`
- `communications.draft_social_update`
- `coach.prepare_review_summary`
- `voice.workspace_coach_session`

### Context Builder

The context builder is a server-only service that returns source snippets plus source metadata.

Rules:

- Resolve active org server-side.
- Enforce org membership and role.
- Enforce document visibility and storage policy.
- Minimize context to the action need.
- Return source references with ids, titles, timestamps, and sensitivity labels.
- Never return service-role-only data to the client.
- Never let model output request additional context outside the manifest scopes.

Context source types:

- Organization profile.
- Roadmap sections and generated strategic roadmap content.
- Accelerator readiness answers and homework submissions.
- Documents index and permitted document snippets.
- Fiscal sponsorship workflow state.
- People/team records.
- Communications/social channel metadata.
- Activity monitor events.
- Saved opportunities and prior AI artifacts.

### Tool Runner

Tool execution is server-owned.

Allowed v1 tool categories:

- Read context.
- Search registered source snapshots.
- Create draft artifact.
- Create task.
- Save document metadata.
- Create coach review request.
- Reserve credits.
- Settle credits.

Blocked until later:

- Send email.
- Publish social content.
- Submit grant application.
- Sign on behalf of user.
- Share private document externally.
- Scan arbitrary URLs.

### AI Job Runtime

Tables:

- `ai_action_manifests`: versioned registry for enabled actions.
- `ai_jobs`: one row per run.
- `ai_job_events`: progress events and trace milestones.
- `ai_job_context_refs`: context references used by a job.
- `ai_artifacts`: final outputs and draft pointers.
- `ai_tool_calls`: tool call audit rows.
- `ai_context_access_audit`: who/what accessed sensitive source context.

Job statuses:

- `queued`
- `running`
- `waiting_for_confirmation`
- `succeeded`
- `failed`
- `cancelled`
- `refunded`
- `review_required`

Job event stages:

- `created`
- `auth_checked`
- `credits_reserved`
- `context_resolved`
- `model_started`
- `tool_called`
- `artifact_saved`
- `credits_settled`
- `completed`

### Streaming Delivery

- Use Next.js Route Handlers for streaming AI output and progress events.
- Use Server-Sent Events or readable streams for first implementation.
- Persist job events so the UI can recover after navigation or refresh.
- Background jobs should be resumable from `ai_jobs`, not client memory.
- The UI should show structured progress, not raw model/tool logs.

## Credit And Billing Architecture

### Product Model

Initial working assumption:

- Free/member preview: limited included AI actions for onboarding and low-cost summaries.
- Organization Builder plan: monthly included credit allowance for drafting/summarization.
- Operations Support plan: larger allowance plus higher coach-review priority.
- Purchased credits: add-on packages for AI actions beyond included allowance.

Initial package assumption:

- `250 credits` for `$10`
- `1,000 credits` for `$40`
- `5,000 credits` for `$180`

These are placeholders for unit economics, but the screenshot explicitly establishes `1,000 credits` at `$40`, so v1 UI can use that package first.

### Tables

- `ai_credit_grants`
  - `id`
  - `org_id`
  - `user_id`
  - `grant_type`: `monthly_allowance | purchase | admin_adjustment | refund | promotion`
  - `credits_total`
  - `credits_remaining`
  - `effective_at`
  - `expires_at`
  - `stripe_checkout_session_id`
  - `stripe_payment_intent_id`
  - `created_by`
  - `created_at`

- `ai_credit_ledger`
  - `id`
  - `org_id`
  - `user_id`
  - `event_type`: `grant | reserve | settle | refund | expire | adjustment`
  - `credits_delta`
  - `balance_after`
  - `job_id`
  - `grant_id`
  - `stripe_event_id`
  - `idempotency_key`
  - `metadata`
  - `created_at`

- `ai_credit_reservations`
  - `id`
  - `org_id`
  - `user_id`
  - `job_id`
  - `reserved_credits`
  - `settled_credits`
  - `status`: `reserved | settled | released | expired`
  - `expires_at`
  - `created_at`
  - `settled_at`

- `ai_usage_limits`
  - `id`
  - `org_id`
  - `user_id`
  - `daily_credit_cap`
  - `weekly_credit_cap`
  - `single_action_cap`
  - `created_at`
  - `updated_at`

- `stripe_credit_products`
  - `id`
  - `stripe_price_id`
  - `stripe_product_id`
  - `credits`
  - `amount_cents`
  - `currency`
  - `active`
  - `created_at`

### Credit Flow

Purchase:

1. User selects package in account billing modal.
2. Server validates package against `stripe_credit_products`.
3. Server creates Stripe Checkout Session.
4. Stripe webhook verifies signature.
5. Webhook idempotency records Stripe event id.
6. Server creates credit grant and ledger `grant`.
7. UI refreshes account usage.

Usage:

1. Action estimates max credits.
2. Server checks caps and available balance.
3. Server creates reservation and ledger `reserve`.
4. Job runs.
5. Server calculates actual spend.
6. Server settles reservation and writes ledger `settle`.
7. Unused reservation becomes ledger `refund`.
8. UI history shows estimate, actual, and artifact.

Failure:

- If no artifact is saved, release/refund full reservation.
- If partial artifact is saved intentionally, settle the configured partial amount.
- If provider outage happens before model work starts, full refund.
- If user cancels before execution, release reservation.

## Stripe Integration

Use Stripe for payment collection and receipt source of truth.

Routes:

- `POST /api/stripe/ai-credits/checkout`
- Existing `/api/stripe/webhook` extended to process AI credit purchase events.
- Optional later: customer portal link from Billing tab.

Rules:

- Webhooks require signature verification.
- Stripe event id remains idempotency key.
- Checkout metadata includes `org_id`, `user_id`, `credit_package_id`, `stripe_mode`, and app version.
- Never grant credits from client redirect alone.
- Credit grants happen only from verified webhook processing.

Stripe Billing Credits note:

- Stripe Billing Credits are for usage-based billing/subscription invoice credits and have restrictions around stored value. Coach House app credits should remain an internal application ledger, funded by Stripe payments.

## Opportunity Intelligence Architecture

Opportunity intelligence is a source registry plus scheduled ingestion, normalization, matching, and presentation system.

### Source Registry

Tables:

- `opportunity_sources`
  - `id`
  - `source_type`: `api | rss | registered_url | internal_table | document_bucket | manual_upload`
  - `name`
  - `base_url`
  - `allowed_domains`
  - `auth_type`
  - `trust_level`: `internal_verified | partner_api | public_api | public_web | user_uploaded`
  - `refresh_cadence`
  - `enabled`
  - `owner_user_id`
  - `terms_notes`
  - `created_at`
  - `updated_at`

- `opportunity_scan_runs`
  - `id`
  - `source_id`
  - `org_id`
  - `status`
  - `started_at`
  - `finished_at`
  - `items_seen`
  - `items_created`
  - `items_updated`
  - `items_matched`
  - `error_code`
  - `error_message`
  - `retry_count`
  - `trace_id`

- `opportunity_source_snapshots`
  - `id`
  - `source_id`
  - `external_id`
  - `url`
  - `content_hash`
  - `raw_payload`
  - `fetched_at`
  - `expires_at`

- `opportunities`
  - `id`
  - `source_id`
  - `external_id`
  - `title`
  - `summary`
  - `funder_name`
  - `amount_min`
  - `amount_max`
  - `deadline_at`
  - `eligibility`
  - `geography`
  - `required_documents`
  - `source_url`
  - `confidence`
  - `status`: `active | expired | archived | quarantined`
  - `created_at`
  - `updated_at`

- `organization_opportunity_matches`
  - `id`
  - `org_id`
  - `opportunity_id`
  - `score`
  - `fit_level`: `high | medium | low | not_fit`
  - `match_reasons`
  - `missing_data`
  - `risk_flags`
  - `recommended_actions`
  - `status`: `new | saved | dismissed | task_created | draft_started | review_requested | archived`
  - `created_at`
  - `updated_at`

### Pipeline

1. Dispatcher selects due sources.
2. Fetcher retrieves from approved source only.
3. Snapshot writer stores raw payload hash and metadata.
4. Normalizer extracts structured opportunity records.
5. Deduper matches source id/external id/hash.
6. Deterministic pre-filter checks geography, eligibility, deadline, amount, and org profile.
7. AI explanation layer summarizes match reasons and missing information.
8. Match writer stores per-org recommendations.
9. Activity writer emits workspace activity events.
10. UI presents matches in Activity Monitor and opportunity node/drawer.

Source examples:

- Internal org profile, documents, roadmap, readiness scores, people, communications.
- Grants.gov or similar public grant APIs where terms allow.
- Foundation/funder RSS feeds or registered funder URLs.
- Event calendars with clear access terms.
- Social channel APIs only after explicit user connection and scope approval.

Hard limits:

- No arbitrary user-entered URLs in v1.
- No crawling entire websites.
- No use of private social data without explicit account connection and consent.
- No applying/sending/publishing from a scan result without human confirmation.

## Vercel And Scale Plan

Use Vercel for:

- Next.js App Router pages and route handlers.
- Node.js runtime for OpenAI, Stripe, Supabase service-role, document signing, and source fetch work.
- Streaming AI route responses.
- Vercel Cron as a dispatcher trigger.
- Vercel Observability, logs, Analytics, Speed Insights, and OTel.

Do not use Vercel request paths for long-running bulk scans.

Initial runtime design:

- `GET /api/cron/ai-jobs/dispatch`
  - Secured by `CRON_SECRET`.
  - Selects a small batch of due jobs.
  - Marks jobs as running with database locks.
  - Runs bounded work or dispatches to job route.

- `POST /api/ai/jobs`
  - Creates user-triggered jobs.
  - Validates action manifest, role, context, and credits.

- `GET /api/ai/jobs/[id]/stream`
  - Streams persisted progress and output events.

- `POST /api/opportunities/scan`
  - User/admin-triggered scan creation.
  - Does not run full scan synchronously.

Scale gates:

- If jobs regularly approach Vercel function limits, introduce a dedicated worker/queue provider.
- If source scan volume grows, move source fetching to a queue/worker and keep Vercel cron as scheduler only.
- If matching grows large, use batched SQL and background workers rather than route handlers.
- If document retrieval grows heavy, add precomputed snippets and source indexes.

Backpressure:

- Per-org concurrent AI job cap.
- Per-user concurrent AI job cap.
- Per-source scan concurrency cap.
- Per-model daily spend cap.
- Per-source failure circuit breaker.
- Credit reservation TTL.
- Idempotency key on scan item, Stripe event, and AI job action.

Caching:

- Use Next.js cache tags for account usage, opportunity matches, activity feed, and document metadata.
- Invalidate narrow tags after credit grants, AI job completion, opportunity match updates, and document signing.
- Do not cache sensitive source payloads in public/client caches.

## Security And Privacy

### Data Classification

- Public: marketing pages, public articles, public organization profile fields explicitly marked public.
- Org private: roadmap, documents, fiscal workflows, member data, activity history.
- Sensitive org private: uploaded PDFs, financial documents, fiscal sponsorship docs, grant drafts, signed documents.
- System secret: API keys, webhooks, source credentials, service-role tokens.
- Payment secret: Stripe-managed payment data only.

### Authz/RLS

- Every new table must have RLS enabled.
- Member users can read/write only their active org according to membership role.
- Coaches can read assigned orgs only.
- Super admins can use internal tools, with audit logging.
- Service-role access must live only in server routes/jobs and must write audit records for sensitive reads.

### Prompt Injection

- External source text, uploaded docs, and scraped content are untrusted data.
- The system prompt must explicitly tell the model that source content is data, not instructions.
- Tool calling is allowlisted by manifest.
- Tool arguments are validated server-side.
- The model cannot request arbitrary tables, URLs, files, recipients, or spend levels.

### SSRF And External Fetching

- Fetcher accepts only source ids, not arbitrary URLs.
- Source registry stores allowed domains and URL patterns.
- Block private IP ranges, localhost, link-local, metadata endpoints, and redirects to disallowed hosts.
- Respect source terms and robots/API limits.
- Log source id, host, status, duration, and content hash.

### Document Security

- Private org storage remains private.
- Download/sign URLs are short-lived and server-generated.
- Signed documents are immutable artifacts; corrections create new versions.
- Document AI context uses snippets and metadata unless full document access is necessary and authorized.
- Do not log raw document text.

### Credit Abuse

- Estimate before reservation.
- Enforce single-action cap.
- Enforce daily/weekly org/user caps.
- Alert on unusual spend velocity.
- Allow admin refund/adjustment with reason.
- Store every reservation/settlement/refund in append-only ledger.

## Internal Tooling

Create an `AI Operations` area for super admins and scoped coach/admin views.

Tools:

- Source Registry
  - Add/edit/disable source.
  - Set cadence, owner, trust level, quota, and allowed domains.

- Scan Monitor
  - View running/failed scans.
  - Retry failed source.
  - Pause noisy source.
  - Inspect created/matched counts.

- Opportunity QA Queue
  - Review low-confidence matches.
  - Mark false positive/false negative.
  - Promote source quality.
  - Tune deterministic match rules.

- AI Job Trace
  - View job status, manifest, model alias, context refs, tool calls, credit reservation, output artifact, and trace id.

- Prompt/Model Registry
  - Manage model aliases.
  - Version prompt templates.
  - Store output schema versions.
  - Roll back broken action versions.

- Credit Admin
  - View org/user balance.
  - See reservations and settlements.
  - Issue manual adjustment/refund.
  - Set org/user caps.

- Security Audit
  - Sensitive context access.
  - Document access by AI job.
  - External sharing/signing actions.
  - Super-admin override history.

## UI Implementation Plan

### Phase UI-1: Frame System

- Finalize shared `Frame` or local workspace frame primitive.
- Move fiscal sponsorship tile into final frame contract.
- Convert all canvas nodes to the frame anatomy.
- Lock dimensions and responsive behavior.
- Add acceptance tests that reject transparent unreadable surfaces and nested-card layouts.

### Phase UI-2: Activity Monitor Node

- Add an Activity Monitor node to the canvas.
- Show latest activity grouped by documents, opportunities, AI drafts, fiscal, social, and coach review.
- Include opportunity recommendations as actionable rows.
- Provide save/dismiss/create task/request review actions.

### Phase UI-3: Billing In Account Dialog

- Add Billing/Usage tab to account settings.
- Add usage cards, credit balance card, package modal, history table, and cap controls.
- Add sidebar/nav action that opens account settings directly to Billing/Usage.
- Do not create a separate app billing page for member v1.

### Phase UI-4: Coach Dashboard

- Build coach-specific dashboard using admin task patterns.
- Two-column queue/detail layout.
- Scope by coach assignment.
- Include AI/opportunity/fiscal review tasks.
- Add super-admin mode to inspect all queues.

### Phase UI-5: Fiscal Sponsorship Completion

- Replace placeholder docs/actions with secure document status, signing, storage, review, and audit actions.
- Surface missing data and next action clearly.
- Store signed docs in Documents.

## Backend Implementation Plan

### Phase BE-0: Foundation Audit

- Inventory existing workspace board persistence, document storage, Stripe, telemetry, and fiscal prototypes.
- Confirm exact owner files before editing canvas primitives.
- Confirm current dirty worktree ownership before changes.
- Add a brief execution checklist from this plan.

### Phase BE-1: Credit Ledger

- Add migrations for credit tables with RLS.
- Add credit service functions: balance, reserve, settle, release, grant, adjust.
- Add tests for reservation/refund/idempotency.
- Add account usage read model.

### Phase BE-2: Stripe Credit Checkout

- Add credit packages.
- Add credit checkout route.
- Extend webhook processing for credit purchases.
- Add idempotency tests.
- Add pending/cancelled checkout recovery states.

### Phase BE-3: AI Runtime

- Add manifest registry.
- Add context builder.
- Add job tables and event stream.
- Add OpenAI client/runtime wrapper.
- Add model alias config and env validation.
- Add first low-risk action: summarize a saved document or summarize org readiness.

### Phase BE-4: Opportunity Pipeline

- Add source registry and scan tables.
- Add cron dispatcher.
- Add registered-source fetcher with allowlist/SSRF controls.
- Add normalizer and deterministic matcher.
- Add activity writer.
- Add staff QA queue.

### Phase BE-5: Documents And Signing

- Choose and integrate signing provider path.
- Add signing packet creation, webhook handling, storage, and audit.
- Add fiscal sponsorship document statuses.
- Add document index source `fiscal` where needed.

### Phase BE-6: Coach/Admin Ops

- Add coach assignment model if missing.
- Add coach task queues and AI review tasks.
- Add internal AI Ops tools.
- Add audit dashboards.

### Phase BE-7: Voice And Realtime

- Add voice session manifest.
- Mint ephemeral sessions server-side.
- Limit context and duration.
- Save transcript/summary only after user consent and org policy.

## Data Events And Telemetry

Extend journey telemetry with:

- `ai_action_started`
- `ai_action_completed`
- `ai_action_failed`
- `ai_credits_checkout_started`
- `ai_credits_granted`
- `ai_credits_reserved`
- `ai_credits_settled`
- `opportunity_scan_started`
- `opportunity_scan_completed`
- `opportunity_match_saved`
- `opportunity_match_dismissed`
- `coach_review_requested`
- `coach_review_completed`
- `document_signing_started`
- `document_signed`
- `document_stored`

Add activation/health monitor coverage for:

- Paid user with no workspace AI usage.
- User with matched opportunity but no action.
- Draft generated but not reviewed/saved.
- Credit checkout started but not granted.
- Scan source failure spike.
- Coach review SLA breach.

## Optimization Plan

Canvas:

- Keep node state stable and memoized.
- Avoid canvas-wide rerenders when AI job progress changes.
- Stream progress into the active node/drawer only.
- Virtualize long task/opportunity/document lists over 50 rows.
- Preserve user node placement and viewport after navigation.

AI:

- Resolve context once per job and store references.
- Stream first visible progress within 1.5 seconds after server accepts action.
- Cache normalized opportunity/source snapshots.
- Batch embeddings/snippet generation.
- Prefer deterministic filters before model calls.

Billing:

- Billing tab lazy-loads history.
- Balance read model should not require summing the entire ledger on every render.
- Use indexes on `org_id`, `user_id`, `created_at`, `status`, and idempotency keys.

Documents:

- Lazy-load previews.
- Generate signed URLs on demand.
- Do not load full PDFs into canvas nodes.

## Accessibility Requirements

- All icon-only buttons need accessible labels and tooltips where meaning is not obvious.
- Billing modal must trap focus and return focus to plus button on close.
- Streaming output must use polite live regions for progress but not announce every token.
- Credit/spend warnings must not rely on color alone.
- Coach task rows must be keyboard selectable.
- Canvas nodes must preserve keyboard access to primary actions outside drag mode.
- Reduced motion must disable decorative animations and keep progress understandable.

## Acceptance Criteria

### System

- Every AI action is backed by a manifest.
- Every AI job has traceable context refs, tool calls, credit event, and artifact or failure state.
- Every credit grant/spend/refund appears in append-only ledger.
- Every Stripe credit purchase is fulfilled only from verified webhook.
- Every opportunity source is registered before scanning.
- Every external fetch is allowlisted and audited.
- Every new table has RLS and tests.

### UI

- Canvas nodes follow the shared frame pattern.
- No canvas node has unreadable transparent content.
- User node placement survives navigation and reload.
- Billing opens inside account settings.
- Credit purchase modal follows screenshot-derived flow.
- Activity Monitor shows opportunity recommendations with source, why, missing data, and actions.
- Coach dashboard uses two-column queue/detail pattern.

### Security

- Browser cannot access AI provider keys, service-role keys, source credentials, Stripe secrets, or signing provider keys.
- Model cannot access arbitrary orgs, files, URLs, or tables.
- External source content cannot become instructions.
- High-impact actions require human confirmation.
- Sensitive context reads are audited.

### Performance

- `/workspace` remains interactive while AI jobs stream.
- Opportunity lists and coach queues do not cause canvas-wide rerenders.
- Billing tab loads without blocking account dialog open.
- Long scans are not run synchronously in user request paths.

## Test Plan

Unit tests:

- Credit reserve/settle/refund.
- Credit idempotency.
- Manifest validation.
- Context scope filtering.
- Source allowlist URL validation.
- Opportunity deterministic matching.
- Prompt/tool schema validation.

Acceptance tests:

- Billing tab opens from sidebar/account action.
- Credit modal amount select and Next/Cancel behavior.
- Insufficient credits routes user to Billing tab.
- AI action creates job, streams progress, saves artifact.
- Failed AI action refunds reservation.
- Opportunity recommendation save/dismiss/create task/request review.
- Fiscal document sign/store state transitions.
- Coach dashboard queue/detail behavior.
- Canvas frame pattern across all nodes.
- Node placement persistence after navigation/reload.

RLS tests:

- Member can only read own org AI jobs, credit ledger, opportunities, documents.
- Coach can only read assigned org review tasks.
- Super admin can read internal ops views.
- Service-role writes are covered by server action/route tests.

Webhook tests:

- Stripe credit checkout completion grants credits once.
- Duplicate Stripe event does not double-grant.
- Invalid signature is rejected.
- Delayed webhook shows pending state.
- Signing provider webhook stores signed document once.

Manual QA:

- Sign in as member, open `/workspace`, move nodes, navigate away/back, confirm placement.
- Open account billing, buy test credits, confirm ledger and UI balance.
- Run low-risk AI summary action and confirm stream/history/artifact.
- Trigger opportunity scan fixture and confirm Activity Monitor row.
- Request coach review and confirm coach dashboard task.
- Complete fiscal signing test flow and confirm Documents index.

## Rollout Plan

Phase 0:

- Document plan.
- Add journey atlas nodes.
- Confirm current worktree state.
- Fix node placement persistence before layering new AI nodes.

Phase 1:

- UI frame unification and billing tab shell.
- No real AI spend yet.

Phase 2:

- Credit ledger and Stripe credit purchase.
- Account billing history.

Phase 3:

- AI runtime with one low-risk action.
- Streaming, job trace, audit, refund behavior.

Phase 4:

- Opportunity source registry, fixtures, and internal QA.
- Activity Monitor recommendations.

Phase 5:

- Fiscal sponsorship document signing/storage.
- Coach review dashboard.

Phase 6:

- Expanded opportunity sources.
- Grant drafting.
- Social/event intelligence.
- Voice model integration.

Rollback:

- Disable AI actions by manifest.
- Disable source scans by source.
- Disable credit checkout package.
- Disable model alias.
- Hide Billing tab credit purchase.
- Preserve ledger/job/audit data even when features are disabled.

## File/Surface Targets

Likely implementation surfaces:

- Account settings dialog and nav user/account action system.
- Workspace canvas/card frame surfaces.
- Fiscal sponsorship feature.
- Documents tab/data builder/storage routes.
- Stripe checkout/webhook runtime.
- User journey telemetry and activation monitor.
- New `src/features/ai-*`, `src/features/opportunities`, or equivalent scaffolded feature areas.
- Supabase migrations and generated schema types.
- Admin/platform prototypes or production admin dashboard for AI Ops.

Do not implement across these all at once. Each phase needs its own small PR-sized pass.

## Documentation References

- Vercel Functions: https://vercel.com/docs/functions
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Vercel Observability: https://vercel.com/docs/observability
- Next.js route handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js caching and revalidation: https://nextjs.org/docs/app/getting-started/revalidating
- Next.js streaming: https://nextjs.org/docs/app/guides/streaming
- OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses/create
- OpenAI function calling: https://platform.openai.com/docs/guides/function-calling
- OpenAI file search: https://platform.openai.com/docs/guides/tools-file-search
- OpenAI Realtime WebRTC: https://platform.openai.com/docs/guides/realtime-webrtc
- OpenAI safety best practices: https://platform.openai.com/docs/guides/safety-best-practices
- Stripe Checkout Sessions: https://docs.stripe.com/api/checkout/sessions
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe Billing Credits: https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits
- OWASP SSRF prevention: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP LLM Top 10: https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/
