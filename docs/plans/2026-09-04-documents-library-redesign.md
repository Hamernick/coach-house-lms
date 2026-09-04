# Documents library redesign

## Goal

Replace the dismissible Documents introduction banner with a persistent,
responsive library surface matching the supplied references while keeping the
page title as “Documents.”

## Interaction model

- Search remains URL-backed and searches the complete existing document index.
- All, Images, and Documents tabs narrow the visible card set.
- Grid is the default view; list preserves the detailed compliance index and
  its existing management actions.
- The filter menu exposes source and file-type filters, plus a recoverable
  recently-deleted view.
- New opens real Google-native creation destinations for images, notes,
  documents, spreadsheets, presentations, folders, and templates.
- Upload files and drag-and-drop accept arbitrary file types through the same
  organization-scoped upload path.
- The complete drop is validated before upload, then files upload sequentially
  so failures are attributable and successful files appear immediately.
- A compact usage indicator shows uploaded storage against the organization’s
  5 GB allowance.
- Uploaded files can be moved to Recently Deleted, restored, or permanently
  removed. Recently deleted files count toward quota and are retained for 30
  days before opportunistic cleanup when an editor opens Documents.
- Accelerator notes appear as an inline section below the library for the
  organization Documents route instead of occupying the app-shell right rail.
  Existing search, class filtering, expansion, and module links remain intact.
- Google Drive starts OAuth when disconnected and the selected-file Picker when
  connected, then refreshes attached Drive documents in the library.
- Cards support keyboard opening and explicit selection without making the
  selection indicator a dead control.

## Visual direction

Use the supplied dark library references for hierarchy, density, rounded card
geometry, menus, hover selection, and compact controls. Use Coach House’s Geist
tokens, shared shadcn primitives, focus treatment, and light/dark/system themes.
The surface remains mobile-first and uses one, two, or three grid columns based
on available width. The inline Notes section uses the library’s muted card,
ring, spacing, and rounded geometry.

## Boundaries

- No “Start chat” action.
- Arbitrary library files use an organization-scoped metadata table while the
  existing required-document slots retain their taxonomy and PDF validation.
- Existing per-file limits remain unchanged. The storage bucket’s MIME
  allowlist is removed without altering its configured size limit.
- A database trigger serializes quota checks per organization and rejects any
  metadata write that would take total uploaded storage above 5 GB, including
  existing required-document uploads backfilled from organization profiles.
- Soft deletion is reversible. Permanent deletion requires confirmation and
  removes both private storage and metadata, reclaiming quota immediately.
- Native creations are not silently attached; users connect them through the
  selected-file Google Drive flow.
- No migration, provider-console change, deployment, or production mutation.

## Validation

Update focused acceptance and visual coverage, verify menus/tabs/views and
responsive layouts in the local app, run repository quality checks, refresh
Graphify, and record the intentional visual change in the current runlog.
