import type { createSupabaseServerClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { OrganizationMemberRole } from "@/lib/organization/active-org"

import {
  buildWorkspaceCommunicationActivityByDayFromPosts,
  canInviteWorkspaceCollaborators,
  readWorkspaceBoardStateValue,
  readWorkspaceCommunicationChannelConnectionsFromRows,
  readWorkspaceCommunicationPostsFromRows,
  readWorkspaceCollaborationInvitesFromRows,
  type WorkspaceCommunicationChannelConnectionRow,
  type WorkspaceCommunicationPostRow,
  type WorkspaceCollaborationInviteRow,
} from "./workspace-state"
import type {
  WorkspaceTrackerState,
  WorkspaceTrackerTicketPriority,
  WorkspaceTrackerTicketStatus,
} from "../_components/workspace-board/workspace-board-types"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type BuildWorkspaceViewSeedInput<
  TInitialProfile,
  TFormationSummary,
  TCalendarView,
  TAcceleratorTimeline,
> = {
  supabase: SupabaseServerClient
  orgId: string
  role: OrganizationMemberRole
  canEdit: boolean
  acceleratorOverlayEnabled: boolean
  presentationMode: boolean
  viewer: {
    id: string
    email: string | null
    fullName: string | null
    avatarUrl: string | null
  }
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  raisedCents: number
  programsCount: number
  peopleCount: number
  initialProfile: TInitialProfile
  formationSummary: TFormationSummary
  acceleratorTimeline: TAcceleratorTimeline
  calendar: TCalendarView
}

function normalizeMembershipRole(role: string | null | undefined): OrganizationMemberRole {
  if (role === "owner") return "owner"
  if (role === "admin") return "admin"
  if (role === "staff") return "staff"
  if (role === "board") return "board"
  return "member"
}

function isMissingWorkspaceTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01" || record.code === "PGRST205") return true
  const message =
    typeof record.message === "string" ? record.message : typeof record.details === "string" ? record.details : ""
  if (message.includes(tableName)) return true
  const hint = typeof record.hint === "string" ? record.hint : ""
  return hint.includes(tableName)
}

function isMissingWorkspaceCommunicationsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_communications")
}

function isMissingWorkspaceCommunicationChannelsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_communication_channels")
}

function isMissingWorkspaceObjectiveGroupsTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objective_groups")
}

function isMissingWorkspaceObjectivesTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objectives")
}

function isMissingWorkspaceObjectiveAssigneesTableError(error: unknown) {
  return isMissingWorkspaceTableError(error, "organization_workspace_objective_assignees")
}

function mapObjectiveRowsToTrackerState({
  groups,
  objectives,
  assignees,
  tab,
}: {
  groups: Array<{
    id: string
    title: string
    archived_at: string | null
    created_at: string
  }>
  objectives: Array<{
    id: string
    group_id: string | null
    title: string
    description: string | null
    priority: "low" | "normal" | "high" | "critical" | string
    due_at: string | null
    status: string
    created_at: string
    updated_at: string
  }>
  assignees: Array<{
    objective_id: string
    user_id: string
  }>
  tab: WorkspaceTrackerState["tab"]
}): WorkspaceTrackerState | null {
  if (groups.length === 0 && objectives.length === 0) return null

  const categories =
    groups.length > 0
      ? groups.map((group) => ({
          id: group.id,
          title: group.title,
          archived: Boolean(group.archived_at),
          createdAt: group.created_at,
        }))
      : [
          {
            id: "general",
            title: "General",
            archived: false,
            createdAt: new Date().toISOString(),
          },
        ]

  const categoryArchivedById = new Map(categories.map((category) => [category.id, category.archived]))
  const defaultCategoryId = categories[0]?.id ?? "general"
  const assigneeMap = new Map<string, string[]>()
  for (const assignee of assignees) {
    const current = assigneeMap.get(assignee.objective_id)
    if (current) current.push(assignee.user_id)
    else assigneeMap.set(assignee.objective_id, [assignee.user_id])
  }

  const tickets = objectives.map((objective) => {
    const categoryId = objective.group_id && categoryArchivedById.has(objective.group_id)
      ? objective.group_id
      : defaultCategoryId
    const categoryArchived = categoryArchivedById.get(categoryId) ?? false
    const status: WorkspaceTrackerTicketStatus =
      objective.status === "done"
        ? "done"
        : objective.status === "in_progress" || objective.status === "blocked"
          ? "in_progress"
          : "todo"
    const priority: WorkspaceTrackerTicketPriority =
      objective.priority === "low" ||
      objective.priority === "high" ||
      objective.priority === "critical"
        ? objective.priority
        : "normal"

    return {
      id: objective.id,
      categoryId,
      title: objective.title,
      description: objective.description,
      status,
      priority,
      dueAt: objective.due_at,
      assigneeUserIds: assigneeMap.get(objective.id) ?? [],
      archived: objective.status === "archived" || categoryArchived,
      createdAt: objective.created_at,
      updatedAt: objective.updated_at,
    }
  })

  return {
    tab,
    archivedAcceleratorGroups: [],
    categories,
    tickets,
  }
}

export async function buildWorkspaceViewSeed<
  TInitialProfile,
  TFormationSummary,
  TCalendarView,
  TAcceleratorTimeline,
>({
  supabase,
  orgId,
  role,
  canEdit,
  acceleratorOverlayEnabled,
  presentationMode,
  viewer,
  organizationTitle,
  organizationSubtitle,
  fundingGoalCents,
  raisedCents,
  programsCount,
  peopleCount,
  initialProfile,
  formationSummary,
  acceleratorTimeline,
  calendar,
}: BuildWorkspaceViewSeedInput<TInitialProfile, TFormationSummary, TCalendarView, TAcceleratorTimeline>) {
  const [
    boardResult,
    workspaceInvitesResult,
    workspaceCommunicationsResult,
    workspaceCommunicationsChannelsResult,
    membershipsResult,
    workspaceObjectiveGroupsResult,
    workspaceObjectivesResult,
    workspaceObjectiveAssigneesResult,
  ] = await Promise.all([
    supabase
      .from("organization_workspace_boards")
      .select("state")
      .eq("org_id", orgId)
      .maybeSingle<{ state: unknown }>(),
    supabase
      .from("organization_workspace_invites")
      .select(
        "id, user_id, user_name, user_email, created_by, created_at, expires_at, revoked_at, duration_value, duration_unit",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .returns<WorkspaceCollaborationInviteRow[]>(),
    supabase
      .from("organization_workspace_communications")
      .select("id, channel, media_mode, content, status, scheduled_for, posted_at, created_by, created_at")
      .eq("org_id", orgId)
      .order("scheduled_for", { ascending: false })
      .limit(240)
      .returns<WorkspaceCommunicationPostRow[]>(),
    supabase
      .from("organization_workspace_communication_channels")
      .select("org_id, channel, is_connected, provider, connected_by, connected_at")
      .eq("org_id", orgId)
      .returns<WorkspaceCommunicationChannelConnectionRow[]>(),
    supabase
      .from("organization_memberships")
      .select("member_id, role, member_email")
      .eq("org_id", orgId)
      .returns<Array<{ member_id: string; role: string | null; member_email: string | null }>>(),
    supabase
      .from("organization_workspace_objective_groups")
      .select("id, title, archived_at, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .returns<Array<{ id: string; title: string; archived_at: string | null; created_at: string }>>(),
    supabase
      .from("organization_workspace_objectives")
      .select("id, group_id, title, description, priority, due_at, status, created_at, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .returns<
        Array<{
          id: string
          group_id: string | null
          title: string
          description: string | null
          priority: string
          due_at: string | null
          status: string
          created_at: string
          updated_at: string
        }>
      >(),
    supabase
      .from("organization_workspace_objective_assignees")
      .select("objective_id, user_id")
      .eq("org_id", orgId)
      .returns<Array<{ objective_id: string; user_id: string }>>(),
  ])

  if (boardResult.error) {
    throw supabaseErrorToError(boardResult.error, "Unable to load workspace board state.")
  }
  if (workspaceInvitesResult.error) {
    throw supabaseErrorToError(workspaceInvitesResult.error, "Unable to load workspace collaboration invites.")
  }
  if (
    workspaceCommunicationsResult.error &&
    !isMissingWorkspaceCommunicationsTableError(workspaceCommunicationsResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceCommunicationsResult.error,
      "Unable to load workspace communications.",
    )
  }
  if (
    workspaceCommunicationsChannelsResult.error &&
    !isMissingWorkspaceCommunicationChannelsTableError(workspaceCommunicationsChannelsResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceCommunicationsChannelsResult.error,
      "Unable to load workspace communication channels.",
    )
  }
  if (
    workspaceObjectiveGroupsResult.error &&
    !isMissingWorkspaceObjectiveGroupsTableError(workspaceObjectiveGroupsResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceObjectiveGroupsResult.error,
      "Unable to load workspace objective groups.",
    )
  }
  if (
    workspaceObjectivesResult.error &&
    !isMissingWorkspaceObjectivesTableError(workspaceObjectivesResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceObjectivesResult.error,
      "Unable to load workspace objectives.",
    )
  }
  if (
    workspaceObjectiveAssigneesResult.error &&
    !isMissingWorkspaceObjectiveAssigneesTableError(workspaceObjectiveAssigneesResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceObjectiveAssigneesResult.error,
      "Unable to load workspace objective assignees.",
    )
  }

  const persistedBoardState = readWorkspaceBoardStateValue(boardResult.data?.state)
  const collaborationInvites = readWorkspaceCollaborationInvitesFromRows(workspaceInvitesResult.data)
  const communicationPosts = readWorkspaceCommunicationPostsFromRows(workspaceCommunicationsResult.data)
  const communicationChannelRows = workspaceCommunicationsChannelsResult.data ?? []
  const communicationChannelConnections = readWorkspaceCommunicationChannelConnectionsFromRows(
    communicationChannelRows,
  )
  const connectionChannelsReturned = new Set(
    communicationChannelRows
      .map((row) => row.channel)
      .filter((value): value is "social" | "email" | "blog" => value === "social" || value === "email" || value === "blog"),
  )
  const communicationActivityByDay = buildWorkspaceCommunicationActivityByDayFromPosts(communicationPosts)
  const persistedConnections = persistedBoardState.communications.channelConnections
  const mergedConnections = {
    social: connectionChannelsReturned.has("social")
      ? communicationChannelConnections.social
      : persistedConnections?.social ?? communicationChannelConnections.social,
    email: connectionChannelsReturned.has("email")
      ? communicationChannelConnections.email
      : persistedConnections?.email ?? communicationChannelConnections.email,
    blog: connectionChannelsReturned.has("blog")
      ? communicationChannelConnections.blog
      : persistedConnections?.blog ?? communicationChannelConnections.blog,
  }
  const boardState = {
    ...persistedBoardState,
    communications: {
      ...persistedBoardState.communications,
      connectedChannels: {
        social: mergedConnections.social.connected,
        email: mergedConnections.email.connected,
        blog: mergedConnections.blog.connected,
      },
      channelConnections: mergedConnections,
      activityByDay: {
        ...persistedBoardState.communications.activityByDay,
        ...communicationActivityByDay,
      },
    },
  }
  const mappedTrackerState = mapObjectiveRowsToTrackerState({
    groups: workspaceObjectiveGroupsResult.data ?? [],
    objectives: workspaceObjectivesResult.data ?? [],
    assignees: workspaceObjectiveAssigneesResult.data ?? [],
    tab: persistedBoardState.tracker.tab,
  })
  if (mappedTrackerState) {
    boardState.tracker = mappedTrackerState
  }

  const membershipRows = membershipsResult.data ?? []
  const memberIds = Array.from(
    new Set([orgId, ...membershipRows.map((membership) => membership.member_id)]),
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
    avatarById.set(member.id, member.avatar_url && member.avatar_url.trim().length > 0 ? member.avatar_url : null)
  }

  const emailById = new Map<string, string | null>()
  for (const membership of membershipRows) {
    if (membership.member_email) {
      emailById.set(membership.member_id, membership.member_email)
    }
  }

  const roleById = new Map<string, OrganizationMemberRole>([[orgId, "owner"]])
  for (const membership of membershipRows) {
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
    (viewer.fullName && viewer.fullName.trim().length > 0 ? viewer.fullName.trim() : viewer.email ?? "Teammate")

  const viewerAvatarUrl = viewer.avatarUrl && viewer.avatarUrl.trim().length > 0 ? viewer.avatarUrl.trim() : null

  const enrichedInvites = collaborationInvites.slice(0, 24).map((invite) => ({
    ...invite,
    userName: invite.userName ?? nameById.get(invite.userId) ?? null,
    userEmail: invite.userEmail ?? emailById.get(invite.userId) ?? null,
  }))

  return {
    orgId,
    viewerId: viewer.id,
    viewerName,
    viewerAvatarUrl,
    acceleratorOverlayEnabled,
    presentationMode,
    role,
    canEdit,
    canInviteCollaborators: canInviteWorkspaceCollaborators(role),
    organizationTitle,
    organizationSubtitle,
    fundingGoalCents,
    raisedCents,
    programsCount,
    peopleCount,
    initialProfile,
    formationSummary,
    acceleratorTimeline,
    calendar,
    collaborationInvites: enrichedInvites,
    members,
    boardState,
  }
}
