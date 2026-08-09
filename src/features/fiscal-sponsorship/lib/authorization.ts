import type { SupabaseClient } from "@supabase/supabase-js"

import type { PlatformAccessLevel } from "@/features/platform-access"
import type { Database } from "@/lib/supabase"

type FiscalAuthorizationClient = SupabaseClient<Database, "public">

export async function canManageFiscalSponsorshipForOrganization({
  accessLevel,
  organizationId,
  supabase,
  userId,
}: {
  accessLevel: PlatformAccessLevel | null
  organizationId: string
  supabase: Pick<FiscalAuthorizationClient, "from">
  userId: string
}) {
  if (accessLevel === "developer") return true
  if (accessLevel !== "coach") return false

  const { data, error } = await supabase
    .from("organization_coach_assignments")
    .select("coach_user_id")
    .eq("organization_id", organizationId)
    .eq("coach_user_id", userId)
    .maybeSingle<{ coach_user_id: string }>()

  if (error) {
    console.error(
      "[fiscal-sponsorship] Unable to verify coach assignment.",
      error
    )
    return false
  }

  return Boolean(data)
}
