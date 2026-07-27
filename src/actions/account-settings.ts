"use server"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"

export async function loadActiveOrganizationNameAction(): Promise<
  string | null
> {
  const { activeOrg, supabase } = await resolveAuthenticatedAppContext()
  const { data } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", activeOrg.orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  const name = data?.profile?.name
  return typeof name === "string" ? name : null
}
