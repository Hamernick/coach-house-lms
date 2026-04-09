import type { QuickLink } from "@/features/platform-admin-dashboard"

function extensionFromName(value: string) {
  const parts = value.toLowerCase().split(".")
  return parts.length > 1 ? parts.pop() ?? "" : ""
}

export function detectProjectAssetTypeFromName(value: string): QuickLink["type"] {
  const ext = extensionFromName(value)
  if (ext === "pdf") return "pdf"
  if (ext === "zip") return "zip"
  if (ext === "fig" || ext === "figma") return "fig"
  if (ext === "doc" || ext === "docx") return "doc"
  return "file"
}

export function detectProjectAssetTypeFromUrl(value: string): QuickLink["type"] {
  try {
    const parsed = new URL(value)
    if (parsed.hostname.toLowerCase().includes("figma.com")) {
      return "fig"
    }
    return detectProjectAssetTypeFromName(parsed.pathname)
  } catch {
    return detectProjectAssetTypeFromName(value)
  }
}

export function sanitizeProjectAssetFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned.length > 0 ? cleaned : "asset"
}

export function buildProjectAssetOpenPath({
  assetId,
  projectId,
  download = false,
}: {
  assetId: string
  projectId: string
  download?: boolean
}) {
  const search = new URLSearchParams({
    projectId,
    assetId,
  })
  if (download) {
    search.set("download", "1")
  }
  return `/api/account/project-assets?${search.toString()}`
}
