export function normalizeHexColor(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return ""
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return /^#[0-9a-fA-F]{6}$/i.test(prefixed) ? prefixed.toUpperCase() : trimmed
}

export function isValidHexColor(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return true
  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  return /^#[0-9a-fA-F]{6}$/i.test(prefixed)
}

export function sanitizePalette(
  colors: string[] | null | undefined,
  primaryColor?: string | null,
  limit = 4,
) {
  const normalizedPrimary = normalizeHexColor(primaryColor)
  const palette = new Set<string>()
  for (const entry of Array.isArray(colors) ? colors : []) {
    const normalized = normalizeHexColor(entry)
    if (!normalized || normalized === normalizedPrimary) continue
    palette.add(normalized)
    if (palette.size >= limit) break
  }
  return Array.from(palette)
}
