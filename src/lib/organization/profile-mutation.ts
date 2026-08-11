import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

const DEFAULT_MAX_ATTEMPTS = 4

export const ORGANIZATION_PROFILE_CONFLICT_ERROR =
  "Organization data changed while you were saving. Refresh and try again."

type OrganizationProfile = Record<string, unknown>

export type OrganizationProfileMutation<T> =
  | { changed: false; value: T }
  | {
      changed: true
      nextProfile: OrganizationProfile
      value: T
    }
  | { error: string; status?: number }

export type OrganizationProfileMutationResult<T> =
  | { ok: true; value: T }
  | { error: string; status: number }

export async function mutateOrganizationProfile<T>({
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  mutate,
  orgId,
  supabase,
}: {
  maxAttempts?: number
  mutate: (profile: OrganizationProfile) => OrganizationProfileMutation<T>
  orgId: string
  supabase: SupabaseClient<Database>
}): Promise<OrganizationProfileMutationResult<T>> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data: organization, error: readError } = await supabase
      .from("organizations")
      .select("profile, updated_at")
      .eq("user_id", orgId)
      .maybeSingle<{
        profile: OrganizationProfile | null
        updated_at: string
      }>()

    if (readError) {
      return { error: readError.message, status: 500 }
    }
    if (!organization) {
      return { error: "Organization not found.", status: 404 }
    }

    const result = mutate(organization.profile ?? {})
    if ("error" in result) {
      return { error: result.error, status: result.status ?? 400 }
    }
    if (!result.changed) {
      return { ok: true, value: result.value }
    }

    const profile =
      result.nextProfile as Database["public"]["Tables"]["organizations"]["Update"]["profile"]
    const { data: updated, error: writeError } = await supabase
      .from("organizations")
      .update({ profile })
      .eq("user_id", orgId)
      .eq("updated_at", organization.updated_at)
      .select("updated_at")
      .maybeSingle<{ updated_at: string }>()

    if (writeError) {
      return { error: writeError.message, status: 500 }
    }
    if (updated) {
      return { ok: true, value: result.value }
    }
  }

  return { error: ORGANIZATION_PROFILE_CONFLICT_ERROR, status: 409 }
}
