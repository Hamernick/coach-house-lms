import type { createSupabaseServerClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { OrganizationMemberRole } from "@/lib/organization/active-org"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"

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
import {
  buildWorkspaceActivityFeed,
  buildWorkspaceActivityHeatmapWindow,
  type WorkspaceActivityAcceleratorProgressRow,
  type WorkspaceActivityCalendarEventRow,
} from "./workspace-activity"
import {
  isMissingModuleProgressTableError,
  isMissingRoadmapCalendarInternalEventsTableError,
  isUuidLike,
  isMissingWorkspaceBoardsTableError,
  isMissingWorkspaceCommunicationChannelsTableError,
  isMissingWorkspaceCommunicationsTableError,
  isMissingWorkspaceInvitesTableError,
  isMissingWorkspaceObjectiveAssigneesTableError,
  isMissingWorkspaceObjectiveGroupsTableError,
  isMissingWorkspaceObjectivesTableError,
  mapObjectiveRowsToTrackerState,
  normalizeMembershipRole,
} from "./workspace-view-helpers"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type BuildWorkspaceViewSeedInput<
  TInitialProfile,
  TFormationSummary,
  TCalendarView,
> = {
  supabase: SupabaseServerClient
  orgId: string
  role: OrganizationMemberRole
  canEdit: boolean
  hasAcceleratorAccess: boolean
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
  teammateCount: number
  organizationProfileComplete: boolean
  workspaceDocumentCount: number
  initialProfile: TInitialProfile
  formationSummary: TFormationSummary
  acceleratorTimeline: WorkspaceAcceleratorCardStep[]
  calendar: TCalendarView
  initialOnboarding?: {
    required: boolean
    defaults: OnboardingFlowDefaults
  }
}

function applyViewerWorkspaceMemberFallbacks({
  viewer,
  nameById,
  emailById,
  avatarById,
}: {
  viewer: BuildWorkspaceViewSeedInput<unknown, unknown, unknown>["viewer"]
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

export async function buildWorkspaceViewSeed<
  TInitialProfile,
  TFormationSummary,
  TCalendarView,
>({
  supabase,
  orgId,
  role,
  canEdit,
  hasAcceleratorAccess,
  presentationMode,
  viewer,
  organizationTitle,
  organizationSubtitle,
  fundingGoalCents,
  raisedCents,
  programsCount,
  peopleCount,
  teammateCount,
  organizationProfileComplete,
  workspaceDocumentCount,
  initialProfile,
  formationSummary,
  acceleratorTimeline,
  calendar,
  initialOnboarding,
}: BuildWorkspaceViewSeedInput<TInitialProfile, TFormationSummary, TCalendarView>) {
  const activityWindow = buildWorkspaceActivityHeatmapWindow()
  const acceleratorModuleIds = Array.from(
    new Set(
      acceleratorTimeline
        .map((step) => step.moduleId)
        .filter((moduleId) => isUuidLike(moduleId)),
    ),
  )
  const [
    boardResult,
    workspaceInvitesResult,
    workspaceCommunicationsResult,
    workspaceCommunicationsChannelsResult,
    membershipsResult,
    workspaceCalendarEventsResult,
    workspaceAcceleratorProgressResult,
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
      .from("roadmap_calendar_internal_events")
      .select("id, title, description, event_type, starts_at, status")
      .eq("org_id", orgId)
      .neq("status", "canceled")
      .gte("starts_at", activityWindow.fromIso)
      .lte("starts_at", activityWindow.toIso)
      .order("starts_at", { ascending: true })
      .returns<WorkspaceActivityCalendarEventRow[]>(),
    acceleratorModuleIds.length > 0
      ? supabase
          .from("module_progress")
          .select("module_id, status, completed_at, updated_at")
          .eq("user_id", viewer.id)
          .in("module_id", acceleratorModuleIds)
          .returns<WorkspaceActivityAcceleratorProgressRow[]>()
      : Promise.resolve({ data: [], error: null } as { data: WorkspaceActivityAcceleratorProgressRow[]; error: null }),
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

  if (
    boardResult.error &&
    !isMissingWorkspaceBoardsTableError(boardResult.error)
  ) {
    throw supabaseErrorToError(boardResult.error, "Unable to load workspace board state.")
  }
  if (
    workspaceInvitesResult.error &&
    !isMissingWorkspaceInvitesTableError(workspaceInvitesResult.error)
  ) {
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
    workspaceCalendarEventsResult.error &&
    !isMissingRoadmapCalendarInternalEventsTableError(
      workspaceCalendarEventsResult.error,
    )
  ) {
    throw supabaseErrorToError(
      workspaceCalendarEventsResult.error,
      "Unable to load workspace calendar activity.",
    )
  }
  if (
    workspaceAcceleratorProgressResult.error &&
    !isMissingModuleProgressTableError(workspaceAcceleratorProgressResult.error)
  ) {
    throw supabaseErrorToError(
      workspaceAcceleratorProgressResult.error,
      "Unable to load workspace accelerator activity.",
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
  const calendarActivityRows = workspaceCalendarEventsResult.data ?? []
  const acceleratorActivityRows = workspaceAcceleratorProgressResult.data ?? []
  const communicationChannelConnections = readWorkspaceCommunicationChannelConnectionsFromRows(
    communicationChannelRows,
  )
  const connectionChannelsReturned = new Set(
    communicationChannelRows
      .map((row) => row.channel)
      .filter((value): value is "social" | "email" | "blog" => value === "social" || value === "email" || value === "blog"),
  )
  const communicationActivityByDay = buildWorkspaceCommunicationActivityByDayFromPosts(communicationPosts)
  const activityFeed = buildWorkspaceActivityFeed({
    communicationPosts,
    calendarEvents: calendarActivityRows,
    acceleratorProgress: acceleratorActivityRows,
    acceleratorTimeline,
  })
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
  applyViewerWorkspaceMemberFallbacks({ viewer, nameById, emailById, avatarById })

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
    presentationMode,
    role,
    canEdit,
    canInviteCollaborators: canInviteWorkspaceCollaborators(role),
    hasAcceleratorAccess,
    organizationTitle,
    organizationSubtitle,
    fundingGoalCents,
    raisedCents,
    programsCount,
    peopleCount,
    journeyReadiness: {
      organizationProfileComplete,
      teammateCount,
      workspaceDocumentCount,
      acceleratorStarted: Array.isArray(acceleratorTimeline)
        ? acceleratorTimeline.some((step) => step.status !== "not_started")
        : false,
      acceleratorCompletedStepCount: Array.isArray(acceleratorTimeline)
        ? acceleratorTimeline.filter((step) => step.status === "completed")
            .length
        : 0,
    },
    initialProfile,
    formationSummary,
    acceleratorTimeline,
    activityFeed,
    calendar,
    collaborationInvites: enrichedInvites,
    members,
    boardState,
    initialOnboarding: initialOnboarding ?? {
      required: false,
      defaults: {},
    },
  }
}
