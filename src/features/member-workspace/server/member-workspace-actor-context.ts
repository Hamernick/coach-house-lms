import { cache } from "react"

import { hasPlatformCapability } from "@/features/platform-access"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { resolvePaidTeamAccessForOrgSubscription } from "@/lib/billing/subscription-access"
import { canEditOrganization } from "@/lib/organization/active-org"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const resolveMemberWorkspaceActorContextCached = cache(async () => {
  const { supabase, user, profileAudience, activeOrg } =
    await resolveAuthenticatedAppContext()
  const userMeta =
    (user.user_metadata as Record<string, unknown> | null) ?? null
  const metadataFirstName =
    typeof userMeta?.first_name === "string" ? userMeta.first_name.trim() : ""
  const metadataLastName =
    typeof userMeta?.last_name === "string" ? userMeta.last_name.trim() : ""
  const metadataFullName = [metadataFirstName, metadataLastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const metadataAvatarUrl =
    typeof userMeta?.avatar_url === "string" &&
    userMeta.avatar_url.trim().length > 0
      ? userMeta.avatar_url.trim()
      : typeof userMeta?.picture === "string" &&
          userMeta.picture.trim().length > 0
        ? userMeta.picture.trim()
        : typeof userMeta?.avatar === "string" &&
            userMeta.avatar.trim().length > 0
          ? userMeta.avatar.trim()
          : null
  const isPlatformStaff =
    profileAudience.isPlatformStaff || profileAudience.isAdmin
  const adminSupabase = createSupabaseAdminClient()
  const dataSupabase = isPlatformStaff ? adminSupabase : supabase
  const paidAccess = isPlatformStaff
    ? { hasPaidTeamAccess: true }
    : await resolvePaidTeamAccessForOrgSubscription({
        supabase: adminSupabase,
        orgId: activeOrg.orgId,
      })

  return {
    supabase: dataSupabase,
    userId: user.id,
    isAdmin: profileAudience.isAdmin,
    isPlatformStaff,
    platformAccessLevel: profileAudience.platformAccessLevel,
    canAccessOrganizations: hasPlatformCapability(
      profileAudience.platformAccessLevel,
      "organizations"
    ),
    activeOrg,
    canEdit: canEditOrganization(activeOrg.role),
    hasMemberWorkspaceAccess:
      isPlatformStaff ||
      ("hasPaidTeamAccess" in paidAccess && paidAccess.hasPaidTeamAccess),
    currentUser: {
      id: user.id,
      name:
        profileAudience.fullName?.trim() ||
        metadataFullName ||
        user.email?.trim() ||
        "You",
      avatarUrl: profileAudience.avatarUrl?.trim() || metadataAvatarUrl,
    },
  }
})

export async function resolveMemberWorkspaceActorContext() {
  return resolveMemberWorkspaceActorContextCached()
}
