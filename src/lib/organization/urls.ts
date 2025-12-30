const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

function looksLikeDomain(value: string): boolean {
  if (!value) return false
  if (/\s/.test(value)) return false
  if (/^localhost(?::\d+)?(\/|$)/i.test(value)) return true
  if (/^\d{1,3}(\.\d{1,3}){3}(?::\d+)?(\/|$)/.test(value)) return true
  return /\.[a-z]{2,}/i.test(value)
}

export function normalizeExternalUrl(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (SCHEME_RE.test(trimmed)) return trimmed
  if (!looksLikeDomain(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidExternalUrl(value: string): boolean {
  const normalized = normalizeExternalUrl(value)
  if (!normalized) return false
  try {
    new URL(normalized)
    return true
  } catch {
    return false
  }
}
