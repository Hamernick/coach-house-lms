import type { PlatformAdminDashboardLabProject as Project } from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceCreateProjectFormInput as Input, MemberWorkspaceProjectOrganizationOption } from "../types"
import { defaultProjectOrganizationId } from "./project-organization"

const csv = (value?: string) => [...new Set((value ?? "").split(",").map(item => item.trim()).filter(Boolean))]

export function savedProject(
  id: string,
  input: Input,
  previous: Project | undefined,
  organizations: MemberWorkspaceProjectOrganizationOption[],
): Project {
  const organizationId = input.orgId ?? previous?.organizationId ?? defaultProjectOrganizationId(organizations)
  const organizationUnassigned = input.orgId === null || (input.orgId === undefined && Boolean(previous?.organizationUnassigned))
  return {
    taskCount: 0, progress: 0, tasks: [], projectKind: "standard",
    ...previous, id, organizationId, organizationUnassigned,
    name: input.name.trim(), description: input.description,
    status: input.status, priority: input.priority,
    startDate: input.startDate ? new Date(`${input.startDate}T00:00:00Z`) : null,
    endDate: input.endDate ? new Date(`${input.endDate}T00:00:00Z`) : null,
    fiscalSponsorshipEnabled: input.fiscalSponsorshipEnabled ?? previous?.fiscalSponsorshipEnabled ?? false,
    recurrence: input.recurrence ?? previous?.recurrence ?? "none",
    client: organizationUnassigned ? undefined : organizations.find(org => org.orgId === organizationId)?.name ?? input.clientName ?? previous?.client,
    typeLabel: input.typeLabel, durationLabel: input.durationLabel,
    tags: csv(input.tags), members: csv(input.memberLabels),
  }
}

export function upsertSavedProject(projects: Project[], project: Project) {
  return projects.some(item => item.id === project.id)
    ? projects.map(item => item.id === project.id ? project : item)
    : [project, ...projects]
}
