export type VaultDocumentSource = "upload" | "policy" | "roadmap" | "note"

export type VaultDocumentIndexItem = {
  id: string
  source: VaultDocumentSource
  title: string
  subtitle: string | null
  summary: string | null
  updatedAt: string | null
  href: string | null
  documentKind: string | null
  policyId: string | null
  mime: string | null
  sizeBytes: number | null
}

export type VaultDocumentDetail = {
  id: string
  source: "roadmap" | "note"
  title: string
  subtitle: string | null
  updatedAt: string | null
  previewType: "roadmap_html" | "markdown"
  contentHtml: string | null
  contentMarkdown: string | null
}

export function formatDate(value: string | null) {
  if (!value) return "Unknown date"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Unknown date"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

export function formatBytes(value: number | null) {
  if (!value || value <= 0) return null
  const units = ["B", "KB", "MB", "GB"]
  let next = value
  let unitIndex = 0
  while (next >= 1024 && unitIndex < units.length - 1) {
    next /= 1024
    unitIndex += 1
  }
  const digits = next >= 10 || unitIndex === 0 ? 0 : 1
  return `${next.toFixed(digits)} ${units[unitIndex]}`
}

export function sourceLabel(source: VaultDocumentSource) {
  if (source === "upload") return "Upload"
  if (source === "policy") return "Policy"
  if (source === "roadmap") return "Roadmap"
  return "Note"
}
