import type { DocumentIndexRow } from "../types"

export function getDocumentRowFocusKey(row: DocumentIndexRow) {
  return row.source === "upload" ? row.definition.key : row.id
}
