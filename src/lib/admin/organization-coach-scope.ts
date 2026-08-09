import type { SupabaseClient } from "@supabase/supabase-js"

import type { PlatformAccessLevel } from "@/features/platform-access"
import type { Database } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type {
  OrganizationCoachActorScope,
  OrganizationCoachScopeStatus,
} from "@/lib/organization-coach-scope"

type AdminClient = SupabaseClient<Database>

function isMissingScopeTable(error: { code?: string | null }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export async function loadOrganizationCoachScopeStatus({
  supabase = createSupabaseAdminClient(),
}: {
  supabase?: AdminClient
} = {}): Promise<OrganizationCoachScopeStatus> {
  const { data, error } = await supabase
    .from("organization_coach_scope_settings")
    .select("assigned_only_enabled, activated_at")
    .eq("id", true)
    .maybeSingle<{
      assigned_only_enabled: boolean
      activated_at: string | null
    }>()

  if (error && isMissingScopeTable(error)) {
    return {
      available: false,
      assignedOnlyEnabled: false,
      activatedAt: null,
    }
  }
  if (error) throw new Error("Unable to load coach visibility settings.")

  return {
    available: true,
    assignedOnlyEnabled: data?.assigned_only_enabled === true,
    activatedAt: data?.activated_at ?? null,
  }
}

export async function loadOrganizationCoachActorScope({
  accessLevel,
  supabase = createSupabaseAdminClient(),
  userId,
}: {
  accessLevel: PlatformAccessLevel | null
  supabase?: AdminClient
  userId: string
}): Promise<OrganizationCoachActorScope> {
  if (accessLevel !== "coach") return { mode: "all" }

  const status = await loadOrganizationCoachScopeStatus({ supabase })
  if (!status.available || !status.assignedOnlyEnabled) {
    return { mode: "all" }
  }

  const { data, error } = await supabase
    .from("organization_coach_assignments")
    .select("organization_id")
    .eq("coach_user_id", userId)
    .returns<Array<{ organization_id: string }>>()

  if (error && isMissingScopeTable(error)) return { mode: "all" }
  if (error) throw new Error("Unable to load coach organization access.")

  return {
    mode: "assigned",
    organizationIds: new Set((data ?? []).map((row) => row.organization_id)),
  }
}
