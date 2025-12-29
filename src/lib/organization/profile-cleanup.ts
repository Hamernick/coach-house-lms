import { stripHtml } from "@/lib/markdown/convert"

const HTML_TEXT_FIELDS = new Set([
  "description",
  "vision",
  "mission",
  "need",
  "values",
  "programs",
  "reports",
  "boilerplate",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function shouldStripOrgProfileHtml(key: string): boolean {
  return HTML_TEXT_FIELDS.has(key)
}

export function sanitizeOrgProfileText(value: string): string | null {
  const cleaned = stripHtml(value)
  const trimmed = cleaned.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeArray(value: unknown[]): string | null {
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
  return items.length > 0 ? items.join("\n") : null
}

export function cleanupOrgProfileHtml(profile: Record<string, unknown> | null | undefined): {
  nextProfile: Record<string, unknown>
  changed: boolean
} {
  const nextProfile = isRecord(profile) ? { ...profile } : {}
  let changed = false

  for (const key of HTML_TEXT_FIELDS) {
    const raw = nextProfile[key]
    if (typeof raw !== "string") continue
    const cleaned = sanitizeOrgProfileText(raw)
    const nextValue = cleaned ?? null
    if (nextValue !== raw) {
      nextProfile[key] = nextValue
      changed = true
    }
  }

  for (const key of HTML_TEXT_FIELDS) {
    const raw = nextProfile[key]
    if (!Array.isArray(raw)) continue
    const normalized = normalizeArray(raw)
    const nextValue = normalized ?? null
    nextProfile[key] = nextValue
    changed = true
  }

  return { nextProfile, changed }
}
