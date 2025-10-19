import type { ProviderSlug } from "./types"

const PROVIDER_PATTERNS: Array<{ slug: ProviderSlug; hosts: RegExp[] }> = [
  { slug: "youtube", hosts: [/youtube\.com$/, /youtu\.be$/] },
  { slug: "google-drive", hosts: [/drive\.google\.com$/, /docs\.google\.com$/] },
  { slug: "dropbox", hosts: [/dropbox\.com$/, /dropboxusercontent\.com$/] },
  { slug: "loom", hosts: [/loom\.com$/] },
  { slug: "vimeo", hosts: [/vimeo\.com$/] },
  { slug: "notion", hosts: [/notion\.so$/] },
  { slug: "figma", hosts: [/figma\.com$/] },
]

export function inferProviderSlug(rawUrl: string | null | undefined): ProviderSlug {
  if (!rawUrl) return "generic"
  let host: string
  try {
    const parsed = new URL(rawUrl)
    host = parsed.hostname.toLowerCase()
  } catch {
    return "generic"
  }
  for (const pattern of PROVIDER_PATTERNS) {
    if (pattern.hosts.some((regex) => regex.test(host))) {
      return pattern.slug
    }
  }
  return "generic"
}

