import type { Editor } from "@tiptap/react"
import { toast } from "@/lib/toast"

/** Read only after an explicit paste menu action or keyboard shortcut. */
export async function pasteEditorClipboard(editor: Editor, plain: boolean) {
  if (editor.isDestroyed || !editor.isEditable) return
  try {
    let html = ""
    let text = ""
    if (!plain && navigator.clipboard.read) {
      const items = await navigator.clipboard.read()
      const item = items.find(
        (item) =>
          item.types.includes("text/html") || item.types.includes("text/plain")
      )
      if (item?.types.includes("text/html"))
        html = await (await item.getType("text/html")).text()
      if (item?.types.includes("text/plain"))
        text = await (await item.getType("text/plain")).text()
    } else {
      text = await navigator.clipboard.readText()
    }
    if (editor.isDestroyed || !editor.isEditable) return
    editor.commands.focus()
    if (html) editor.view.pasteHTML(html)
    else if (text) editor.view.pasteText(text)
    else toast.info("Copy some text first.")
  } catch {
    toast.info(
      plain
        ? "Clipboard access was blocked. Allow clipboard access or use your browser's paste menu."
        : "Click in the editor and press Ctrl/Cmd+V to paste."
    )
  }
}
