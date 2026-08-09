import type {
  MemberWorkspaceCreateTaskInput,
  MemberWorkspaceTaskStatus,
} from "../types"
import { actorCanAccessOrganizations } from "./member-workspace-actor-permissions"
import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import { loadMemberWorkspacePersonOptionsForOrganizations } from "./person-options"

type MemberWorkspaceTaskActionActor = Awaited<
  ReturnType<typeof resolveMemberWorkspaceActorContext>
>

export const VALID_TASK_STATUSES = new Set<MemberWorkspaceTaskStatus>([
  "todo",
  "in-progress",
  "done",
])

export const VALID_TASK_PRIORITIES = new Set<
  NonNullable<MemberWorkspaceCreateTaskInput["priority"]>
>(["no-priority", "low", "medium", "high", "urgent"])

export function toDateOnly(input: string) {
  return new Date(`${input}T00:00:00.000Z`)
}

export function formatTaskType(tagLabel?: string) {
  const normalizedTag = tagLabel?.trim().toLowerCase()
  if (normalizedTag === "bug") return "bug"
  if (normalizedTag === "internal") return "improvement"
  return "task"
}

export async function resolveTaskTargetProject({
  actor,
  projectId,
}: {
  actor: MemberWorkspaceTaskActionActor
  projectId: string
}): Promise<
  | {
      project: {
        id: string
        org_id: string
        task_count: number
        project_kind: string
        created_source: string
      }
    }
  | { error: string }
> {
  const { data: project, error: projectError } = await actor.supabase
    .from("organization_projects")
    .select("id, org_id, task_count, project_kind, created_source")
    .eq("id", projectId)
    .maybeSingle<{
      id: string
      org_id: string
      task_count: number
      project_kind: string
      created_source: string
    }>()

  if (projectError || !project) {
    return { error: "Choose a valid project." } as const
  }

  if (
    !actorCanAccessOrganizations(actor) &&
    project.org_id !== actor.activeOrg.orgId
  ) {
    return {
      error: "You do not have access to manage tasks for that project.",
    } as const
  }

  const isStandardUserProject =
    project.project_kind === "standard" && project.created_source !== "system"
  const isCanonicalAdminProject =
    actorCanAccessOrganizations(actor) &&
    project.project_kind === "organization_admin"

  if (!isStandardUserProject && !isCanonicalAdminProject) {
    return { error: "Choose a valid project." } as const
  }

  return { project } as const
}

export async function resolveAssignableUserId({
  actor,
  orgId,
  requestedUserId,
}: {
  actor: MemberWorkspaceTaskActionActor
  orgId: string
  requestedUserId?: string
}): Promise<{ userId: string | null } | { error: string }> {
  const candidateUserId = requestedUserId?.trim() || actor.userId
  if (!candidateUserId) {
    return { userId: null } as const
  }

  try {
    const assignablePeople =
      await loadMemberWorkspacePersonOptionsForOrganizations({
        orgIds: [orgId],
        supabase: actor.supabase,
        includePlatformAdmins: actorCanAccessOrganizations(actor),
      })
    const assignableUserIds = new Set(
      assignablePeople.map((person) => person.id.trim()).filter(Boolean)
    )

    if (!assignableUserIds.has(candidateUserId)) {
      return { error: "Choose a valid assignee." } as const
    }
  } catch {
    return { error: "Unable to validate the selected assignee." } as const
  }

  return { userId: candidateUserId } as const
}
