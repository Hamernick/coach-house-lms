import type { User } from "@/features/platform-admin-dashboard"
import type { Database } from "@/lib/supabase"
import type {
  MemberWorkspaceAdminOrganizationSummary,
  MemberWorkspacePersonOption,
} from "../types"

import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import { ensureCanonicalAdminProjects } from "./admin-projects"
import {
  loadAdminOrganizationSummaryById,
  mapAdminOrganizationSummaryToProjectRecord,
} from "./admin-organization-overview"
import { buildMemberWorkspaceProjectDetails } from "./project-detail-view-model"
import { ensureStarterProjectsForOrg } from "./project-persistence"
import { organizationProjectSelectFields } from "./project-select"
import { type OrganizationProjectRecord } from "./project-starter-data"
import { loadMemberWorkspacePersonOptionsForOrganizations } from "./person-options"
import { ensureStarterTasksForOrg } from "./task-persistence"
import { loadTaskAssigneeMap } from "./task-assignees"
import {
  isMissingOrganizationProjectsTableError,
  isMissingOrganizationProjectAssetsTableError,
  isMissingOrganizationProjectNotesTableError,
  isMissingOrganizationProjectQuickLinksTableError,
  isMissingOrganizationTasksTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"
import type {
  MemberWorkspaceProjectAssetRecord,
  MemberWorkspaceProjectNoteRecord,
  MemberWorkspaceProjectQuickLinkRecord,
} from "./project-detail-view-model"

type OrganizationTaskDetailRecord = Pick<
  Database["public"]["Tables"]["organization_tasks"]["Row"],
  | "id"
  | "project_id"
  | "title"
  | "description"
  | "task_type"
  | "status"
  | "start_date"
  | "end_date"
  | "priority"
  | "tag_label"
  | "workstream_name"
  | "sort_order"
>

type OrganizationProjectNoteRow = Pick<
  Database["public"]["Tables"]["organization_project_notes"]["Row"],
  | "id"
  | "org_id"
  | "project_id"
  | "title"
  | "content"
  | "note_type"
  | "status"
  | "created_at"
  | "created_by"
>

type OrganizationProjectQuickLinkRow = Pick<
  Database["public"]["Tables"]["organization_project_quick_links"]["Row"],
  "id" | "org_id" | "project_id" | "name" | "url" | "link_type" | "size_mb"
>

type OrganizationProjectAssetRow = Pick<
  Database["public"]["Tables"]["organization_project_assets"]["Row"],
  | "id"
  | "org_id"
  | "project_id"
  | "name"
  | "description"
  | "asset_type"
  | "external_url"
  | "size_bytes"
  | "created_at"
  | "created_by"
>

type ProfileLiteRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "avatar_url" | "email"
>

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export type MemberWorkspaceProjectDetailLoadResult =
  | { state: "schema-unavailable" }
  | { state: "not-found" }
  | {
      state: "ready"
      scope: "organization" | "platform-admin"
      assigneeOptions: MemberWorkspacePersonOption[]
      currentUser: User
      organizationSummary: MemberWorkspaceAdminOrganizationSummary
      project: ReturnType<typeof buildMemberWorkspaceProjectDetails>
    }

async function loadProjectTaskRows({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
}) {
  const { data: taskRows, error: taskError } = await supabase
    .from("organization_tasks")
    .select(
      "id, project_id, title, description, task_type, status, start_date, end_date, priority, tag_label, workstream_name, sort_order",
    )
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true })
    .returns<OrganizationTaskDetailRecord[]>()

  if (taskError) {
    if (isMissingOrganizationTasksTableError(taskError)) {
      return []
    }
    throw toMemberWorkspaceDataError(taskError, "Unable to load project tasks.")
  }

  const rows = taskRows ?? []
  const assigneeByTaskId = await loadTaskAssigneeMap({
    supabase,
    taskIds: rows.map((task) => task.id),
  })

  return rows.map((task) => {
    const assignee = assigneeByTaskId.get(task.id)
    return {
      ...task,
      assignee_id: assignee?.id ?? null,
      assignee_name: assignee?.name ?? null,
      assignee_avatar_url: assignee?.avatarUrl ?? null,
    }
  })
}

async function loadProjectNoteRows({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
}): Promise<MemberWorkspaceProjectNoteRecord[]> {
  const { data: noteRows, error: noteError } = await supabase
    .from("organization_project_notes")
    .select("id, org_id, project_id, title, content, note_type, status, created_at, created_by")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<OrganizationProjectNoteRow[]>()

  if (noteError) {
    if (isMissingOrganizationProjectNotesTableError(noteError)) {
      return []
    }
    throw toMemberWorkspaceDataError(noteError, "Unable to load project notes.")
  }

  const authorIds = Array.from(
    new Set((noteRows ?? []).map((note) => note.created_by).filter(Boolean)),
  )
  const authorsById = new Map<string, ProfileLiteRow>()

  if (authorIds.length > 0) {
    const { data: authorRows, error: authorError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", authorIds)
      .returns<ProfileLiteRow[]>()

    if (authorError) {
      throw toMemberWorkspaceDataError(authorError, "Unable to load note authors.")
    }

    for (const author of authorRows ?? []) {
      authorsById.set(author.id, author)
    }
  }

  return (noteRows ?? []).map((note) => {
    const author = authorsById.get(note.created_by) ?? null
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      note_type: note.note_type,
      status: note.status,
      created_at: note.created_at,
      created_by: note.created_by,
      created_by_name:
        toTrimmedString(author?.full_name) || toTrimmedString(author?.email) || "Unknown member",
      created_by_avatar_url: toTrimmedString(author?.avatar_url) || null,
    }
  })
}

async function loadProjectQuickLinkRows({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
}): Promise<MemberWorkspaceProjectQuickLinkRecord[]> {
  const { data: quickLinkRows, error: quickLinkError } = await supabase
    .from("organization_project_quick_links")
    .select("id, org_id, project_id, name, url, link_type, size_mb")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<OrganizationProjectQuickLinkRow[]>()

  if (quickLinkError) {
    if (isMissingOrganizationProjectQuickLinksTableError(quickLinkError)) {
      return []
    }
    throw toMemberWorkspaceDataError(quickLinkError, "Unable to load project quick links.")
  }

  return (quickLinkRows ?? []).map((link) => ({
    id: link.id,
    name: link.name,
    url: link.url,
    link_type: link.link_type,
    size_mb: Number(link.size_mb ?? 0),
  }))
}

async function loadProjectAssetRows({
  orgId,
  projectId,
  supabase,
}: {
  orgId: string
  projectId: string
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
}): Promise<MemberWorkspaceProjectAssetRecord[]> {
  const { data: assetRows, error: assetError } = await supabase
    .from("organization_project_assets")
    .select(
      "id, org_id, project_id, name, description, asset_type, external_url, size_bytes, created_at, created_by",
    )
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<OrganizationProjectAssetRow[]>()

  if (assetError) {
    if (isMissingOrganizationProjectAssetsTableError(assetError)) {
      return []
    }
    throw toMemberWorkspaceDataError(assetError, "Unable to load project assets.")
  }

  const authorIds = Array.from(
    new Set((assetRows ?? []).map((asset) => asset.created_by).filter(Boolean)),
  )
  const authorsById = new Map<string, ProfileLiteRow>()

  if (authorIds.length > 0) {
    const { data: authorRows, error: authorError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", authorIds)
      .returns<ProfileLiteRow[]>()

    if (authorError) {
      throw toMemberWorkspaceDataError(authorError, "Unable to load asset authors.")
    }

    for (const author of authorRows ?? []) {
      authorsById.set(author.id, author)
    }
  }

  return (assetRows ?? []).map((asset) => {
    const author = authorsById.get(asset.created_by) ?? null
    return {
      id: asset.id,
      project_id: asset.project_id,
      name: asset.name,
      description: asset.description,
      asset_type: asset.asset_type,
      external_url: asset.external_url,
      size_bytes: asset.size_bytes,
      created_at: asset.created_at,
      created_by: asset.created_by,
      created_by_name:
        toTrimmedString(author?.full_name) || toTrimmedString(author?.email) || "Unknown member",
      created_by_avatar_url: toTrimmedString(author?.avatar_url) || null,
    }
  })
}

async function loadCurrentUser({
  supabase,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
  userId: string
}): Promise<User> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .eq("id", userId)
    .maybeSingle<ProfileLiteRow>()

  if (profileError) {
    throw toMemberWorkspaceDataError(profileError, "Unable to load your profile.")
  }

  return {
    id: userId,
    name:
      toTrimmedString(profile?.full_name) ||
      toTrimmedString(profile?.email) ||
      "You",
    avatarUrl: toTrimmedString(profile?.avatar_url) || undefined,
  }
}

async function buildReadyProjectDetailResult({
  actor,
  organizationSummary,
  project,
}: {
  actor: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>
  organizationSummary: MemberWorkspaceAdminOrganizationSummary
  project: OrganizationProjectRecord
}): Promise<Extract<MemberWorkspaceProjectDetailLoadResult, { state: "ready" }>> {
  const [assigneeOptions, currentUser, tasks, notes, quickLinks, assets] = await Promise.all([
    loadMemberWorkspacePersonOptionsForOrganizations({
      orgIds: [project.org_id],
      supabase: actor.supabase,
      includePlatformAdmins: actor.isAdmin,
    }),
    loadCurrentUser({
      supabase: actor.supabase,
      userId: actor.userId,
    }),
    loadProjectTaskRows({
      orgId: project.org_id,
      projectId: project.id,
      supabase: actor.supabase,
    }),
    loadProjectNoteRows({
      orgId: project.org_id,
      projectId: project.id,
      supabase: actor.supabase,
    }),
    loadProjectQuickLinkRows({
      orgId: project.org_id,
      projectId: project.id,
      supabase: actor.supabase,
    }),
    loadProjectAssetRows({
      orgId: project.org_id,
      projectId: project.id,
      supabase: actor.supabase,
    }),
  ])

  return {
    state: "ready",
    scope: actor.isAdmin ? "platform-admin" : "organization",
    assigneeOptions,
    currentUser,
    organizationSummary,
    project: buildMemberWorkspaceProjectDetails({
      project,
      tasks,
      notes,
      quickLinks,
      assets,
      assigneeOptions,
    }),
  }
}

export async function loadMemberWorkspaceProjectDetailPage(
  projectId: string,
): Promise<MemberWorkspaceProjectDetailLoadResult> {
  const actor = await resolveMemberWorkspaceActorContext()

  if (actor.isAdmin) {
    const { data: projectRow, error: projectError } = await actor.supabase
      .from("organization_projects")
      .select(organizationProjectSelectFields)
      .eq("id", projectId)
      .maybeSingle<OrganizationProjectRecord>()

    if (projectError) {
      if (isMissingOrganizationProjectsTableError(projectError)) {
        const organization = await loadAdminOrganizationSummaryById({
          supabase: actor.supabase,
          orgId: projectId,
        })

        if (!organization) {
          return { state: "schema-unavailable" }
        }

        return buildReadyProjectDetailResult({
          actor,
          organizationSummary: organization,
          project: mapAdminOrganizationSummaryToProjectRecord(organization),
        })
      }
      throw toMemberWorkspaceDataError(projectError, "Unable to load project details.")
    }

    if (projectRow) {
      const organizationSummary = await loadAdminOrganizationSummaryById({
        supabase: actor.supabase,
        orgId: projectRow.org_id,
      })

      if (!organizationSummary) {
        return { state: "not-found" }
      }

      if (projectRow.project_kind === "organization_admin") {
        const canonicalProjects = await ensureCanonicalAdminProjects({
          organizations: [organizationSummary],
          supabase: actor.supabase,
        })
        const canonicalProject = canonicalProjects?.[0] ?? null

        return buildReadyProjectDetailResult({
          actor,
          organizationSummary,
          project: canonicalProject ?? mapAdminOrganizationSummaryToProjectRecord(organizationSummary),
        })
      }

      return buildReadyProjectDetailResult({
        actor,
        organizationSummary,
        project: projectRow,
      })
    }

    const organization = await loadAdminOrganizationSummaryById({
      supabase: actor.supabase,
      orgId: projectId,
    })

    if (!organization) {
      return { state: "not-found" }
    }

    const canonicalProjects = await ensureCanonicalAdminProjects({
      organizations: [organization],
      supabase: actor.supabase,
    })
    const canonicalProject = canonicalProjects?.[0] ?? null

    if (canonicalProject) {
      return buildReadyProjectDetailResult({
        actor,
        organizationSummary: organization,
        project: canonicalProject,
      })
    }

    return buildReadyProjectDetailResult({
      actor,
      organizationSummary: organization,
      project: mapAdminOrganizationSummaryToProjectRecord(organization),
    })
  }

  await ensureStarterProjectsForOrg({
    canEdit: actor.canEdit,
    orgId: actor.activeOrg.orgId,
    userId: actor.userId,
    supabase: actor.supabase,
  })

  await ensureStarterTasksForOrg({
    canEdit: actor.canEdit,
    orgId: actor.activeOrg.orgId,
    userId: actor.userId,
    supabase: actor.supabase,
  })

  const { data: projectRow, error: projectError } = await actor.supabase
    .from("organization_projects")
    .select(organizationProjectSelectFields)
    .eq("org_id", actor.activeOrg.orgId)
    .eq("project_kind", "standard")
    .neq("created_source", "system")
    .eq("id", projectId)
    .maybeSingle<OrganizationProjectRecord>()

  if (projectError) {
    if (isMissingOrganizationProjectsTableError(projectError)) {
      return { state: "schema-unavailable" }
    }
    throw toMemberWorkspaceDataError(projectError, "Unable to load project details.")
  }

  if (!projectRow) {
    return { state: "not-found" }
  }

  const organizationSummary = await loadAdminOrganizationSummaryById({
    supabase: actor.supabase,
    orgId: actor.activeOrg.orgId,
  })

  if (!organizationSummary) {
    return { state: "not-found" }
  }

  return buildReadyProjectDetailResult({
    actor,
    organizationSummary,
    project: projectRow,
  })
}
