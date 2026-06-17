import type { ProjectDetails } from "@/features/platform-admin-dashboard"
import {
  buildFiscalSponsorshipProjectWorkbenchData,
  type FiscalSponsorshipProjectWorkflowSummary,
} from "@/features/fiscal-sponsorship"
import type { MemberWorkspaceAdminOrganizationSummary } from "../../types"

function countProjectTasks(project: ProjectDetails) {
  return project.workstreams.reduce(
    (total, workstream) => total + workstream.tasks.length,
    0
  )
}

function countProjectAssignees(project: ProjectDetails) {
  const assigneeIds = new Set<string>()

  for (const person of project.backlog.picUsers) {
    assigneeIds.add(person.id)
  }

  for (const person of project.backlog.supportUsers ?? []) {
    assigneeIds.add(person.id)
  }

  for (const workstream of project.workstreams) {
    for (const task of workstream.tasks) {
      if (task.assignee?.id) {
        assigneeIds.add(task.assignee.id)
      }
    }
  }

  return assigneeIds.size
}

export function buildMemberWorkspaceProjectFiscalWorkbenchData({
  fiscalSponsorshipWorkflowSummary,
  organizationSummary,
  project,
}: {
  fiscalSponsorshipWorkflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
  organizationSummary: MemberWorkspaceAdminOrganizationSummary
  project: ProjectDetails
}) {
  return buildFiscalSponsorshipProjectWorkbenchData({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      statusLabel: project.backlog.statusLabel,
      priorityLabel: project.backlog.priorityLabel,
      locationLabel: project.meta.locationLabel,
      taskCount: countProjectTasks(project),
      fileCount: project.files.length,
      noteCount: project.notes.length,
      assigneeCount: countProjectAssignees(project),
    },
    workflowSummary: fiscalSponsorshipWorkflowSummary,
    organization: {
      name: organizationSummary.name,
      ownerName: organizationSummary.ownerName,
      organizationStatus: organizationSummary.organizationStatus,
      setupCompletedCount: organizationSummary.setupCompletedCount,
      setupTotalCount: organizationSummary.setupTotalCount,
      memberCount: organizationSummary.memberCount,
    },
  })
}
