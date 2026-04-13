import type { Database } from "@/lib/supabase"
import {
  platformAdminDashboardLabProjects,
  type PlatformAdminDashboardLabProject,
} from "@/features/platform-admin-dashboard"
import { MEMBER_WORKSPACE_STARTER_VERSION } from "./starter-data"

export type OrganizationProjectRecord =
  Database["public"]["Tables"]["organization_projects"]["Row"]

type OrganizationProjectInsert =
  Database["public"]["Tables"]["organization_projects"]["Insert"]

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function buildStarterOrganizationProjects({
  orgId,
  actorId,
}: {
  orgId: string
  actorId: string
}): OrganizationProjectInsert[] {
  return platformAdminDashboardLabProjects.map((project) => ({
    org_id: orgId,
    name: project.name,
    description: project.description ?? null,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    start_date: toIsoDate(project.startDate),
    end_date: toIsoDate(project.endDate),
    client_name: project.client ?? null,
    type_label: project.typeLabel ?? null,
    duration_label: project.durationLabel ?? null,
    tags: project.tags,
    member_labels: project.members,
    task_count: project.taskCount,
    created_source: "starter_seed",
    starter_seed_key: project.id,
    starter_seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
    created_by: actorId,
    updated_by: actorId,
  }))
}

function parseDateOnly(input: string) {
  return new Date(`${input}T00:00:00.000Z`)
}

export function mapOrganizationProjectToViewModel(
  project: OrganizationProjectRecord,
): PlatformAdminDashboardLabProject {
  return {
    id: project.id,
    organizationId: project.org_id,
    projectKind:
      project.project_kind === "organization_admin"
        ? "organization_admin"
        : "standard",
    name: project.name,
    description: project.description ?? undefined,
    taskCount: project.task_count,
    progress: project.progress,
    startDate: parseDateOnly(project.start_date),
    endDate: parseDateOnly(project.end_date),
    status: project.status as PlatformAdminDashboardLabProject["status"],
    priority: project.priority as PlatformAdminDashboardLabProject["priority"],
    tags: project.tags ?? [],
    members: project.member_labels ?? [],
    client: project.client_name ?? undefined,
    typeLabel: project.type_label ?? undefined,
    durationLabel: project.duration_label ?? undefined,
    tasks: [],
  }
}
