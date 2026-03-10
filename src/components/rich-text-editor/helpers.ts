import type { Editor } from "@tiptap/react"

export function syncPlaceholderState(editor: Editor): void {
  const textEmpty = editor.state.doc.textContent.trim().length === 0
  editor.view.dom.dataset.editorEmpty = textEmpty ? "true" : "false"
  const hidePlaceholder = textEmpty && editor.state.doc.childCount > 1
  if (hidePlaceholder) {
    editor.view.dom.dataset.placeholderHidden = "true"
  } else {
    delete editor.view.dom.dataset.placeholderHidden
  }
}

type JsonNode = {
  type?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
  content?: JsonNode[]
}

export function extractLinks(json: JsonNode | null): string[] {
  if (!json) return []
  const links = new Set<string>()

  const walk = (node: JsonNode | null | undefined) => {
    if (!node) return
    if (node.type === "text" && Array.isArray(node.marks)) {
      node.marks.forEach((mark) => {
        const href = mark?.attrs?.href
        if (mark?.type === "link" && typeof href === "string") {
          links.add(href)
        }
      })
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }

  walk(json)
  return Array.from(links)
}
