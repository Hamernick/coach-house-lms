import type { Database } from "@/lib/supabase"
import {
  sanitizeOrgProfileText,
  shouldStripOrgProfileHtml,
} from "@/lib/organization/profile-cleanup"
import {
  getOrganizationCoreDocumentKey,
  type OrganizationCoreDocuments,
  updateOrganizationCoreDocuments,
} from "@/lib/roadmap"

import type { SupabaseServerClient } from "./types"

type SyncMappedAnswersToOrganizationProfileParams = {
  supabase: SupabaseServerClient
  organizationId: string
  sanitizedAnswers: Record<string, unknown>
  orgKeyMapping: Record<string, string>
}

export async function syncMappedAnswersToOrganizationProfile({
  supabase,
  organizationId,
  sanitizedAnswers,
  orgKeyMapping,
}: SyncMappedAnswersToOrganizationProfileParams): Promise<
  { ok: true } | { error: string }
> {
  if (Object.keys(orgKeyMapping).length === 0) {
    return { ok: true }
  }

  const { data: organizationRow, error: organizationError } = await supabase
    .from("organizations" satisfies keyof Database["public"]["Tables"])
    .select("profile, updated_at")
    .eq("user_id", organizationId)
    .maybeSingle<{
      profile: Record<string, unknown> | null
      updated_at: string
    }>()

  if (organizationError) {
    return { error: organizationError.message }
  }

  const currentProfile = (organizationRow?.profile ?? {}) as Record<
    string,
    unknown
  >
  let nextProfile: Record<string, unknown> = { ...currentProfile }
  const coreDocumentUpdates: Partial<OrganizationCoreDocuments> = {}

  for (const [fieldName, organizationKey] of Object.entries(orgKeyMapping)) {
    const value = sanitizedAnswers[fieldName]
    let normalizedValue: string | string[] | number | null = null
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        normalizedValue = trimmed
      }
    } else if (Array.isArray(value)) {
      const normalized = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
      if (normalized.length > 0) {
        normalizedValue = normalized
      }
    } else if (typeof value === "number") {
      normalizedValue = value
    }

    if (normalizedValue === null) continue
    const coreDocumentKey = getOrganizationCoreDocumentKey(organizationKey)
    if (coreDocumentKey) {
      coreDocumentUpdates[coreDocumentKey] = Array.isArray(normalizedValue)
        ? normalizedValue.join("\n")
        : String(normalizedValue)
      continue
    }

    if (typeof normalizedValue === "string") {
      const cleaned = shouldStripOrgProfileHtml(organizationKey)
        ? sanitizeOrgProfileText(normalizedValue)
        : normalizedValue
      if (cleaned) nextProfile[organizationKey] = cleaned
    } else if (Array.isArray(normalizedValue)) {
      nextProfile[organizationKey] = shouldStripOrgProfileHtml(organizationKey)
        ? normalizedValue.join("\n")
        : normalizedValue
    } else {
      nextProfile[organizationKey] = normalizedValue
    }
  }

  nextProfile = updateOrganizationCoreDocuments(
    nextProfile,
    coreDocumentUpdates
  ).nextProfile

  if (!organizationRow) {
    return { error: "Organization not found." }
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("organizations" satisfies keyof Database["public"]["Tables"])
    .update({
      profile:
        nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
    } as Database["public"]["Tables"]["organizations"]["Update"])
    .eq("user_id", organizationId)
    .eq("updated_at", organizationRow.updated_at)
    .select("user_id")
    .maybeSingle<{ user_id: string }>()

  if (updateError) return { error: updateError.message }
  return updatedRow
    ? { ok: true }
    : { error: "Organization was updated elsewhere. Submit again." }
}
