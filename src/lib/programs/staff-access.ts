import { z } from "zod"
import { hasPlatformCapability, type PlatformAccessLevel } from "@/features/platform-access"
import { loadOrganizationCoachActorScope } from "@/lib/admin/organization-coach-scope"
import { canAccessOrganizationInCoachScope } from "@/lib/organization-coach-scope"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function resolveStaffProgramAccess({ organizationId, userId, accessLevel }: {
  organizationId: string
  userId: string
  accessLevel: PlatformAccessLevel | null
}) {
  if (!z.string().uuid().safeParse(organizationId).success ||
      !hasPlatformCapability(accessLevel, "organizations")) return { error: "Forbidden" } as const
  const supabase = createSupabaseAdminClient({ actorId: userId })
  const scope = await loadOrganizationCoachActorScope({ supabase, userId, accessLevel })
  if (!canAccessOrganizationInCoachScope(scope, organizationId)) return { error: "Forbidden" } as const
  return { supabase, orgId: organizationId } as const
}
