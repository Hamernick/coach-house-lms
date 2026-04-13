import {
  buildProjectAssetOpenPath,
} from "@/features/member-workspace"
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
    return !requireEdit
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
      "id, org_id, project_id, name, description, asset_type, storage_path, external_url, mime, size_bytes",
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
