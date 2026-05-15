export function hasPublicProfileValue(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0
}
