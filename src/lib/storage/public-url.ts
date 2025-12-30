const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/"

export function extractPublicObjectPath(url: string, bucket: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const marker = `${PUBLIC_OBJECT_PREFIX}${bucket}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    const path = parsed.pathname.slice(idx + marker.length)
    return path ? decodeURIComponent(path) : null
  } catch {
    return null
  }
}
