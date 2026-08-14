const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/"
const PUBLIC_IMAGE_RENDER_PREFIX = "/storage/v1/render/image/public/"

export function buildPublicImageTransformUrl(
  url: string | undefined,
  {
    height,
    quality = 75,
    resize = "contain",
    width,
  }: {
    height: number
    quality?: number
    resize?: "contain" | "cover"
    width: number
  }
): string | undefined {
  if (!url) return url

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith(".supabase.co")) return url
    if (!parsed.pathname.includes(PUBLIC_OBJECT_PREFIX)) return url

    parsed.pathname = parsed.pathname.replace(
      PUBLIC_OBJECT_PREFIX,
      PUBLIC_IMAGE_RENDER_PREFIX
    )
    parsed.searchParams.set("width", String(width))
    parsed.searchParams.set("height", String(height))
    parsed.searchParams.set("resize", resize)
    parsed.searchParams.set("quality", String(quality))
    return parsed.toString()
  } catch {
    return url
  }
}

export function extractPublicObjectPath(
  url: string,
  bucket: string
): string | null {
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
