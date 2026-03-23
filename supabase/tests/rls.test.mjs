#!/usr/bin/env node
import { randomUUID } from "node:crypto"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const raw = readFileSync(filePath, "utf8")
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const idx = line.indexOf("=")
      if (idx === -1) return
      const key = line.slice(0, idx).trim()
      if (!key || process.env[key] !== undefined) return
      let value = line.slice(idx + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    })
}

loadEnvFile(resolve(process.cwd(), ".env.local"))

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceRole) {
  console.log(
    "[supabase] Skipping RLS tests – set SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY."
  )
  process.exit(0)
}

const adminClient = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const suffix = randomUUID().slice(0, 8)
const memberEmail = `member-${suffix}@example.com`
const adminEmail = `admin-${suffix}@example.com`
const staffEmail = `staff-${suffix}@example.com`
const boardEmail = `board-${suffix}@example.com`
const orgAdminEmail = `org-admin-${suffix}@example.com`
const password = `TempPass!${suffix}`

async function ensureProfile(id, role, fullName) {
  const { error } = await adminClient.from("profiles").upsert(
    {
      id,
      role,
      full_name: fullName,
    },
    { onConflict: "id" }
  )
  if (error) throw error
}

async function createUsers() {
  const {
    data: { user: member },
    error: memberError,
  } = await adminClient.auth.admin.createUser({
    email: memberEmail,
    password,
    email_confirm: true,
  })
  if (memberError) throw memberError

  const {
    data: { user: admin },
    error: adminError,
  } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
  })
  if (adminError) throw adminError

  const {
    data: { user: staff },
    error: staffError,
  } = await adminClient.auth.admin.createUser({
    email: staffEmail,
    password,
    email_confirm: true,
  })
  if (staffError) throw staffError

  const {
    data: { user: board },
    error: boardError,
  } = await adminClient.auth.admin.createUser({
    email: boardEmail,
    password,
    email_confirm: true,
  })
  if (boardError) throw boardError

  const {
    data: { user: orgAdmin },
    error: orgAdminError,
  } = await adminClient.auth.admin.createUser({
    email: orgAdminEmail,
    password,
    email_confirm: true,
  })
  if (orgAdminError) throw orgAdminError

  await ensureProfile(member.id, "member", "Test Member")
  await ensureProfile(admin.id, "admin", "Test Admin")
  await ensureProfile(staff.id, "member", "Test Staff")
  await ensureProfile(board.id, "member", "Test Board")
  await ensureProfile(orgAdmin.id, "member", "Test Org Admin")

  return { member, admin, staff, board, orgAdmin }
}

async function createDemoContent(memberId) {
  const publishedClassId = randomUUID()
  const unpublishedClassId = randomUUID()
  const moduleId = randomUUID()
  const hiddenModuleId = randomUUID()

  const { error: classErr } = await adminClient.from("classes").insert([
    {
      id: publishedClassId,
      title: "Published Class",
      slug: `published-${suffix}`,
      description: "Visible to members",
      is_published: true,
    },
    {
      id: unpublishedClassId,
      title: "Draft Class",
      slug: `draft-${suffix}`,
      description: "Hidden from members",
      is_published: false,
    },
  ])
  if (classErr) throw classErr

  const { error: moduleErr } = await adminClient.from("modules").insert([
    {
      id: moduleId,
      class_id: publishedClassId,
      idx: 1,
      slug: `module-${suffix}`,
      title: "Kick-off",
      content_md: "# Kick-off",
    },
    {
      id: hiddenModuleId,
      class_id: unpublishedClassId,
      idx: 1,
      slug: `draft-module-${suffix}`,
      title: "Draft",
      content_md: "Hidden",
    },
  ])
  if (moduleErr) throw moduleErr

  const { error: enrollmentErr } = await adminClient
    .from("enrollments")
    .insert({
      user_id: memberId,
      class_id: publishedClassId,
    })
  if (enrollmentErr) throw enrollmentErr

  return { publishedClassId, unpublishedClassId, moduleId, hiddenModuleId }
}

async function run() {
  const { member, admin, staff, board, orgAdmin } = await createUsers()
  const assets = await createDemoContent(member.id)

  const memberClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const adminSessionClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const staffClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const boardClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const orgAdminClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await memberClient.auth.signInWithPassword({ email: memberEmail, password })
  await adminSessionClient.auth.signInWithPassword({
    email: adminEmail,
    password,
  })
  await staffClient.auth.signInWithPassword({ email: staffEmail, password })
  await boardClient.auth.signInWithPassword({ email: boardEmail, password })
  await orgAdminClient.auth.signInWithPassword({ email: orgAdminEmail, password })

  const results = []

  // Profile visibility
  {
    const { data, error } = await memberClient
      .from("profiles")
      .select("id")
      .eq("id", member.id)
      .maybeSingle()
    results.push({ name: "member reads own profile", passed: !!data && !error })

    const { data: otherProfile } = await memberClient
      .from("profiles")
      .select("id")
      .eq("id", admin.id)
      .maybeSingle()
    results.push({
      name: "member cannot read other profile",
      passed: !otherProfile,
    })

    const avatarUrl = `https://example.com/avatar-${suffix}.png`
    const { data: updatedProfile, error: updateError } = await memberClient
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", member.id)
      .select("avatar_url")
      .maybeSingle()
    results.push({
      name: "member can update own profile avatar",
      passed:
        !updateError &&
        !!updatedProfile &&
        updatedProfile.avatar_url === avatarUrl,
    })

    const avatarBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    const ownAvatarObject = `${member.id}/rls-avatar-${suffix}.png`
    const otherAvatarObject = `${admin.id}/rls-avatar-${suffix}.png`
    const { error: ownAvatarUploadError } = await memberClient.storage
      .from("avatars")
      .upload(ownAvatarObject, avatarBytes, {
        contentType: "image/png",
        upsert: true,
      })
    results.push({
      name: "member can upload avatar to own folder",
      passed: !ownAvatarUploadError,
    })

    const { error: otherAvatarUploadError } = await memberClient.storage
      .from("avatars")
      .upload(otherAvatarObject, avatarBytes, {
        contentType: "image/png",
        upsert: true,
      })
    const avatarFolderDenied =
      !!otherAvatarUploadError &&
      (otherAvatarUploadError.statusCode === "403" ||
        otherAvatarUploadError.statusCode === "401" ||
        /row-level security|permission denied|not allowed/i.test(otherAvatarUploadError.message ?? ""))
    results.push({
      name: "member cannot upload avatar to another user's folder",
      passed: avatarFolderDenied,
    })
  }

  // Class visibility
  {
    const { data, error } = await memberClient
      .from("classes")
      .select("id, is_published")
      .order("is_published", { ascending: false })
    const publishedVisible =
      Array.isArray(data) &&
      data.some((row) => row.id === assets.publishedClassId)
    const draftHidden =
      Array.isArray(data) &&
      !data.some((row) => row.id === assets.unpublishedClassId)
    results.push({
      name: "member sees published class",
      passed: publishedVisible && !error,
    })
    results.push({
      name: "member does not see draft class",
      passed: draftHidden,
    })
  }

  // Class insertion RLS
  {
    const { error } = await memberClient.from("classes").insert({
      title: "Forbidden",
      slug: `forbidden-${suffix}`,
      is_published: true,
    })
    results.push({ name: "member cannot insert classes", passed: !!error })
  }

  // Admin update allowed
  {
    const { error } = await adminSessionClient
      .from("classes")
      .update({ title: "Published Class Updated" })
      .eq("id", assets.publishedClassId)
    results.push({ name: "admin can update classes", passed: !error })
  }

  // Module access + progress updates
  {
    const { data, error } = await memberClient
      .from("modules")
      .select("id, class_id")
    const moduleVisible =
      Array.isArray(data) && data.some((row) => row.id === assets.moduleId)
    const draftHidden =
      Array.isArray(data) &&
      !data.some((row) => row.id === assets.hiddenModuleId)
    results.push({
      name: "member sees module for published class",
      passed: moduleVisible && !error,
    })
    results.push({
      name: "member does not see draft module",
      passed: draftHidden,
    })

    const { error: progressErr } = await memberClient
      .from("module_progress")
      .upsert({
        user_id: member.id,
        module_id: assets.moduleId,
        status: "in_progress",
      })
    results.push({
      name: "member can upsert own module progress",
      passed: !progressErr,
    })
  }

  // Assignment submissions + organizations rollup + module assignments visibility
  {
    // Admin defines an assignment schema for the module
    const { error: assignErr } = await adminClient
      .from("module_assignments")
      .upsert({
        module_id: assets.moduleId,
        schema: { fields: [{ name: "org_name", type: "text" }] },
        complete_on_submit: true,
      })
    if (assignErr) throw assignErr

    // Member submits answers
    const { error: submitErr } = await memberClient
      .from("assignment_submissions")
      .upsert({
        module_id: assets.moduleId,
        user_id: member.id,
        answers: { org_name: "Test Org" },
        status: "submitted",
      })
    results.push({
      name: "member can upsert own submission",
      passed: !submitErr,
    })

    // Member can read their submission but not others
    const { data: ownSub } = await memberClient
      .from("assignment_submissions")
      .select("id")
      .eq("user_id", member.id)
      .maybeSingle()
    results.push({ name: "member can read own submission", passed: !!ownSub })

    const { data: otherSub } = await memberClient
      .from("assignment_submissions")
      .select("id")
      .eq("user_id", admin.id)
      .maybeSingle()
    results.push({
      name: "member cannot read others' submissions",
      passed: !otherSub,
    })

    // Organizations rollup visible to member
    const { data: orgRow } = await memberClient
      .from("organizations")
      .select("user_id")
      .eq("user_id", member.id)
      .maybeSingle()
    results.push({
      name: "member can read own organization rollup",
      passed: !!orgRow,
    })

    // Member can read module assignments for enrolled class
    const { data: assignRead, error: assignReadErr } = await memberClient
      .from("module_assignments")
      .select("module_id")
      .eq("module_id", assets.moduleId)
      .maybeSingle()
    results.push({
      name: "member can read module assignment (enrolled)",
      passed: !!assignRead && !assignReadErr,
    })
  }

  let orgAccessReady = false
  let workspaceTablesAvailable = false
  let workspaceCommunicationsTableAvailable = false
  let workspaceCommunicationChannelsTableAvailable = false
  let workspaceCommunicationDeliveriesTableAvailable = false

  // Organization membership access (multi-account org access)
  {
    const { error: membershipError } = await adminClient
      .from("organization_memberships")
      .insert([
        {
          org_id: member.id,
          member_id: staff.id,
          role: "staff",
          member_email: staffEmail,
        },
        {
          org_id: member.id,
          member_id: board.id,
          role: "board",
          member_email: boardEmail,
        },
        {
          org_id: member.id,
          member_id: orgAdmin.id,
          role: "admin",
          member_email: orgAdminEmail,
        },
      ])
    orgAccessReady = !membershipError
    results.push({
      name: "org access memberships created",
      passed: orgAccessReady,
    })

    if (orgAccessReady) {
      const { data: staffOrg, error: staffOrgError } = await staffClient
        .from("organizations")
        .select("user_id")
        .eq("user_id", member.id)
        .maybeSingle()
      results.push({
        name: "staff can read org via membership",
        passed: !!staffOrg && !staffOrgError,
      })

      const { data: boardOrg, error: boardOrgError } = await boardClient
        .from("organizations")
        .select("user_id")
        .eq("user_id", member.id)
        .maybeSingle()
      results.push({
        name: "board can read org via membership",
        passed: !!boardOrg && !boardOrgError,
      })

      await staffClient
        .from("organizations")
        .update({ profile: { name: "Updated by staff" } })
        .eq("user_id", member.id)

      const { data: staffUpdatedOrg } = await adminClient
        .from("organizations")
        .select("profile")
        .eq("user_id", member.id)
        .maybeSingle()
      results.push({
        name: "staff can update org profile",
        passed: staffUpdatedOrg?.profile?.name === "Updated by staff",
      })

      await boardClient
        .from("organizations")
        .update({ profile: { name: "Updated by board" } })
        .eq("user_id", member.id)

      const { data: boardUpdatedOrg } = await adminClient
        .from("organizations")
        .select("profile")
        .eq("user_id", member.id)
        .maybeSingle()
      results.push({
        name: "board cannot update org profile",
        passed: boardUpdatedOrg?.profile?.name === "Updated by staff",
      })
    }
  }

  // Programs write access for members
  if (orgAccessReady) {
    const { data: createdProgram, error: staffProgramError } = await staffClient
      .from("programs")
      .insert({ user_id: member.id, title: `Staff Program ${suffix}` })
      .select("id")
      .maybeSingle()
    results.push({
      name: "staff can insert programs for org",
      passed: !!createdProgram && !staffProgramError,
    })

    const { data: deniedProgram, error: boardProgramError } = await boardClient
      .from("programs")
      .insert({ user_id: member.id, title: `Board Program ${suffix}` })
      .select("id")
    results.push({
      name: "board cannot insert programs for org",
      passed:
        !!boardProgramError ||
        (Array.isArray(deniedProgram) && deniedProgram.length === 0),
    })

    const { data: boardPrograms } = await boardClient
      .from("programs")
      .select("id")
      .eq("user_id", member.id)
    results.push({
      name: "board can read org programs",
      passed: Array.isArray(boardPrograms) && boardPrograms.length >= 1,
    })
  }

  // Org-admin invite gating (admins_can_invite toggle)
  if (orgAccessReady) {
    const expiresAt = new Date(Date.now() + 3600_000).toISOString()

    const { error: deniedInviteError } = await orgAdminClient
      .from("organization_invites")
      .insert({
        org_id: member.id,
        email: `invitee-denied-${suffix}@example.com`,
        role: "board",
        token: `tok_denied_${suffix}`,
        expires_at: expiresAt,
      })
    results.push({
      name: "org admin cannot invite by default",
      passed: !!deniedInviteError,
    })

    const { error: ownerEnableError } = await memberClient
      .from("organization_access_settings")
      .upsert(
        { org_id: member.id, admins_can_invite: true },
        { onConflict: "org_id" }
      )
    results.push({
      name: "owner can enable org-admin invites",
      passed: !ownerEnableError,
    })

    const { data: allowedInvite, error: allowedInviteError } =
      await orgAdminClient
        .from("organization_invites")
        .insert({
          org_id: member.id,
          email: `invitee-allowed-${suffix}@example.com`,
          role: "board",
          token: `tok_allowed_${suffix}`,
          expires_at: expiresAt,
        })
        .select("id")
        .maybeSingle()
    results.push({
      name: "org admin can invite when enabled",
      passed: !!allowedInvite && !allowedInviteError,
    })

    const { error: staffInviteError } = await staffClient
      .from("organization_invites")
      .insert({
        org_id: member.id,
        email: `invitee-staff-${suffix}@example.com`,
        role: "board",
        token: `tok_staff_${suffix}`,
        expires_at: expiresAt,
      })
    results.push({
      name: "staff cannot invite even when enabled",
      passed: !!staffInviteError,
    })

    await orgAdminClient
      .from("organization_access_settings")
      .update({ admins_can_invite: false })
      .eq("org_id", member.id)

    const { data: settingsRow } = await memberClient
      .from("organization_access_settings")
      .select("admins_can_invite")
      .eq("org_id", member.id)
      .maybeSingle()
    results.push({
      name: "org admin cannot change invite setting",
      passed: settingsRow?.admins_can_invite === true,
    })
  }

  if (orgAccessReady) {
    const expiresAt = new Date(Date.now() + 3600_000).toISOString()
    const requestId = randomUUID()

    await memberClient
      .from("organization_access_settings")
      .upsert(
        { org_id: member.id, admins_can_invite: true },
        { onConflict: "org_id" }
      )

    const { data: createdRequest, error: createdRequestError } =
      await orgAdminClient
        .from("organization_access_requests")
        .insert({
          id: requestId,
          org_id: member.id,
          invitee_user_id: board.id,
          invitee_email: boardEmail,
          role: "board",
          invited_by_user_id: orgAdmin.id,
          expires_at: expiresAt,
        })
        .select("id")
        .maybeSingle()
    results.push({
      name: "org admin can insert access requests when invite setting enabled",
      passed: !!createdRequest && !createdRequestError,
    })

    const { error: deniedRequestError } = await staffClient
      .from("organization_access_requests")
      .insert({
        org_id: member.id,
        invitee_user_id: staff.id,
        invitee_email: staffEmail,
        role: "staff",
        invited_by_user_id: staff.id,
        expires_at: expiresAt,
      })
    results.push({
      name: "staff cannot insert access requests",
      passed: !!deniedRequestError,
    })

    const { data: boardOwnRequest, error: boardOwnRequestError } = await boardClient
      .from("organization_access_requests")
      .select("id")
      .eq("id", requestId)
      .maybeSingle()
    results.push({
      name: "invitee can read own access request",
      passed: !!boardOwnRequest && !boardOwnRequestError,
    })

    const { data: staffReadsRequest } = await staffClient
      .from("organization_access_requests")
      .select("id")
      .eq("id", requestId)
    results.push({
      name: "staff cannot read another member access request",
      passed:
        Array.isArray(staffReadsRequest) && staffReadsRequest.length === 0,
    })

    const { data: boardUpdateRequest, error: boardUpdateRequestError } =
      await boardClient
        .from("organization_access_requests")
        .update({ status: "declined" })
        .eq("id", requestId)
        .select("id")
    results.push({
      name: "invitee cannot update access request directly through RLS",
      passed:
        !!boardUpdateRequestError ||
        (Array.isArray(boardUpdateRequest) && boardUpdateRequest.length === 0),
    })

    const { data: adminReadsRequest, error: adminReadsRequestError } =
      await adminSessionClient
        .from("organization_access_requests")
        .select("id")
        .eq("id", requestId)
        .maybeSingle()
    results.push({
      name: "platform admin can read access requests",
      passed: !!adminReadsRequest && !adminReadsRequestError,
    })
  }

  // Workspace board + collaboration invite RLS.
  if (orgAccessReady) {
    const { error: workspaceProbeError } = await memberClient
      .from("organization_workspace_boards")
      .select("org_id")
      .limit(1)

    workspaceTablesAvailable = !workspaceProbeError

    results.push({
      name: "workspace tables available",
      passed: workspaceTablesAvailable,
    })

    if (workspaceTablesAvailable) {
      const { error: workspaceCommunicationsProbeError } = await memberClient
        .from("organization_workspace_communications")
        .select("org_id")
        .limit(1)
      workspaceCommunicationsTableAvailable = !workspaceCommunicationsProbeError

      if (workspaceCommunicationsTableAvailable) {
        const { error: workspaceCommunicationChannelsProbeError } =
          await memberClient
            .from("organization_workspace_communication_channels")
            .select("org_id")
            .limit(1)
        workspaceCommunicationChannelsTableAvailable =
          !workspaceCommunicationChannelsProbeError

        const { error: workspaceDeliveryProbeError } = await memberClient
          .from("organization_workspace_communication_deliveries")
          .select("org_id")
          .limit(1)
        workspaceCommunicationDeliveriesTableAvailable = !workspaceDeliveryProbeError
      }
    }
  }

  if (orgAccessReady && workspaceTablesAvailable) {
    const nowIso = new Date().toISOString()
    const inviteId = `workspace-invite-${suffix}`

    const { data: staffBoard, error: staffBoardError } = await staffClient
      .from("organization_workspace_boards")
      .upsert(
        {
          org_id: member.id,
          state: {
            version: 1,
            preset: "balanced",
            nodes: [],
            updatedAt: nowIso,
          },
          updated_by: staff.id,
        },
        { onConflict: "org_id" }
      )
      .select("org_id")
      .maybeSingle()
    results.push({
      name: "staff can upsert workspace board",
      passed: !!staffBoard && !staffBoardError,
    })

    const { data: boardReadsBoard, error: boardReadsBoardError } =
      await boardClient
        .from("organization_workspace_boards")
        .select("org_id")
        .eq("org_id", member.id)
        .maybeSingle()
    results.push({
      name: "board can read workspace board",
      passed: !!boardReadsBoard && !boardReadsBoardError,
    })

    const { data: boardUpdatesBoard, error: boardUpdatesBoardError } =
      await boardClient
        .from("organization_workspace_boards")
        .update({
          state: {
            version: 1,
            preset: "calendar-focused",
            nodes: [],
            updatedAt: nowIso,
          },
        })
        .eq("org_id", member.id)
        .select("org_id")
    results.push({
      name: "board cannot update workspace board",
      passed:
        !!boardUpdatesBoardError ||
        (Array.isArray(boardUpdatesBoard) && boardUpdatesBoard.length === 0),
    })

    const { data: boardCreatedInvite, error: boardCreatedInviteError } =
      await boardClient
        .from("organization_workspace_invites")
        .insert({
          id: inviteId,
          org_id: member.id,
          user_id: staff.id,
          user_name: "Test Staff",
          user_email: staffEmail,
          created_by: board.id,
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
          duration_value: 1,
          duration_unit: "hours",
        })
        .select("id")
        .maybeSingle()
    results.push({
      name: "board can create workspace invite",
      passed: !!boardCreatedInvite && !boardCreatedInviteError,
    })

    const { data: staffReadsInvite, error: staffReadsInviteError } =
      await staffClient
        .from("organization_workspace_invites")
        .select("id")
        .eq("id", inviteId)
        .eq("org_id", member.id)
        .maybeSingle()
    results.push({
      name: "staff can read workspace invite",
      passed: !!staffReadsInvite && !staffReadsInviteError,
    })

    const { data: orgAdminRevokesInvite, error: orgAdminRevokesInviteError } =
      await orgAdminClient
        .from("organization_workspace_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", inviteId)
        .eq("org_id", member.id)
        .select("id")
    results.push({
      name: "org admin can revoke workspace invite",
      passed:
        !orgAdminRevokesInviteError &&
        Array.isArray(orgAdminRevokesInvite) &&
        orgAdminRevokesInvite.length === 1,
    })

    if (workspaceCommunicationsTableAvailable) {
      const communicationId = randomUUID()

      const { data: staffCommunication, error: staffCommunicationError } =
        await staffClient
          .from("organization_workspace_communications")
          .insert({
            id: communicationId,
            org_id: member.id,
            channel: "social",
            media_mode: "text",
            content: "Board update scheduled from workspace tests.",
            status: "scheduled",
            scheduled_for: new Date(Date.now() + 7200_000).toISOString(),
            created_by: staff.id,
          })
          .select("id")
          .maybeSingle()
      results.push({
        name: "staff can create workspace communication post",
        passed: !!staffCommunication && !staffCommunicationError,
      })

      const { data: boardReadsCommunication, error: boardReadsCommunicationError } =
        await boardClient
          .from("organization_workspace_communications")
          .select("id")
          .eq("id", communicationId)
          .eq("org_id", member.id)
          .maybeSingle()
      results.push({
        name: "board can read workspace communication post",
        passed: !!boardReadsCommunication && !boardReadsCommunicationError,
      })

      const { error: boardCreatesCommunicationError } = await boardClient
        .from("organization_workspace_communications")
        .insert({
          org_id: member.id,
          channel: "email",
          media_mode: "text",
          content: "Unauthorized board post",
          status: "scheduled",
          scheduled_for: new Date(Date.now() + 3600_000).toISOString(),
          created_by: board.id,
        })
      results.push({
        name: "board cannot create workspace communication post",
        passed: !!boardCreatesCommunicationError,
      })

      if (workspaceCommunicationChannelsTableAvailable) {
        const { data: staffConnectedChannel, error: staffConnectedChannelError } =
          await staffClient
            .from("organization_workspace_communication_channels")
            .upsert(
              {
                org_id: member.id,
                channel: "social",
                is_connected: true,
                provider: "mock-social",
                connected_by: staff.id,
                connected_at: new Date().toISOString(),
                metadata: { source: "rls-test" },
              },
              { onConflict: "org_id,channel" }
            )
            .select("channel")
            .maybeSingle()
        results.push({
          name: "staff can upsert workspace communication channel",
          passed: !!staffConnectedChannel && !staffConnectedChannelError,
        })

        const {
          data: boardReadsConnectedChannel,
          error: boardReadsConnectedChannelError,
        } = await boardClient
          .from("organization_workspace_communication_channels")
          .select("channel")
          .eq("org_id", member.id)
          .eq("channel", "social")
          .maybeSingle()
        results.push({
          name: "board can read workspace communication channel",
          passed:
            !!boardReadsConnectedChannel && !boardReadsConnectedChannelError,
        })

        const { error: boardUpsertsConnectedChannelError } = await boardClient
          .from("organization_workspace_communication_channels")
          .upsert(
            {
              org_id: member.id,
              channel: "email",
              is_connected: true,
              provider: "mock-email",
              connected_by: board.id,
              connected_at: new Date().toISOString(),
              metadata: { source: "rls-test" },
            },
            { onConflict: "org_id,channel" }
          )
        results.push({
          name: "board cannot upsert workspace communication channel",
          passed: !!boardUpsertsConnectedChannelError,
        })
      }

      if (workspaceCommunicationDeliveriesTableAvailable) {
        const deliveryId = randomUUID()

        const { data: staffDelivery, error: staffDeliveryError } =
          await staffClient
            .from("organization_workspace_communication_deliveries")
            .insert({
              id: deliveryId,
              org_id: member.id,
              communication_id: communicationId,
              channel: "social",
              status: "queued",
              provider: "mock",
              attempt_count: 0,
              payload: {},
              created_by: staff.id,
            })
            .select("id")
            .maybeSingle()
        results.push({
          name: "staff can enqueue workspace communication delivery",
          passed: !!staffDelivery && !staffDeliveryError,
        })

        const { data: boardReadsDelivery, error: boardReadsDeliveryError } =
          await boardClient
            .from("organization_workspace_communication_deliveries")
            .select("id")
            .eq("id", deliveryId)
            .eq("org_id", member.id)
            .maybeSingle()
        results.push({
          name: "board can read workspace communication delivery",
          passed: !!boardReadsDelivery && !boardReadsDeliveryError,
        })

        const { error: boardCreatesDeliveryError } = await boardClient
          .from("organization_workspace_communication_deliveries")
          .insert({
            org_id: member.id,
            communication_id: communicationId,
            channel: "email",
            status: "queued",
            provider: "mock",
            attempt_count: 0,
            payload: {},
            created_by: board.id,
          })
        results.push({
          name: "board cannot enqueue workspace communication delivery",
          passed: !!boardCreatesDeliveryError,
        })
      }
    }
  }

  // Attachments visibility and invites admin-only
  {
    // Admin attaches a resource to the module
    const { data: attachment, error: attachErr } = await adminClient
      .from("attachments")
      .insert({
        scope_type: "module",
        scope_id: assets.moduleId,
        kind: "resource",
        storage_path: `resources/${assets.moduleId}/sample.pdf`,
        mime: "application/pdf",
      })
      .select("id")
      .single()
    if (attachErr) throw attachErr

    const { data: attachRead } = await memberClient
      .from("attachments")
      .select("id")
      .eq("id", attachment.id)
      .maybeSingle()
    results.push({
      name: "member can read module attachment (enrolled/published)",
      passed: !!attachRead,
    })

    // Member should not be able to create invites
    const { error: inviteErr } = await memberClient
      .from("enrollment_invites")
      .insert({
        class_id: assets.publishedClassId,
        email: `invitee-${suffix}@example.com`,
        token: `tok_${suffix}`,
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      })
    results.push({
      name: "member cannot create enrollment invites",
      passed: !!inviteErr,
    })
  }

  // Subscription visibility
  {
    const subId = randomUUID()
    const { error } = await adminClient.from("subscriptions").insert({
      id: subId,
      user_id: member.id,
      stripe_subscription_id: `sub_${suffix}`,
      status: "active",
    })
    if (error) throw error

    const { data, error: subscriptionError } = await memberClient
      .from("subscriptions")
      .select("id")
      .maybeSingle()
    results.push({
      name: "member can read own subscription",
      passed: !!data && !subscriptionError,
    })

    const { data: staffSub } = await staffClient
      .from("subscriptions")
      .select("id")
      .eq("id", subId)
      .maybeSingle()
    results.push({
      name: "staff can read org subscription",
      passed: !!staffSub,
    })

    const { data: boardSub } = await boardClient
      .from("subscriptions")
      .select("id")
      .eq("id", subId)
      .maybeSingle()
    results.push({
      name: "board cannot read org subscription",
      passed: !boardSub,
    })

    const { error: updateError } = await memberClient
      .from("subscriptions")
      .update({ metadata: { source: "rls-test" } })
      .eq("id", subId)
    results.push({
      name: "member cannot update own subscription metadata",
      passed: !!updateError,
    })
  }

  // Notifications visibility
  {
    const memberNotificationId = randomUUID()
    const adminNotificationId = randomUUID()
    const now = new Date().toISOString()

    const { error: insertError } = await adminClient
      .from("notifications")
      .insert([
        {
          id: memberNotificationId,
          user_id: member.id,
          title: "Member notification",
          description: "Visible to the member user only.",
          tone: "info",
        },
        {
          id: adminNotificationId,
          user_id: admin.id,
          title: "Admin notification",
          description: "Visible to the admin user only.",
          tone: "warning",
        },
      ])
    if (insertError) throw insertError

    const { data: memberNotifications, error: memberNotifError } =
      await memberClient
        .from("notifications")
        .select("id")
        .eq("user_id", member.id)
    const memberSeesOwn =
      Array.isArray(memberNotifications) &&
      memberNotifications.some((row) => row.id === memberNotificationId)
    results.push({
      name: "member can read own notifications",
      passed: memberSeesOwn && !memberNotifError,
    })

    const { data: otherNotifications } = await memberClient
      .from("notifications")
      .select("id")
      .eq("user_id", admin.id)
    results.push({
      name: "member cannot read other notifications",
      passed:
        Array.isArray(otherNotifications) && otherNotifications.length === 0,
    })

    const { data: deniedUpdate, error: deniedError } = await memberClient
      .from("notifications")
      .update({ read_at: now })
      .eq("id", adminNotificationId)
      .select("id")
    results.push({
      name: "member cannot update other notifications",
      passed:
        !deniedError &&
        Array.isArray(deniedUpdate) &&
        deniedUpdate.length === 0,
    })

    const { data: allowedUpdate, error: allowedError } = await memberClient
      .from("notifications")
      .update({ read_at: now })
      .eq("id", memberNotificationId)
      .select("id")
    results.push({
      name: "member can update own notifications",
      passed:
        !allowedError &&
        Array.isArray(allowedUpdate) &&
        allowedUpdate.length === 1,
    })

    const { data: adminReadsMember, error: adminReadError } =
      await adminSessionClient
        .from("notifications")
        .select("id")
        .eq("id", memberNotificationId)
        .maybeSingle()
    results.push({
      name: "admin can read member notifications",
      passed: !!adminReadsMember && !adminReadError,
    })

    const { data: adminUpdateMember, error: adminUpdateError } =
      await adminSessionClient
        .from("notifications")
        .update({ archived_at: now })
        .eq("id", memberNotificationId)
        .select("id")
    results.push({
      name: "admin can update member notifications",
      passed:
        !adminUpdateError &&
        Array.isArray(adminUpdateMember) &&
        adminUpdateMember.length === 1,
    })
  }

  // Search index view should not be directly selectable (use RPC instead).
  {
    const { error: viewError } = await memberClient
      .from("search_index")
      .select("id")
      .limit(1)
    const denied =
      viewError?.code === "42501" ||
      /permission denied/i.test(viewError?.message ?? "")
    results.push({
      name: "member cannot select search_index directly",
      passed: denied,
    })
  }

  const failed = results.filter((result) => !result.passed)
  results.forEach((result) => {
    console.log(`${result.passed ? "✓" : "✗"} ${result.name}`)
  })

  await adminClient.from("module_progress").delete().eq("user_id", member.id)
  await adminClient
    .from("assignment_submissions")
    .delete()
    .eq("user_id", member.id)
  await adminClient
    .from("module_assignments")
    .delete()
    .eq("module_id", assets.moduleId)
  await adminClient.from("attachments").delete().eq("scope_id", assets.moduleId)
  await adminClient.from("programs").delete().eq("user_id", member.id)
  await adminClient.from("organizations").delete().eq("user_id", member.id)
  await adminClient.from("enrollments").delete().eq("user_id", member.id)
  await adminClient
    .from("modules")
    .delete()
    .in("id", [assets.moduleId, assets.hiddenModuleId])
  await adminClient
    .from("classes")
    .delete()
    .in("id", [assets.publishedClassId, assets.unpublishedClassId])
  await adminClient.from("subscriptions").delete().eq("user_id", member.id)
  await adminClient
    .from("notifications")
    .delete()
    .in("user_id", [member.id, admin.id])
  await adminClient.storage.from("avatars").remove([`${member.id}/rls-avatar-${suffix}.png`])
  await adminClient.auth.admin.deleteUser(member.id)
  await adminClient.auth.admin.deleteUser(admin.id)
  await adminClient.auth.admin.deleteUser(staff.id)
  await adminClient.auth.admin.deleteUser(board.id)
  await adminClient.auth.admin.deleteUser(orgAdmin.id)

  if (failed.length > 0) {
    console.error(`RLS tests failed (${failed.length}).`)
    process.exit(1)
  }

  console.log("RLS tests passed.")
}

run().catch((error) => {
  console.error("RLS test runner error:", error)
  process.exit(1)
})
