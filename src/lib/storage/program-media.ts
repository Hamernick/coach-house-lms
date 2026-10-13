import { extractPublicObjectPath } from "@/lib/storage/public-url"

const PROGRAM_MEDIA_BUCKET = "program-media"
const PROGRAM_MEDIA_MAX_BYTES = 20 * 1024 * 1024
const PROGRAM_MEDIA_ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
])

export function validateProgramMediaFile(file: File): string | null {
  if (!PROGRAM_MEDIA_ALLOWED.has(file.type)) {
    return "Unsupported image type. Use PNG, JPEG, WebP, or SVG."
  }
  if (file.size > PROGRAM_MEDIA_MAX_BYTES) {
    return "Image too large. Max size is 20 MB."
  }
  return null
}

export async function uploadProgramMedia({
  file,
}: {
  file: File
}): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch("/api/account/program-media", {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || "Upload failed")
  }
  const payload = (await res.json()) as { url?: string }
  if (!payload.url) {
    throw new Error("Upload failed")
  }
  return payload.url
}

export async function deleteProgramMedia({
  url,
}: {
  url: string
}): Promise<void> {
  const res = await fetch("/api/account/program-media", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || "Remove failed")
  }
}

export function resolveProgramMediaObjectPath(
  url: string | null | undefined,
): string | null {
  if (!url) return null
  return extractPublicObjectPath(url, PROGRAM_MEDIA_BUCKET)
}

export function resolveProgramMediaCleanupPath({
  previousUrl,
  nextUrl,
  userId,
}: {
  previousUrl?: string | null
  nextUrl?: string | null
  userId: string
}): string | null {
  if (!previousUrl) return null
  if (previousUrl === nextUrl) return null
  const objectPath = resolveProgramMediaObjectPath(previousUrl)
  if (!objectPath) return null
  if (!objectPath.startsWith(`${userId}/`)) return null
  return objectPath
}

export { PROGRAM_MEDIA_BUCKET }
