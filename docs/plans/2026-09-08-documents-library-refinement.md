# Documents library refinement

The Documents surface stays in the synchronized root checkout on
`chore/local-development-20260907`, served at localhost:3000.

- Reduce the banner from 42rem to 36rem and use compact square cards, with two
  columns on mobile and three on desktop. Preserve usable interaction targets.
- Keep selected indicators visible after pointer and keyboard focus leave.
- Empty core documents (Budget, Board strategy, etc.) and required file slots
  use small centered cloud-upload icons and individual dashed drop zones.
  Clicking a slot opens its picker; dropping a file attaches only to that slot.
  The library has no global drop overlay or general drop upload handler.
- Core attachments use the existing organization file table and quota, with a
  validated core section encoded in the server-generated storage path. Listing,
  trash, and restore retain the association; attached files show once, under
  their core title. Existing roadmap editor links remain in list actions.
- Selection controls have transparent hover backgrounds in light and dark mode.
- Show dates only for attached files. Empty slots have an upload affordance.
- Render image and PDF thumbnails from existing authorized signing endpoints.
  Fetch thumbnails near the viewport; load the preview dialog on demand.
- Preview images in the dialog and render PDF pages with the existing local
  PDF.js loader, including page navigation and error/retry states. Private files
  bypass the public image optimizer; signed URLs are not persisted.
- Required slots accept PDF, JPEG, PNG, WebP, and GIF files through shared client
  and server validation. Preserve the 15 MB limit, organization permissions,
  storage quota, and tracked upload rollback. No migration is required.

This follows `docs/design.md` compact spacing and semantic state colors. The
banner and grid own layout; the extracted card owns card classes and selection.
The preview dialog links back to `organization-documents:banner` through React
Grab metadata and uses the shared Dialog primitive.

The initial broader validation used `/tmp/coach-house-documents-qa-20260908`
without provider environment files. Focused follow-up browser checks use the
running localhost:3000 with mocked storage APIs; route tests mock auth, storage,
and quota responses. No test writes to a provider. Current results and outstanding
release checks are recorded in `docs/runlog/2026-09.md`.
