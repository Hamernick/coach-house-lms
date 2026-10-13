import type { Database } from "@/lib/supabase"
import { sanitizeOrgProfileText, shouldStripOrgProfileHtml } from "@/lib/organization/profile-cleanup"

import type { SupabaseServerClient } from "./types"

type SyncMappedAnswersToOrganizationProfileParams = {
  supabase: SupabaseServerClient
  userId: string
  sanitizedAnswers: Record<string, unknown>
  orgKeyMapping: Record<string, string>
}

export async function syncMappedAnswersToOrganizationProfile({
  supabase,
  userId,
  sanitizedAnswers,
  orgKeyMapping,
}: SyncMappedAnswersToOrganizationProfileParams): Promise<void> {
  if (Object.keys(orgKeyMapping).length === 0) {
    return
  }

  const { data: organizationRow, error: organizationError } = await supabase
    .from("organizations" satisfies keyof Database["public"]["Tables"])
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (organizationError) {
    return
  }

  const currentProfile = (organizationRow?.profile ?? {}) as Record<string, unknown>
  const nextProfile: Record<string, unknown> = { ...currentProfile }

  for (const [fieldName, organizationKey] of Object.entries(orgKeyMapping)) {
    const value = sanitizedAnswers[fieldName]
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        const cleaned = shouldStripOrgProfileHtml(organizationKey) ? sanitizeOrgProfileText(trimmed) : trimmed
        if (cleaned) {
          nextProfile[organizationKey] = cleaned
        }
      }
    } else if (Array.isArray(value)) {
      const normalized = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
      if (normalized.length > 0) {
        if (shouldStripOrgProfileHtml(organizationKey)) {
          nextProfile[organizationKey] = normalized.join("\n")
        } else {
          nextProfile[organizationKey] = normalized
        }
      }
    } else if (typeof value === "number") {
      nextProfile[organizationKey] = value
    }
  }

  await supabase
    .from("organizations" satisfies keyof Database["public"]["Tables"])
    .upsert(
      {
        user_id: userId,
        profile: nextProfile as Database["public"]["Tables"]["organizations"]["Insert"]["profile"],
      } as Database["public"]["Tables"]["organizations"]["Insert"],
      { onConflict: "user_id" },
    )
}
