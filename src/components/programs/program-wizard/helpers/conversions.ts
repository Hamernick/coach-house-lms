export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

export function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

export function toMonthInput(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function monthToIsoStart(value: string) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  return `${value}-01T00:00:00.000Z`
}

export function normalizeAddons(coreFormat: string, addons: string[]) {
  const unique = new Set<string>()
  addons.forEach((addon) => {
    const trimmed = addon.trim()
    if (!trimmed || trimmed === coreFormat) return
    unique.add(trimmed)
  })
  return Array.from(unique)
}
