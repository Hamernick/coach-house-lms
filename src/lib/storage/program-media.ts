import { extractPublicObjectPath } from "@/lib/storage/public-url"

const PROGRAM_MEDIA_BUCKET = "program-media"

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
  const objectPath = extractPublicObjectPath(previousUrl, PROGRAM_MEDIA_BUCKET)
  if (!objectPath) return null
  if (!objectPath.startsWith(`${userId}/`)) return null
  return objectPath
}

export { PROGRAM_MEDIA_BUCKET }
