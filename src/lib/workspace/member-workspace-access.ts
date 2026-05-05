import { redirect } from "next/navigation"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { resolvePaidTeamAccessForOrgSubscription } from "@/lib/billing/subscription-access"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { getMemberWorkspacePaywallPath } from "./routes"

export const MEMBER_WORKSPACE_UPGRADE_MESSAGE =
  "Upgrade to Organization to use Projects and Tasks."

export function actorHasMemberWorkspaceAccess(actor: {
  isAdmin: boolean
  hasMemberWorkspaceAccess?: boolean
}) {
  return actor.isAdmin || actor.hasMemberWorkspaceAccess === true
}

export function ensureMemberWorkspaceFeatureAccess(actor: {
  isAdmin: boolean
  hasMemberWorkspaceAccess?: boolean
}) {
  if (actorHasMemberWorkspaceAccess(actor)) return null
  return { error: MEMBER_WORKSPACE_UPGRADE_MESSAGE } as const
}

export async function requireMemberWorkspacePageAccess(source: string) {
  const { profileAudience, activeOrg } = await resolveAuthenticatedAppContext()
  if (profileAudience.isAdmin) return

  const paidAccess = await resolvePaidTeamAccessForOrgSubscription({
    supabase: createSupabaseAdminClient(),
    orgId: activeOrg.orgId,
  })

  if ("hasPaidTeamAccess" in paidAccess && paidAccess.hasPaidTeamAccess) return

  redirect(getMemberWorkspacePaywallPath(source))
}
