# Unused Files Archive — 2026-02-20

These files were moved out of `src/` after a conservative dead-code pass:

- Import graph scan across all `src/**/*.{ts,tsx,js,jsx}`.
- Manual grep verification for each candidate.
- No references in runtime code paths.

Moved files:

Core unreferenced modules:
- `src/components/kibo-ui/dialog-stack/index.tsx`
- `src/components/programs/program-wizard/tag-input.tsx`
- `src/components/roadmap/roadmap-share-drawer.tsx`
- `src/components/roadmap/roadmap-editor/hooks/index.ts`
- `src/components/tiptap/extensions/floating-menu.tsx`
- `src/components/tiptap/extensions/floating-toolbar.tsx`
- `src/components/tiptap/toolbars/editor-toolbar.tsx`
- `src/components/ui/stepped-progress.tsx`

Dialog stack orphan internals:
- `src/components/kibo-ui/dialog-stack/body.tsx`
- `src/components/kibo-ui/dialog-stack/content.tsx`
- `src/components/kibo-ui/dialog-stack/context.tsx`
- `src/components/kibo-ui/dialog-stack/controls.tsx`
- `src/components/kibo-ui/dialog-stack/overlay.tsx`
- `src/components/kibo-ui/dialog-stack/primitives.tsx`
- `src/components/kibo-ui/dialog-stack/stack.tsx`

TipTap orphan stack (after toolbar shell removal):
- `src/components/tiptap/extensions/image-placeholder.tsx`
- `src/components/tiptap/extensions/search-and-replace.tsx`
- `src/components/tiptap/tiptap.css`
- `src/components/tiptap/toolbars/alignment.tsx`
- `src/components/tiptap/toolbars/blockquote.tsx`
- `src/components/tiptap/toolbars/bold.tsx`
- `src/components/tiptap/toolbars/bullet-list.tsx`
- `src/components/tiptap/toolbars/code-block.tsx`
- `src/components/tiptap/toolbars/code.tsx`
- `src/components/tiptap/toolbars/color-and-highlight.tsx`
- `src/components/tiptap/toolbars/headings.tsx`
- `src/components/tiptap/toolbars/horizontal-rule.tsx`
- `src/components/tiptap/toolbars/image-placeholder-toolbar.tsx`
- `src/components/tiptap/toolbars/italic.tsx`
- `src/components/tiptap/toolbars/link.tsx`
- `src/components/tiptap/toolbars/mobile-toolbar-group.tsx`
- `src/components/tiptap/toolbars/ordered-list.tsx`
- `src/components/tiptap/toolbars/redo.tsx`
- `src/components/tiptap/toolbars/search-and-replace-toolbar.tsx`
- `src/components/tiptap/toolbars/strikethrough.tsx`
- `src/components/tiptap/toolbars/toolbar-provider.tsx`
- `src/components/tiptap/toolbars/underline.tsx`
- `src/components/tiptap/toolbars/undo.tsx`

UI orphan module:
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/toggle.tsx`

Admin route-orphan module editor stack (no `page.tsx`/`route.ts` entrypoint):
- `src/app/(admin)/admin/modules/[id]/actions.ts`
- `src/app/(admin)/admin/modules/[id]/_components/assignment-editor.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/content-builder.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/content-editor.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/markdown-editor.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-publish-button.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/signed-url-helper.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/index.ts`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/add-homework.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/add-resource.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/dnd-list.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/section.tsx`
- `src/app/(admin)/admin/modules/[id]/_components/module-builder/upload-resource.tsx`

Other verified unreferenced modules:
- `src/app/reportWebVitals.ts`
- `src/app/(admin)/admin/classes/[id]/actions.ts`
- `src/actions/demo-workspace.ts`
- `src/actions/demo-workspace-seeds.ts`
- `src/actions/programs.ts` (unused export: `seedNextDemoProgramAction`, archived as `deprecated/src/unused-2026-02-20/src/actions/programs-seed-next-demo.ts`)
- `src/hooks/use-media-querry.ts`
- `src/lib/content.ts`
- `src/lib/id.ts`
- `src/lib/text/options.ts`
- `src/lib/tiptap-utils.ts`
- `src/lib/roadmap/analytics.ts`

No behavior changes are intended.
