export const WORKSPACE_COLLABORATION_INVITE_NOTIFICATION_TYPE =
  "workspace_collaboration_invite"

export type WorkspaceCoachInviteShortcutId = "coach:joel" | "coach:paula"

export type WorkspaceCoachInviteShortcut = {
  id: WorkspaceCoachInviteShortcutId
  name: string
  fullName: string
  email: string | null
  avatarUrl: string | null
  subtitle: string
  badgeLabel: string
  keywords: string[]
}

export type WorkspaceCollaborationInviteNotificationMetadata = {
  inviteId: string
  orgId: string
  organizationName: string
  inviterName: string | null
  inviteeName: string | null
  expiresAt: string
}

const WORKSPACE_COACH_INVITE_SHORTCUTS: WorkspaceCoachInviteShortcut[] = [
  {
    id: "coach:joel",
    name: "Joel",
    fullName: "Joel Hamernick",
    email: "joel@coachhousesolutions.org",
    avatarUrl:
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png",
    subtitle: "Coach reviewer",
    badgeLabel: "Coach",
    keywords: [
      "coach",
      "reviewer",
      "super admin",
      "joel",
      "joel hamernick",
      "coach house",
    ],
  },
  {
    id: "coach:paula",
    name: "Paula",
    fullName: "Paula Hamernick",
    email: null,
    avatarUrl:
      "https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png",
    subtitle: "Coach reviewer",
    badgeLabel: "Coach",
    keywords: [
      "coach",
      "reviewer",
      "super admin",
      "paula",
      "paula hamernick",
      "coach house",
    ],
  },
]

export function listWorkspaceCoachInviteShortcuts() {
  return WORKSPACE_COACH_INVITE_SHORTCUTS
}

export function isWorkspaceCoachInviteShortcutId(
  value: string,
): value is WorkspaceCoachInviteShortcutId {
  return WORKSPACE_COACH_INVITE_SHORTCUTS.some((shortcut) => shortcut.id === value)
}

export function getWorkspaceCoachInviteShortcut(id: WorkspaceCoachInviteShortcutId) {
  return WORKSPACE_COACH_INVITE_SHORTCUTS.find((shortcut) => shortcut.id === id) ?? null
}

export function buildWorkspaceCollaborationInviteNotificationMetadata(
  metadata: WorkspaceCollaborationInviteNotificationMetadata,
) {
  return metadata
}

export function readWorkspaceCollaborationInviteNotificationMetadata(value: unknown) {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const inviteId =
    typeof record.inviteId === "string" && record.inviteId.trim().length > 0
      ? record.inviteId.trim()
      : null
  const orgId =
    typeof record.orgId === "string" && record.orgId.trim().length > 0
      ? record.orgId.trim()
      : null
  const organizationName =
    typeof record.organizationName === "string" &&
    record.organizationName.trim().length > 0
      ? record.organizationName.trim()
      : null
  const inviterName =
    typeof record.inviterName === "string" && record.inviterName.trim().length > 0
      ? record.inviterName.trim()
      : null
  const inviteeName =
    typeof record.inviteeName === "string" && record.inviteeName.trim().length > 0
      ? record.inviteeName.trim()
      : null
  const expiresAt =
    typeof record.expiresAt === "string" && record.expiresAt.trim().length > 0
      ? record.expiresAt.trim()
      : null

  if (!inviteId || !orgId || !organizationName || !expiresAt) {
    return null
  }

  return {
    inviteId,
    orgId,
    organizationName,
    inviterName,
    inviteeName,
    expiresAt,
  } satisfies WorkspaceCollaborationInviteNotificationMetadata
}
