import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { extractPublicObjectPath } from "@/lib/storage/public-url"

export const AVATARS_BUCKET = "avatars"
const MAX_BYTES = 5 * 1024 * 1024

let bucketEnsured = false

async function ensureBucket() {
  if (bucketEnsured) return
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.storage.getBucket(AVATARS_BUCKET)
  if (error && error.message !== "The resource was not found") {
    throw supabaseErrorToError(error, "Unable to load avatar bucket.")
  }
  if (!data) {
    const { error: createError } = await admin.storage.createBucket(AVATARS_BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_BYTES}`,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
    })
    if (createError && createError.message !== "The resource already exists") {
      throw supabaseErrorToError(createError, "Unable to create avatar bucket.")
    }
  }
  bucketEnsured = true
}

// Preferred: upload using the authenticated user's credentials (no service role required)
export async function uploadAvatarWithUser({
  client,
  userId,
  file,
}: {
  client: SupabaseClient<Database>
  userId: string
  file: File
}) {
  const ext = file.type.split("/").pop() || "png"
  const objectName = `${userId}/${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error } = await client.storage.from(AVATARS_BUCKET).upload(objectName, buf, { contentType: file.type })
  if (error) throw supabaseErrorToError(error, "Unable to upload avatar.")
  const { data: publicUrl } = client.storage.from(AVATARS_BUCKET).getPublicUrl(objectName)
  return publicUrl.publicUrl
}

// Fallback: admin upload (requires SUPABASE_SERVICE_ROLE_KEY)
export async function uploadAvatarAdmin({ userId, file }: { userId: string; file: File }) {
  await ensureBucket()
  const admin = createSupabaseAdminClient()
  const ext = file.type.split("/").pop() || "png"
  const objectName = `${userId}/${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(AVATARS_BUCKET).upload(objectName, buf, { contentType: file.type })
  if (error) throw supabaseErrorToError(error, "Unable to upload avatar.")
  const { data: publicUrl } = admin.storage.from(AVATARS_BUCKET).getPublicUrl(objectName)
  return publicUrl.publicUrl
}

export function resolveAvatarCleanupPath({
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
  const objectPath = extractPublicObjectPath(previousUrl, AVATARS_BUCKET)
  if (!objectPath) return null
  if (!objectPath.startsWith(`${userId}/`)) return null
  return objectPath
}
