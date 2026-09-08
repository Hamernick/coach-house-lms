# Document import

Shared Word/Markdown/Google Docs import for the roadmap editor and Documents core
cards. The canonical saved text is roadmap section content, persisted through
saveRoadmapSectionAction with existing revision and organization checks.

- `server/convert-document.ts`: bounded DOCX, legacy DOC, and Markdown conversion.
- `server/actions.ts`: authenticated, edit-authorized preview API handler.
- `components/**`: preview plus explicit append/replace confirmation.
- `client.ts`: client-safe UI and content helpers; `index.ts`: server entrypoint.
- Tests: `tests/acceptance/document-import.test.ts` and Documents browser coverage.

DOCX retains supported semantic formatting. DOC imports text only. Conversion
strips embedded images and executable markup; editors retain supported pasted
styles via Tiptap TextStyleKit and the shared HTML sanitizer. Files are converted
into editable content rather than retained as binary attachments by this flow.
PDF/image binary attachments continue through the existing file library.

Pasted and imported neutral ink/page fills follow the application theme. Accent
colors and highlights retain their hue with readable light/dark variants;
unsupported color syntax falls back to the theme. Font, emphasis, alignment,
lists, and tables remain supported. Theme changes do not rewrite saved content.
The editor's Paste menu offers formatted or plain-text paste; Ctrl/Cmd+Shift+V
also pastes plain text. Clipboard API access is requested only on a paste action,
with a browser-paste fallback message if access is denied.

Google Docs export to DOCX; selected Word/Markdown files download with the user's
existing drive.file grant. Imports create a Coach House copy and retain a source
link. They do not sync edits back to Google. No provider setup is performed.
