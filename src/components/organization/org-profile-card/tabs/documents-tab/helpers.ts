import { MAX_BYTES, ROADMAP_CATEGORY_BY_ID } from "./constants"
import type {
  DocumentIndexRow,
  DocumentStatus,
  DocumentsPolicyEntry,
  DocumentsRoadmapSection,
} from "./types"

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

export function formatUpdatedAt(value?: string | null) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed)
}

export function normalizeCategories(input: string[]) {
  const seen = new Set<string>()
  const output: string[] = []
  for (const raw of input) {
    const value = raw.trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(value)
  }
  return output
}

export function toTimestamp(value?: string | null) {
  if (!value) return 0
  const parsed = new Date(value)
  const time = parsed.getTime()
  return Number.isNaN(time) ? 0 : time
}

export function validatePdf(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) return "Only PDF files are supported."
  if (file.size > MAX_BYTES) return "PDF must be 15 MB or less."
  return null
}

export function mapRoadmapStatus(
  section: DocumentsRoadmapSection,
): DocumentStatus {
  if (section.status === "not_started") return "not_started"
  if (section.status === "in_progress") return "in_progress"
  if (section.isPublic) return "published"
  return "ready"
}

export function mapPolicyStatus(policy: DocumentsPolicyEntry): DocumentStatus {
  if (policy.status === "not_started") return "not_started"
  if (policy.status === "in_progress") return "in_progress"
  return "ready"
}

export function resolveRoadmapCategory(sectionId: string) {
  return ROADMAP_CATEGORY_BY_ID[sectionId] ?? "Roadmap"
}

export function getPrimaryCategory(row: DocumentIndexRow) {
  return row.categories[0] ?? "Uncategorized"
}
