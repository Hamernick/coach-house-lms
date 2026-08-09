# Prototype Plan Response Inbox

## Purpose

Give the administrator a fast way to answer plan questions directly on the
Finance React Flow canvas while keeping the canvas visible. This is a local
agent-collaboration tool, not a production communication feature.

## Chosen Approach

Use a local-only, admin-authenticated inbox stored under the repository's
ignored `.codex/prototype-plan-inbox/` directory. The running localhost app can
write responses and private attachments there, and Codex can read the same
files during implementation. Production requests fail closed; no Supabase
table, storage bucket, migration, deployment, or production mutation is
required.

Browser-only storage was rejected because Codex cannot reliably read it.
Supabase persistence was deferred because this sidequest must work locally
without applying production infrastructure.

## Interface

Replace the large header card with separate compact controls:

- a view selector pill;
- a jump selector pill;
- a current-focus pill with exact progress;
- compact Coverage, Find, and status-key actions;
- existing zoom controls outside the toolbar.

Add a bottom-center rounded response dock. Its resting state is one line: target
context, text entry, attachment action, response history, and a circular send
button. Focusing, dragging files, or adding content reveals only the relevant
quick actions and previews above the pill. Entrance feedback uses opacity and
vertical translation for at most 180ms and respects reduced motion.

Quick actions are Confirm, Deny, and Agree. Selecting one records a resolved
green response. Sending free text or attachments records an orange in-progress
response. Links are extracted from text and rendered as safe domain previews.
Images render bounded thumbnails; videos, PDFs, and documents render typed file
rows. The inbox popover shows the newest responses without becoming a second
full-height panel.

Every generated batch work item includes one compact Reply pill. Selecting it
retargets the existing dock instead of creating another composer or panel. The
pill reads In progress in orange after a note or attachment and Confirmed,
Denied, or Agreed in green after a quick decision. One shared response provider
loads the inbox once and keeps the list pills, dock actions, and history in sync.

## Data And Security

Each response stores a UUID, plan/view/node context, optional message, action,
state, UTC timestamp, extracted HTTPS links, and attachment metadata. Files use
generated IDs and sanitized display names; server paths never use client path
segments. Writes are atomic. Limits are five files, 25 MB per file, 50 MB total,
and an allowlist of common image, video, PDF, text, Office, and CSV types. SVG,
HTML, scripts, and unknown types are rejected. Attachment reads require the same
admin session and return `nosniff`, private no-store headers.

The endpoint is Node-only and returns unavailable outside local development.
The UI keeps errors beside the composer and never reports success until the
local write returns.

## Verification

- Unit coverage for validation, URL extraction, atomic persistence, listing,
  and attachment reads using an isolated temporary root.
- Acceptance coverage for compact toolbar ownership, response states, file
  limits, production fail-closed behavior, keyboard submit, drag/drop, and
  accessible icon labels.
- Authenticated localhost verification for canvas visibility, response save,
  reload persistence, attachment preview, quick-action resolution, and console
  cleanliness.
- Relevant Prototype Lab, route, threshold, boundary, interaction, React Grab,
  workspace-surface, and raw-button guards.

Batch 3 resumes from “Integrate remaining applicant, coach, project, budget,
document, task, Form B, W-9, review, and audit work” after this sidequest.
