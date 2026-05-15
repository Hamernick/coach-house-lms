import type { OrganizationMemberRole } from "@/lib/organization/active-org"
import type { createSupabaseServerClient } from "@/lib/supabase"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "../_components/workspace-board/workspace-board-types"
import { normalizeMembershipRole } from "./workspace-view-helpers"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type WorkspaceViewViewer = {
  id: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
}

export type WorkspaceViewMembershipRow = {
  member_id: string
  role: string | null
  member_email: string | null
}

function applyViewerWorkspaceMemberFallbacks({
  viewer,
  nameById,
  emailById,
  avatarById,
}: {
  viewer: WorkspaceViewViewer
  nameById: Map<string, string>
  emailById: Map<string, string | null>
  avatarById: Map<string, string | null>
}) {
  if (viewer.fullName && viewer.fullName.trim().length > 0) {
    nameById.set(viewer.id, viewer.fullName.trim())
  }
  if (viewer.email && viewer.email.trim().length > 0) {
    emailById.set(viewer.id, viewer.email.trim())
  }
  if (viewer.avatarUrl && viewer.avatarUrl.trim().length > 0) {
    avatarById.set(viewer.id, viewer.avatarUrl.trim())
  }
}

export async function loadWorkspaceViewMemberSeed({
  supabase,
  orgId,
  viewer,
  memberships,
  collaborationInvites,
}: {
  supabase: SupabaseServerClient
  orgId: string
  viewer: WorkspaceViewViewer
  memberships: WorkspaceViewMembershipRow[]
  collaborationInvites: WorkspaceCollaborationInvite[]
}): Promise<{
  members: WorkspaceMemberOption[]
  viewerName: string
  viewerAvatarUrl: string | null
  collaborationInvites: WorkspaceCollaborationInvite[]
}> {
  const memberIds = Array.from(
    new Set([orgId, ...memberships.map((membership) => membership.member_id)]),
  )

  const profilesResult =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", memberIds)
          .returns<Array<{ id: string; full_name: string | null; avatar_url: string | null }>>()
      : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> }

  const nameById = new Map<string, string>()
  const avatarById = new Map<string, string | null>()
  for (const member of profilesResult.data ?? []) {
    if (member.full_name && member.full_name.trim().length > 0) {
      nameById.set(member.id, member.full_name.trim())
    }
    avatarById.set(
      member.id,
      member.avatar_url && member.avatar_url.trim().length > 0
        ? member.avatar_url
        : null,
    )
  }

  const emailById = new Map<string, string | null>()
  for (const membership of memberships) {
    if (membership.member_email) {
      emailById.set(membership.member_id, membership.member_email)
    }
  }
  applyViewerWorkspaceMemberFallbacks({ viewer, nameById, emailById, avatarById })

  const roleById = new Map<string, OrganizationMemberRole>([[orgId, "owner"]])
  for (const membership of memberships) {
    roleById.set(membership.member_id, normalizeMembershipRole(membership.role))
  }

  const members = memberIds.map((memberId) => ({
    userId: memberId,
    name: nameById.get(memberId) ?? null,
    email: emailById.get(memberId) ?? null,
    avatarUrl: avatarById.get(memberId) ?? null,
    role: roleById.get(memberId) ?? "member",
    isOwner: memberId === orgId,
  }))

  const viewerName =
    nameById.get(viewer.id) ??
    (viewer.fullName && viewer.fullName.trim().length > 0
      ? viewer.fullName.trim()
      : viewer.email ?? "Teammate")
  const viewerAvatarUrl =
    viewer.avatarUrl && viewer.avatarUrl.trim().length > 0
      ? viewer.avatarUrl.trim()
      : null
  const enrichedInvites = collaborationInvites.slice(0, 24).map((invite) => ({
    ...invite,
    userName: invite.userName ?? nameById.get(invite.userId) ?? null,
    userEmail: invite.userEmail ?? emailById.get(invite.userId) ?? null,
  }))

  return {
    members,
    viewerName,
    viewerAvatarUrl,
    collaborationInvites: enrichedInvites,
  }
}
