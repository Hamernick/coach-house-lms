export function safeResourceMapExternalUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function formatResourceMapReviewValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded"
  }
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return JSON.stringify(value, null, 2)
}
