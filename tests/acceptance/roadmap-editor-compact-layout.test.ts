import { createElement, type ComponentProps, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  editorOptions: null as null | {
    content: string
    onUpdate: (input: { editor: unknown }) => void
  },
  source: { pending: false, error: null as string | null, change: vi.fn() },
}))

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }))
vi.mock("@/lib/feature-flags", () => ({ organizationDocumentCollaborationEnabled: false }))
vi.mock("@/components/roadmap/core-document-source/use-core-document-source", () => ({
  useCoreDocumentSource: () => mocks.source,
}))
vi.mock("@/features/organization-document-collaboration/client", () => ({
  OrganizationDocumentCollaborationPanel: () => null,
}))
vi.mock("@/components/roadmap/core-document-source/linked-drive-document-editor", () => ({
  LinkedDriveDocumentEditor: () => null,
}))
vi.mock("@/components/app-shell/right-rail", () => ({
  RightRailSlot: ({ children }: { children: ReactNode }) => children,
}))
vi.mock("@/components/roadmap/roadmap-right-rail-section", () => ({ RoadmapRightRailSection: () => null }))
vi.mock("@/components/roadmap/roadmap-calendar", () => ({ RoadmapCalendar: () => createElement("div", { "data-calendar": true }, "Calendar body") }))
vi.mock("@/components/roadmap/roadmap-budget-table-editor", () => ({ RoadmapBudgetTableEditor: () => createElement("div", { "data-budget": true }, "Budget body") }))
vi.mock("@/components/roadmap/roadmap-editor/components/roadmap-editor-breadcrumb", () => ({ RoadmapEditorBreadcrumb: () => null }))
vi.mock("@/components/rich-text-editor/extensions", () => ({ buildRichTextExtensions: () => [] }))
vi.mock("@/components/rich-text-editor/components/rich-text-toolbar", () => ({ RichTextToolbar: () => createElement("div", { role: "toolbar" }) }))
vi.mock("@tiptap/react", () => ({
  useEditor: (options: NonNullable<typeof mocks.editorOptions>) => {
    mocks.editorOptions = options
    return { getHTML: () => options.content }
  },
  EditorContent: ({ editor }: { editor: { getHTML: () => string } }) =>
    createElement("article", { "data-editor-content": true, dangerouslySetInnerHTML: { __html: editor.getHTML() } }),
}))

import { RichTextEditor } from "@/components/rich-text-editor"
import { RoadmapEditorShell } from "@/components/roadmap/roadmap-editor/components/roadmap-editor-shell"
import { RoadmapSectionPanel } from "@/components/roadmap/roadmap-section-panel"
import { createDraft } from "@/components/roadmap/roadmap-editor/helpers"
import { ROADMAP_TOOLBAR_ID } from "@/components/roadmap/roadmap-editor/constants"
import { resolveRoadmapSections } from "@/lib/roadmap"

const body = "<p>Saved body only</p>"
function SectionIcon() {
  return createElement("svg", { "data-section-icon": true })
}

function shellProps(overrides: Partial<ComponentProps<typeof RoadmapEditorShell>> = {}) {
  const section = resolveRoadmapSections({
    roadmap: { sections: [{ id: "vision", content: body }] },
  }).find(section => section.id === "vision")!
  const draft = createDraft(section)
  return {
    sections: [section], activeSection: section, drafts: { vision: draft },
    roadmapBasePath: "/workspace/roadmap", onSectionSelect: vi.fn(), showRightRail: false,
    headerTitle: "Canonical document title", headerSubtitle: "Canonical document subtitle",
    showSectionHeader: true, headerIconSize: null, headerTextRef: { current: null },
    status: "in_progress" as const, canEdit: true, onCollaborationPending: vi.fn(),
    onSavedSection: vi.fn(), onStatusChange: vi.fn(), statusSelectDisabled: false,
    isHydrated: true, isCalendarSection: false, isBudgetSection: false,
    contentMaxWidth: "max-w-3xl", activeDraft: draft, editorPlaceholder: "Write here",
    onDraftChange: vi.fn(), onImageUpload: vi.fn(), onSave: vi.fn(), isDirty: false,
    savingId: null, sectionIcon: SectionIcon, ...overrides,
  }
}

describe("compact roadmap editor layout", () => {
  beforeEach(() => {
    mocks.editorOptions = null
    mocks.source.pending = false
    mocks.source.error = null
  })

  it("places title and subtitle inside the editor content surface, outside saved HTML", () => {
    const onChange = vi.fn()
    const markup = renderToStaticMarkup(createElement(RichTextEditor, {
      value: body, onChange, readOnly: true,
      header: createElement("header", null,
        createElement("h1", null, "Document title"), createElement("p", null, "Document subtitle")),
      headerInsideContent: true, contentClassName: "editor-scroll-surface",
    }))
    expect(markup).toMatch(/editor-scroll-surface[^>]*><div[^>]*><header><h1>Document title<\/h1><p>Document subtitle<\/p><\/header><\/div><article data-editor-content="true"><p>Saved body only<\/p><\/article>/)
    expect(mocks.editorOptions?.content).toBe(body)

    // The editor serialization callback must emit body HTML, not the surrounding heading.
    mocks.editorOptions!.onUpdate({ editor: {
      getHTML: () => "<p>Edited body only</p>", getJSON: () => ({ type: "doc", content: [] }),
      storage: {}, state: { doc: { textContent: "Edited body only", childCount: 1 } },
      view: { dom: { dataset: {} } },
    } })
    expect(onChange).toHaveBeenCalledExactlyOnceWith("<p>Edited body only</p>")
  })

  it("renders the native shell heading only in the editor and keeps one accessible status and toolbar slot", () => {
    const markup = renderToStaticMarkup(createElement(RoadmapEditorShell, shellProps()))
    const beforeEditor = markup.slice(0, markup.indexOf("<section"))
    const editor = markup.slice(markup.indexOf("<section"))
    expect(beforeEditor).not.toContain("<h1")
    expect(markup).not.toContain("data-section-icon")
    expect(editor).toContain(">Canonical document title</h1>")
    expect(editor).toContain("<p>Canonical document subtitle</p>")
    expect(editor.indexOf("0 words")).toBeLessThan(editor.indexOf("<h1"))
    expect(editor.indexOf("<h1")).toBeLessThan(editor.indexOf("data-editor-content"))
    expect(markup.match(new RegExp(`id="${ROADMAP_TOOLBAR_ID}"`, "g"))).toHaveLength(1)
    expect(beforeEditor).toContain('role="combobox"')
    expect(beforeEditor).toContain('aria-label="Core document publication status"')
    expect(mocks.editorOptions?.content).toBe(body)
  })

  it("preserves the default training panel heading, icon, controls, and toolbar location", () => {
    const markup = renderToStaticMarkup(createElement(RoadmapSectionPanel, {
      title: "Training checkpoint", subtitle: "Assignment guidance", icon: SectionIcon,
      status: "in_progress", canEdit: true, onStatusChange: vi.fn(), headerVariant: "calendar",
      headerControlsTop: createElement("button", null, "Training action"),
      toolbarSlotId: "training-toolbar", body: createElement("p", null, "Assignment body"),
    }))
    const beforeBody = markup.slice(0, markup.indexOf("<section"))
    expect(beforeBody).toContain(">Training checkpoint</h1>")
    expect(beforeBody).toContain("Assignment guidance")
    expect(beforeBody).toContain("data-section-icon")
    expect(beforeBody).toContain("Training action")
    expect(beforeBody).toContain('aria-label="Roadmap section status"')
    expect(beforeBody).not.toContain('id="training-toolbar"')
    expect(markup.slice(markup.indexOf("<section"))).toContain('id="training-toolbar"')
  })

  it("retains empty-document source choices and an accessible connection error", () => {
    mocks.source.error = "Connect Google Drive in Tools, then return to choose a document."
    const props = shellProps()
    const markup = renderToStaticMarkup(createElement(RoadmapEditorShell, {
      ...props, sourceScope: { userId: "user-a", organizationId: "org-a" },
      activeDraft: { ...props.activeDraft, content: "" },
    }))
    expect(markup).toContain("Start writing")
    expect(markup).toContain("Choose from Google Drive")
    expect(markup).toContain('role="alert"')
    expect(markup).toContain(mocks.source.error)
    expect(markup).not.toContain("data-editor-content")
    expect(mocks.editorOptions).toBeNull()
  })

  it.each(["calendar", "budget"] as const)("preserves the %s shell body and outer section heading", kind => {
    const markup = renderToStaticMarkup(createElement(RoadmapEditorShell, shellProps({
      isCalendarSection: kind === "calendar", isBudgetSection: kind === "budget",
    })))
    expect(markup.slice(0, markup.indexOf("<section"))).toContain(">Canonical document title</h1>")
    expect(markup).toContain("data-section-icon")
    expect(markup).toContain(`data-${kind}="true"`)
    expect(mocks.editorOptions).toBeNull()
  })

  it("keeps the default rich-text header outside the content surface", () => {
    const markup = renderToStaticMarkup(createElement(RichTextEditor, {
      value: body, onChange: vi.fn(), readOnly: true,
      header: createElement("h2", null, "Existing instruction"), contentClassName: "editor-scroll-surface",
    }))
    expect(markup.indexOf("<h2>Existing instruction</h2>")).toBeLessThan(markup.indexOf("0 words"))
    expect(markup.slice(markup.indexOf("editor-scroll-surface"))).not.toContain("Existing instruction")
    expect(mocks.editorOptions?.content).toBe(body)
  })
})
