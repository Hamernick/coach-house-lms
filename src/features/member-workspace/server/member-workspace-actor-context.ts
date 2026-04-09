import { cache } from "react"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { canEditOrganization } from "@/lib/organization/active-org"

const resolveMemberWorkspaceActorContextCached = cache(async () => {
  const { supabase, user, profileAudience, activeOrg } =
    await resolveAuthenticatedAppContext()
  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const metadataFirstName = typeof userMeta?.first_name === "string" ? userMeta.first_name.trim() : ""
  const metadataLastName = typeof userMeta?.last_name === "string" ? userMeta.last_name.trim() : ""
  const metadataFullName = [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim()
  const metadataAvatarUrl =
    typeof userMeta?.avatar_url === "string" && userMeta.avatar_url.trim().length > 0
      ? userMeta.avatar_url.trim()
      : typeof userMeta?.picture === "string" && userMeta.picture.trim().length > 0
        ? userMeta.picture.trim()
        : typeof userMeta?.avatar === "string" && userMeta.avatar.trim().length > 0
          ? userMeta.avatar.trim()
          : null

  return {
    supabase,
    userId: user.id,
    isAdmin: profileAudience.isAdmin,
    activeOrg,
    canEdit: canEditOrganization(activeOrg.role),
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
