export function resolveSupabaseProjectRef(url: string | null | undefined): string | null {
  if (typeof url !== "string" || url.trim().length === 0) return null

  try {
    const hostname = new URL(url).hostname
    const [projectRef] = hostname.split(".")
    const normalized = projectRef?.trim()
    return normalized ? normalized : null
  } catch {
    return null
  }
}
