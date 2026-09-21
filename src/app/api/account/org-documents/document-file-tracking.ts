import type { Database } from "@/lib/supabase"
import type { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"
import { createNotification } from "@/lib/notifications"

type SupabaseClient = ReturnType<typeof createSupabaseRouteHandlerClient>
type TrackedFile =
  Database["public"]["Tables"]["organization_document_files"]["Row"]

export function sanitizeTrackedDocumentFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-")
  return cleaned.length > 0 ? cleaned : "document.pdf"
}

export function isTrackedDocumentPath(
  path: string,
  orgId: string,
  documentKind: string
) {
  return path.startsWith(`${orgId}/${documentKind}/`)
}

export async function replaceTrackedDocumentFile({
  supabase,
  orgId,
  documentKind,
  storagePath,
  name,
  mimeType,
  sizeBytes,
  userId,
}: {
  supabase: SupabaseClient
  orgId: string
  documentKind: string
  storagePath: string
  name: string
  mimeType: string
  sizeBytes: number
  userId: string
}) {
  const { data: previousFile, error: previousFileError } = await supabase
    .from("organization_document_files")
    .select("*")
    .eq("org_id", orgId)
    .eq("document_kind", documentKind)
    .maybeSingle()

  if (previousFileError) {
    return { error: previousFileError, previousFile: null }
  }

  const { error } = await supabase.from("organization_document_files").upsert(
    {
      org_id: orgId,
      document_kind: documentKind,
      storage_path: storagePath,
      name,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      created_by: userId,
      deleted_at: null,
    },
    { onConflict: "org_id,document_kind" }
  )

  return { error, previousFile }
}

export async function restoreTrackedDocumentFile({
  supabase,
  orgId,
  documentKind,
  previousFile,
}: {
  supabase: SupabaseClient
  orgId: string
  documentKind: string
  previousFile: TrackedFile | null
}) {
  if (previousFile) {
    await supabase
      .from("organization_document_files")
      .upsert(previousFile, { onConflict: "org_id,document_kind" })
    return
  }

  await removeTrackedDocumentFile({ supabase, orgId, documentKind })
}

export async function renameTrackedDocumentFile({
  supabase,
  orgId,
  documentKind,
  name,
}: {
  supabase: SupabaseClient
  orgId: string
  documentKind: string
  name: string
}) {
  await supabase
    .from("organization_document_files")
    .update({ name })
    .eq("org_id", orgId)
    .eq("document_kind", documentKind)
}

export async function removeTrackedDocumentFile({
  supabase,
  orgId,
  documentKind,
}: {
  supabase: SupabaseClient
  orgId: string
  documentKind: string
}) {
  await supabase
    .from("organization_document_files")
    .delete()
    .eq("org_id", orgId)
    .eq("document_kind", documentKind)
}

export async function notifyTrackedDocumentUpload({
  supabase,
  userId,
  documentKind,
  filename,
}: {
  supabase: SupabaseClient
  userId: string
  documentKind: string
  filename: string
}) {
  const result = await createNotification(supabase, {
    userId,
    title: "Document uploaded",
    description: `${filename} added to your documents.`,
    href: "/organization/documents",
    tone: "success",
    type: "document_uploaded",
    actorId: userId,
    metadata: { kind: documentKind, filename },
  })
  if ("error" in result) {
    console.error("Failed to create document notification", result.error)
  }
}
