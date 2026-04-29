import {
  type OrganizationMemberRole,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { WORKSPACE_PATH } from "@/lib/workspace/routes"

import {
  buildWorkspaceCollaborationInviteNotificationMetadata,
  getWorkspaceCoachInviteShortcut,
  isWorkspaceCoachInviteShortcutId,
  WORKSPACE_COLLABORATION_INVITE_NOTIFICATION_TYPE,
  type WorkspaceCoachInviteShortcutId,
} from "./workspace-collaboration-invite-helpers"
import {
  readWorkspaceCollaborationInvitesFromRows,
  type WorkspaceCollaborationInviteRow,
} from "./workspace-state"
import { isMissingWorkspaceInvitesTableError } from "./workspace-view-helpers"

export type ActorContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  user: { id: string }
  activeOrg: {
    orgId: string
    role: OrganizationMemberRole
  }
}

type ActorContextResult = ActorContext | { error: string }

export async function resolveActor(): Promise<ActorContextResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    return { error: "Unable to load user." as const }
  }
  if (!user) {
    return { error: "You must be signed in." as const }
  }

  const activeOrg = await resolveActiveOrganization(supabase, user.id)
  return {
    supabase,
    user: { id: user.id },
    activeOrg,
  }
}

export async function loadWorkspaceInvites(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orgId: string,
) {
  const { data, error } = await supabase
    .from("organization_workspace_invites")
    .select(
      "id, user_id, user_name, user_email, created_by, created_at, expires_at, revoked_at, duration_value, duration_unit",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .returns<WorkspaceCollaborationInviteRow[]>()

  if (error && !isMissingWorkspaceInvitesTableError(error)) {
    return { error: "Unable to load collaboration invites." as const }
  }

  return {
    invites: readWorkspaceCollaborationInvitesFromRows(data),
  }
}

export async function resolveWorkspaceOrganizationName({
  client,
  orgId,
}: {
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
}) {
  const { data: orgRow } = await client
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = orgRow?.profile ?? null
  const name = typeof profile?.name === "string" ? profile.name.trim() : ""
  return name.length > 0 ? name : "Coach House workspace"
}

export async function resolveProfileDisplayName({
  client,
  userId,
}: {
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>
  userId: string
}) {
  const { data: profile } = await client
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; email: string | null }>()

  return profile?.full_name?.trim() || profile?.email?.trim() || null
}

async function resolveShortcutInviteeProfile({
  client,
  shortcutId,
}: {
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>
  shortcutId: WorkspaceCoachInviteShortcutId
}) {
  const shortcut = getWorkspaceCoachInviteShortcut(shortcutId)
  if (!shortcut) return null

  const { data } = await client
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("role", "admin")
    .limit(50)
    .returns<
      Array<{
        id: string
        full_name: string | null
        email: string | null
        avatar_url: string | null
        role: string | null
      }>
    >()

  const exactNameMatch =
    data?.find((profile) => profile.full_name?.trim() === shortcut.fullName) ?? null
  if (exactNameMatch) return exactNameMatch

  const exactEmailMatch =
    shortcut.email && data
      ? data.find((profile) => profile.email?.trim().toLowerCase() === shortcut.email?.toLowerCase()) ?? null
      : null
  if (exactEmailMatch) return exactEmailMatch

  const looseNameMatch =
    data?.find((profile) =>
      profile.full_name?.toLowerCase().includes(shortcut.name.toLowerCase()),
    ) ?? null
  if (looseNameMatch) return looseNameMatch

  return data?.[0] ?? null
}

export async function resolveWorkspaceInviteTarget({
  supabase,
  targetId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  targetId: string
}) {
  let profileClient = supabase
  try {
    profileClient = createSupabaseAdminClient()
  } catch {
    // Local environments can omit service-role credentials.
  }

  if (isWorkspaceCoachInviteShortcutId(targetId)) {
    const shortcutProfile = await resolveShortcutInviteeProfile({
      client: profileClient,
      shortcutId: targetId,
    })
    if (!shortcutProfile?.id) return null
    return {
      id: shortcutProfile.id,
      fullName: shortcutProfile.full_name,
      email: shortcutProfile.email,
      avatarUrl: shortcutProfile.avatar_url,
      role: shortcutProfile.role,
      isPlatformAdmin: shortcutProfile.role === "admin",
    }
  }

  const { data: profile } = await profileClient
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", targetId)
    .maybeSingle<{
      id: string
      full_name: string | null
      email: string | null
      avatar_url: string | null
      role: string | null
    }>()

  if (!profile?.id) return null

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    isPlatformAdmin: profile.role === "admin",
  }
}

export async function notifyWorkspaceInvitee({
  supabase,
  userId,
  orgId,
  organizationName,
  inviterName,
  actorId,
  inviteeName,
  inviteId,
  expiresAt,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  userId: string
  orgId: string
  organizationName: string
  inviterName: string | null
  actorId: string | null
  inviteeName: string | null
  inviteId: string
  expiresAt: string
}) {
  let notificationClient = supabase
  try {
    notificationClient = createSupabaseAdminClient()
  } catch {
    return false
  }

  const metadata = buildWorkspaceCollaborationInviteNotificationMetadata({
    inviteId,
    orgId,
    organizationName,
    inviterName,
    inviteeName,
    expiresAt,
  })

  const { data: existing } = await notificationClient
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", WORKSPACE_COLLABORATION_INVITE_NOTIFICATION_TYPE)
    .contains("metadata", { inviteId })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (existing?.id) return true

  const notification = await createNotification(notificationClient as never, {
    userId,
    orgId,
    actorId,
    href: WORKSPACE_PATH,
    tone: "info",
    type: WORKSPACE_COLLABORATION_INVITE_NOTIFICATION_TYPE,
    title: `${organizationName} shared temporary workspace access`,
    description: inviterName
      ? `${inviterName} invited you to review this workspace.`
      : "A teammate invited you to review this workspace.",
    metadata,
  })

  return !("error" in notification)
}
