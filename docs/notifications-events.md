# Notifications Event Map (current + proposed)

Status: Draft
Owner: Caleb
Last updated: 2026-01-16

## Principles (keep signal high)
- Only notify on user-facing milestones or urgent blockers.
- Avoid duplicate events for the same action (no "saved" noise).
- Prefer summary events over per-keystroke or per-row events.

---

## Active notifications (implemented)

1) Module completion
- Trigger: assignment submission when `complete_on_submit` is true
- Source: `src/app/api/modules/[id]/assignment-submission/route.ts`
- Type: `module_completed`
- Tone: `success`
- Copy: "Module completed" + module title

2) Coaching link opened
- Trigger: GET `/api/meetings/schedule`
- Source: `src/app/api/meetings/schedule/route.ts`
- Type: `coaching_requested`
- Tone: `info`
- Copy: "Coaching link opened"

3) Roadmap section added
- Trigger: create a new roadmap section (not updates)
- Source: `src/app/(dashboard)/strategic-roadmap/actions.ts`
- Type: `roadmap_section_added`
- Tone: `success`
- Copy: "Roadmap section added" + section title

4) Roadmap visibility toggled
- Trigger: publish/unpublish public roadmap
- Source: `src/app/(dashboard)/strategic-roadmap/actions.ts`
- Types: `roadmap_published` / `roadmap_unpublished`
- Tone: `success` or `info`

5) Private org document uploaded
- Trigger: upload to org documents
- Source: `src/app/api/account/org-documents/route.ts`
- Type: `document_uploaded`
- Tone: `success`
- Copy: "Document uploaded" + filename

6) Public org document uploaded
- Trigger: upload to public attachments
- Source: `src/app/api/account/org-public-documents/route.ts`
- Type: `public_document_uploaded`
- Tone: `info`
- Copy: "Public document uploaded" + filename

---

## Proposed notifications (high-signal only)

1) Assignment revision requested
- Why: user must act; high priority.
- Trigger: admin sets submission status to `revise`.
- Suggested type: `assignment_revision_requested` (tone: `warning`).

2) Assignment accepted
- Why: milestone feedback; low frequency.
- Trigger: admin sets submission status to `accepted`.
- Suggested type: `assignment_accepted` (tone: `success`).

3) Accelerator purchase activated
- Why: onboarding milestone; explains new access.
- Trigger: subscription/purchase becomes active.
- Suggested type: `accelerator_access_granted` (tone: `success`).

4) Organization subscription inactive (gating risk)
- Why: urgent to avoid surprises when features lock.
- Trigger: subscription moves to `past_due` or `canceled`.
- Suggested type: `subscription_attention_needed` (tone: `warning`).

---

## Explicitly not adding (to avoid noise)
- Per-save or per-field autosave notifications.
- Per-table-row changes (budget table edits).
- Duplicate roadmap edit notifications beyond "section added".
- Every coaching page view (only when link opens).
