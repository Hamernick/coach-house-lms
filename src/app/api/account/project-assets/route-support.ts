import { buildProjectAssetOpenPath } from "@/features/member-workspace"
import type { Database } from "@/lib/supabase"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route"

export type ProjectAssetsRouteClient = ReturnType<
  typeof createSupabaseRouteHandlerClient
>

export type ProjectRow = Pick<
  Database["public"]["Tables"]["organization_projects"]["Row"],
  "id" | "org_id"
>

export type AssetRow = Pick<
  Database["public"]["Tables"]["organization_project_assets"]["Row"],
  | "id"
  | "org_id"
  | "project_id"
  | "name"
  | "description"
  | "asset_type"
  | "storage_path"
  | "external_url"
  | "mime"
  | "size_bytes"
>

export function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

const ALLOWED_FILE_EXTENSIONS = new Set([
  "csv",
  "doc",
  "docx",
  "fig",
  "figma",
  "gif",
  "heic",
  "jpeg",
  "jpg",
  "json",
  "md",
  "mov",
  "mp3",
  "mp4",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "rtf",
  "svg",
  "txt",
  "wav",
  "webp",
  "xls",
  "xlsx",
  "zip",
])
const ALLOWED_MIME_TYPES = new Set([
  "application/json",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.figma",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "audio/mpeg",
  "audio/wav",
  "image/gif",
  "image/heic",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "text/csv",
  "text/markdown",
  "text/plain",
  "video/mp4",
  "video/quicktime",
])
const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"])
const PROJECT_ASSET_FILE_TYPE_HELP =
  "Upload PDF, Word, spreadsheet, image, media, CSV, ZIP, or Figma files only."

function getFileExtension(name: string) {
  const parts = name.toLowerCase().split(".")
  return parts.length > 1 ? (parts.pop() ?? "") : ""
}

export function getProjectAssetFileError(file: File) {
  const extension = getFileExtension(file.name)
  const mime = file.type.toLowerCase()
  const extensionAllowed = extension
    ? ALLOWED_FILE_EXTENSIONS.has(extension)
    : false
  const mimeAllowed =
    GENERIC_MIME_TYPES.has(mime) || ALLOWED_MIME_TYPES.has(mime)

  if (!extensionAllowed && !ALLOWED_MIME_TYPES.has(mime)) {
    return `${file.name} is not an allowed file type. ${PROJECT_ASSET_FILE_TYPE_HELP}`
  }

  if (extensionAllowed && !mimeAllowed) {
    return `${file.name} has an unsupported file type. ${PROJECT_ASSET_FILE_TYPE_HELP}`
  }

  return null
}

export function getProjectAssetLinkError(link: string) {
  try {
    const parsed = new URL(link)
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return null
    }
  } catch {
    return "Use a valid http or https asset link."
  }

  return "Use a valid http or https asset link."
}

export async function isPlatformAdmin({
  supabase,
  userId,
}: {
  supabase: ProjectAssetsRouteClient
  userId: string
}) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  return data?.role === "admin"
}

export async function canAccessProjectOrg({
  orgId,
  requireEdit,
  supabase,
  userId,
}: {
  orgId: string
  requireEdit: boolean
  supabase: ProjectAssetsRouteClient
  userId: string
}) {
  if (await isPlatformAdmin({ supabase, userId })) {
    return true
  }

  if (orgId === userId) {
    return true
  }

  const { data } = await supabase
    .from("organization_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("member_id", userId)
    .maybeSingle<{ role: string | null }>()

  if (!data) {
    return false
  }

  if (!requireEdit) {
    return true
  }

  return data.role === "owner" || data.role === "admin" || data.role === "staff"
}

export async function loadProject({
  projectId,
  supabase,
}: {
  projectId: string
  supabase: ProjectAssetsRouteClient
}) {
  const { data, error } = await supabase
    .from("organization_projects")
    .select("id, org_id")
    .eq("id", projectId)
    .maybeSingle<ProjectRow>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

export async function loadAsset({
  assetId,
  projectId,
  supabase,
}: {
  assetId: string
  projectId: string
  supabase: ProjectAssetsRouteClient
}) {
  const { data, error } = await supabase
    .from("organization_project_assets")
    .select(
      "id, org_id, project_id, name, description, asset_type, storage_path, external_url, mime, size_bytes"
    )
    .eq("id", assetId)
    .eq("project_id", projectId)
    .maybeSingle<AssetRow>()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

export function assetResponse(asset: AssetRow) {
  return {
    id: asset.id,
    projectId: asset.project_id,
    name: asset.name,
    description: asset.description,
    assetType: asset.asset_type,
    externalUrl: asset.external_url,
    sizeBytes: asset.size_bytes,
    url:
      asset.external_url ||
      buildProjectAssetOpenPath({
        assetId: asset.id,
        projectId: asset.project_id,
      }),
  }
}
