"use server"

import { randomUUID } from "node:crypto"

import {
  canEditOrganization,
  type OrganizationMemberRole,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import { normalizeWorkspaceBoardState } from "../_components/workspace-board/workspace-board-layout"
import type {
  WorkspaceBoardState,
  WorkspaceCollaborationInvite,
  WorkspaceDurationUnit,
} from "../_components/workspace-board/workspace-board-types"
import {
  buildWorkspaceInviteExpiry,
  canInviteWorkspaceCollaborators,
  filterActiveWorkspaceInvites,
  readWorkspaceCollaborationInvitesFromRows,
  type WorkspaceCollaborationInviteRow,
} from "./workspace-state"

type WorkspaceBoardActionResult =
  | { ok: true; boardState: WorkspaceBoardState }
  | { error: string }

type WorkspaceCollaborationActionResult =
  | {
      ok: true
      invite: WorkspaceCollaborationInvite
      invites: WorkspaceCollaborationInvite[]
    }
  | { error: string }

type WorkspaceRevokeActionResult =
  | {
      ok: true
      invites: WorkspaceCollaborationInvite[]
    }
  | { error: string }

type WorkspaceTutorialActionResult = { ok: true } | { error: string }

type ActorContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  user: { id: string }
  activeOrg: {
    orgId: string
    role: OrganizationMemberRole
  }
}

type ActorContextResult = ActorContext | { error: string }

async function resolveActor(): Promise<ActorContextResult> {
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

async function loadWorkspaceInvites(
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

  if (error) {
    return { error: "Unable to load collaboration invites." as const }
  }

  return {
    invites: readWorkspaceCollaborationInvitesFromRows(data),
  }
}

export async function saveWorkspaceBoardStateAction(
  input: WorkspaceBoardState,
): Promise<WorkspaceBoardActionResult> {
  const actor = await resolveActor()
  if ("error" in actor) return { error: actor.error }

  const { supabase, activeOrg, user } = actor
  if (!canEditOrganization(activeOrg.role)) {
    return { error: "Only owner, admin, or staff can edit workspace layout." }
  }

  const boardState = normalizeWorkspaceBoardState(input)
  const persistedBoardState: WorkspaceBoardState = {
    ...boardState,
    updatedAt: new Date().toISOString(),
  }

  let persistenceClient = supabase
  try {
    persistenceClient = createSupabaseAdminClient()
  } catch {
    // Local/dev environments may omit service-role credentials.
  }

  if (activeOrg.orgId === user.id) {
    const { error: organizationUpsertError } = await persistenceClient
      .from("organizations")
      .upsert(
        {
          user_id: activeOrg.orgId,
        },
        { onConflict: "user_id" },
      )

    if (organizationUpsertError) {
      return { error: "Unable to save workspace layout." }
    }
  }

  const boardUpsertPayload = {
    org_id: activeOrg.orgId,
    state: persistedBoardState as Json,
    updated_by: user.id,
  }

  let { error } = await persistenceClient
    .from("organization_workspace_boards")
    .upsert(boardUpsertPayload, { onConflict: "org_id" })

  if (error?.code === "23503") {
    const retryResult = await persistenceClient.from("organization_workspace_boards").upsert(
      {
        ...boardUpsertPayload,
        updated_by: null,
      },
      { onConflict: "org_id" },
    )
    error = retryResult.error
  }

  if (error) {
    return { error: "Unable to save workspace layout." }
  }

  return { ok: true, boardState: persistedBoardState }
}

export async function completeWorkspaceCanvasTutorialAction(): Promise<WorkspaceTutorialActionResult> {
  const actor = await resolveActor()
  if ("error" in actor) return { error: actor.error }

  const { supabase } = actor
  const { error } = await supabase.auth.updateUser({
    data: {
      workspace_onboarding_active: false,
      workspace_onboarding_completed_at: new Date().toISOString(),
    },
  })

  if (error) {
    return { error: "Unable to complete the workspace tutorial." }
  }

  return { ok: true }
}

export async function createWorkspaceCollaborationInviteAction({
  userId,
  durationValue,
  durationUnit,
}: {
  userId: string
  durationValue: number
  durationUnit: WorkspaceDurationUnit
}): Promise<WorkspaceCollaborationActionResult> {
  const actor = await resolveActor()
  if ("error" in actor) return { error: actor.error }

  const { supabase, user, activeOrg } = actor
  if (!canInviteWorkspaceCollaborators(activeOrg.role)) {
    return { error: "You do not have permission to invite workspace collaborators." }
  }

  const normalizedUserId = userId.trim()
  if (!normalizedUserId) {
    return { error: "Choose a teammate to invite." }
  }

  const isOwnerInvite = normalizedUserId === activeOrg.orgId
  if (!isOwnerInvite) {
    const { data: memberRow } = await supabase
      .from("organization_memberships")
      .select("member_id")
      .eq("org_id", activeOrg.orgId)
      .eq("member_id", normalizedUserId)
      .maybeSingle<{ member_id: string }>()

    if (!memberRow?.member_id) {
      return { error: "Invite target must already be part of this organization." }
    }
  }

  const invitesResult = await loadWorkspaceInvites(supabase, activeOrg.orgId)
  if ("error" in invitesResult) {
    return { error: invitesResult.error ?? "Unable to load collaboration invites." }
  }

  const activeInvites = filterActiveWorkspaceInvites(invitesResult.invites)
  const existingInvite = activeInvites.find((invite) => invite.userId === normalizedUserId)
  if (existingInvite) {
    return { ok: true, invite: existingInvite, invites: invitesResult.invites }
  }

  const { data: invitedProfile, error: invitedProfileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", normalizedUserId)
    .maybeSingle<{ id: string; full_name: string | null }>()

  if (invitedProfileError) {
    return { error: "Unable to load invite target." }
  }
  if (!invitedProfile?.id) {
    return { error: "Invite target not found." }
  }

  const invite: WorkspaceCollaborationInvite = {
    id: randomUUID(),
    userId: normalizedUserId,
    userName: invitedProfile.full_name?.trim() || null,
    userEmail: null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: buildWorkspaceInviteExpiry({
      unit: durationUnit,
      value: durationValue,
    }),
    revokedAt: null,
    durationValue: Math.max(1, Math.min(12, Math.round(durationValue))),
    durationUnit,
  }

  const { error: saveError } = await supabase.from("organization_workspace_invites").insert({
    id: invite.id,
    org_id: activeOrg.orgId,
    user_id: invite.userId,
    user_name: invite.userName,
    user_email: invite.userEmail,
    created_by: invite.createdBy,
    created_at: invite.createdAt,
    expires_at: invite.expiresAt,
    revoked_at: invite.revokedAt,
    duration_value: invite.durationValue,
    duration_unit: invite.durationUnit,
  })

  if (saveError) {
    return { error: "Unable to create collaboration invite." }
  }

  const refreshedInvitesResult = await loadWorkspaceInvites(supabase, activeOrg.orgId)
  if ("error" in refreshedInvitesResult) {
    return { error: refreshedInvitesResult.error ?? "Unable to load collaboration invites." }
  }

  return { ok: true, invite, invites: refreshedInvitesResult.invites }
}

export async function revokeWorkspaceCollaborationInviteAction(
  inviteId: string,
): Promise<WorkspaceRevokeActionResult> {
  const actor = await resolveActor()
  if ("error" in actor) return { error: actor.error }

  const { supabase, activeOrg } = actor
  if (!canInviteWorkspaceCollaborators(activeOrg.role)) {
    return { error: "You do not have permission to manage collaboration invites." }
  }

  const normalizedInviteId = inviteId.trim()
  if (!normalizedInviteId) {
    return { error: "Invite ID is required." }
  }

  const { error: revokeError } = await supabase
    .from("organization_workspace_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("org_id", activeOrg.orgId)
    .eq("id", normalizedInviteId)

  if (revokeError) {
    return { error: "Unable to revoke invite." }
  }

  const invitesResult = await loadWorkspaceInvites(supabase, activeOrg.orgId)
  if ("error" in invitesResult) {
    return { error: invitesResult.error ?? "Unable to load collaboration invites." }
  }

  return { ok: true, invites: invitesResult.invites }
}
