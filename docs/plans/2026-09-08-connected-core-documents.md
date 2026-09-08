# Connected core documents

Continue locally on chore/local-development-20260907 and localhost:3000.

Use roadmap section IDs as the shared identity for Documents cards and editor
pages. Hide program, people, board_calendar, and next_actions only from Documents.
Existing content makes a core card populated and opens its matching editor.

Add a shared document import flow: choose DOCX, legacy DOC, Markdown, or a
Google Drive file; preview sanitized content; append or explicitly replace.
Core-card imports save through the existing authenticated roadmap action with
revision checks. Editor imports update the active draft and use existing save/
autosave. No import silently replaces existing content. Budget gets a document
view alongside its existing line-item table.

DOCX preserves supported semantic formatting; legacy DOC extracts text. Markdown
renders to sanitized HTML. Styled clipboard HTML preserves supported formatting
including safe text color, size, family, and alignment. Layout-specific Word
features and embedded document images are not promised as exact reproductions.

Google behavior is an editable Coach House copy with a source link. This uses
the stated default while no different preference has been supplied. Use the
existing drive.file connection and Picker; download/export only the selected, authorized file. No two-way sync,
provider configuration change, or live document import is performed by this
session. Keep original Google files untouched.

Use the scaffolded document-import feature for conversion, protected API handlers,
and shared import controls. Bound file/output sizes, sanitize every conversion,
keep external DOCX references disabled, and preserve organization authorization.
Test converters, revisions/permissions, card-to-editor behavior, rich paste,
import confirmation, excluded cards, and Google import with mocked provider APIs.
