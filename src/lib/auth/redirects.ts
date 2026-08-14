export const DEFAULT_POST_AUTH_REDIRECT = "/workspace"
const SAFE_REDIRECT_ORIGIN = "https://coachhouse.local"
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/

function hasUnsafeEncoding(value: string) {
  let decoded = value
  for (let pass = 0; pass < 3; pass += 1) {
    if (
      decoded.includes("\\") ||
      decoded.startsWith("//") ||
      CONTROL_CHARACTER_PATTERN.test(decoded)
    ) {
      return true
    }
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) return false
      decoded = next
    } catch {
      return true
    }
  }
  return false
}

export function getSafeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  if (!value.startsWith("/")) return undefined
  if (value.startsWith("//")) return undefined
  if (hasUnsafeEncoding(value)) return undefined

  try {
    const parsed = new URL(value, SAFE_REDIRECT_ORIGIN)
    if (parsed.origin !== SAFE_REDIRECT_ORIGIN) return undefined
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return undefined
  }
}
