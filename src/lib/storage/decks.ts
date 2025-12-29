import { Buffer } from "node:buffer"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const DECKS_BUCKET = "accelerator-slide-decks"
const MAX_BYTES = 15 * 1024 * 1024 // 15MB safety cap

let bucketEnsured = false

async function ensureDecksBucket() {
  if (bucketEnsured) {
    return
  }

  const admin = createSupabaseAdminClient()

  const { data, error } = await admin.storage.getBucket(DECKS_BUCKET)

  if (error && error.message !== "The resource was not found") {
    throw error
  }

  if (!data) {
    const { error: createError } = await admin.storage.createBucket(DECKS_BUCKET, {
      public: false,
      fileSizeLimit: `${MAX_BYTES}`,
      allowedMimeTypes: ["application/pdf"],
    })

    if (createError && createError.message !== "The resource already exists") {
      throw createError
    }
  }

  bucketEnsured = true
}

export async function uploadModuleDeck({
  moduleId,
  filename,
  fileBuffer,
  previousPath,
}: {
  moduleId: string
  filename: string
  fileBuffer: ArrayBuffer
  previousPath?: string | null
}) {
  await ensureDecksBucket()
  const admin = createSupabaseAdminClient()

  const cleanName = filename
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "deck"
  const objectName = `${moduleId}/${Date.now()}-${cleanName}.pdf`

  const { error } = await admin.storage.from(DECKS_BUCKET).upload(objectName, Buffer.from(fileBuffer), {
    contentType: "application/pdf",
  })

  if (error) {
    throw error
  }

  if (previousPath) {
    await admin.storage.from(DECKS_BUCKET).remove([previousPath]).catch(() => undefined)
  }

  return objectName
}

export async function removeModuleDeck(path: string) {
  if (!path) {
    return
  }

  await ensureDecksBucket()
  const admin = createSupabaseAdminClient()
  await admin.storage.from(DECKS_BUCKET).remove([path]).catch(() => undefined)
}

export async function createModuleDeckSignedUrl(path: string, expiresInSeconds = 60) {
  await ensureDecksBucket()
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin.storage
    .from(DECKS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error) {
    throw error
  }

  return data.signedUrl
}
