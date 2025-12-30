import { extractPublicObjectPath } from "./public-url"

const ORG_MEDIA_BUCKET = "org-media"

export type OrgMediaCleanupInput = {
  previousUrl: string | null | undefined
  nextUrl: string | null | undefined
  userId: string
}

export function resolveOrgMediaCleanupPath({ previousUrl, nextUrl, userId }: OrgMediaCleanupInput): string | null {
  if (!previousUrl) return null
  if (previousUrl === nextUrl) return null
  const objectPath = extractPublicObjectPath(previousUrl, ORG_MEDIA_BUCKET)
  if (!objectPath) return null
  if (!objectPath.startsWith(`${userId}/`)) return null
  return objectPath
}

export { ORG_MEDIA_BUCKET }
