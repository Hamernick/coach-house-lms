import { redirect } from "next/navigation"

import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { resolvePaidTeamAccessForOrgSubscription } from "@/lib/billing/subscription-access"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { hasPlatformCapability } from "@/features/platform-access"

import { getMemberWorkspacePaywallPath } from "./routes"

export const MEMBER_WORKSPACE_UPGRADE_MESSAGE =
  "Upgrade to Organization to use Projects and Tasks."

export function actorHasMemberWorkspaceAccess(actor: {
  isAdmin: boolean
  isPlatformStaff?: boolean
  hasMemberWorkspaceAccess?: boolean
}) {
  return (
    actor.isAdmin ||
    actor.isPlatformStaff === true ||
    actor.hasMemberWorkspaceAccess === true
  )
}

export function ensureMemberWorkspaceFeatureAccess(actor: {
  isAdmin: boolean
  isPlatformStaff?: boolean
  hasMemberWorkspaceAccess?: boolean
}) {
  if (actorHasMemberWorkspaceAccess(actor)) return null
  return { error: MEMBER_WORKSPACE_UPGRADE_MESSAGE } as const
}

export async function requireMemberWorkspacePageAccess(source: string) {
  const { profileAudience, activeOrg, user } =
    await resolveAuthenticatedAppContext()
  if (profileAudience.isPlatformStaff) {
    if (
      source === "tasks" &&
      !hasPlatformCapability(profileAudience.platformAccessLevel, "tasks")
    ) {
      redirect("/organizations")
    }
    return
  }

  const admin = createSupabaseAdminClient()
  const paidAccess = await resolvePaidTeamAccessForOrgSubscription({
    supabase: admin,
    orgId: activeOrg.orgId,
  })

  if ("hasPaidTeamAccess" in paidAccess && paidAccess.hasPaidTeamAccess) return

  const syncedEntitlements = await fetchLearningEntitlements({
    supabase: admin,
    userId: user.id,
    orgUserId: activeOrg.orgId,
    forceStripeSync: true,
  })
  if (syncedEntitlements.hasActiveSubscription) return

  redirect(getMemberWorkspacePaywallPath(source))
}
