import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"

export type WorkspaceAccessPerson = {
  id: string
  name: string
  subtitle: string
  avatarUrl: string | null
}

export function buildWorkspaceAccessPeople({
  currentUser,
  members,
}: {
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  members: WorkspaceMemberOption[]
}) {
  const next: WorkspaceAccessPerson[] = []
  const seen = new Set<string>()

  const pushPerson = (person: WorkspaceAccessPerson) => {
    if (seen.has(person.id)) return
    seen.add(person.id)
    next.push(person)
  }

  pushPerson({
    id: currentUser.id,
    name: currentUser.name || "You",
    subtitle: "You",
    avatarUrl: currentUser.avatarUrl,
  })

  for (const member of members) {
    pushPerson({
      id: member.userId,
      name: member.name?.trim() || member.email || "Member",
      subtitle: member.isOwner ? "Owner" : member.role,
      avatarUrl: member.avatarUrl,
    })
  }

  return next
}

export function countActiveWorkspaceInvites(
  invites: WorkspaceCollaborationInvite[],
  nowMs: number,
) {
  return invites.filter((invite) => {
    if (invite.revokedAt) return false
    const expiresAt = new Date(invite.expiresAt).getTime()
    return Number.isFinite(expiresAt) && expiresAt > nowMs
  }).length
}

export function shouldShowWorkspaceTeamAccessEmptyState({
  accessPeopleCount,
  activeInviteCount,
}: {
  accessPeopleCount: number
  activeInviteCount: number
}) {
  return accessPeopleCount <= 1 && activeInviteCount === 0
}
