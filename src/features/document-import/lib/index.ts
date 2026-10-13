import { stripHtml } from "@/lib/markdown/convert"

export const DOCUMENT_IMPORT_ACCEPT = ".docx,.doc,.md,.markdown"
export const MAX_DOCUMENT_IMPORT_BYTES = 15 * 1024 * 1024
export const MAX_DOCUMENT_IMPORT_HTML = 500_000

export function isImportableDocument(name: string) {
  return /\.(docx?|md|markdown)$/i.test(name)
}

export function hasDocumentContent(html: string) {
  return Boolean(stripHtml(html).trim() || /<(?:img|table|hr)\b/i.test(html))
}

export function mergeImportedDocument(
  current: string,
  imported: string,
  mode: "append" | "replace"
) {
  return mode === "append" && current.trim()
    ? `${current}${imported}`
    : imported
}

export function importedDocumentHtml(document: {
  html: string
  sourceUrl?: string
}) {
  if (!document.sourceUrl) return document.html
  const url = document.sourceUrl
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
  return `${document.html}<p><a href="${url}" target="_blank" rel="noopener noreferrer">Google Drive source</a></p>`
}
