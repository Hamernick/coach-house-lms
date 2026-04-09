"use client"

import {
  BacklogCard,
  Separator,
  TimeCard,
  type ProjectDetails,
} from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceAdminOrganizationSummary } from "../../types"
import { MemberWorkspaceProjectOrganizationCard } from "./member-workspace-project-organization-card"
import { MemberWorkspaceProjectQuickLinksCard } from "./member-workspace-project-quick-links-card"

export function MemberWorkspaceProjectRightMetaPanel({
  project,
  organizationSummary,
  createQuickLinkAction,
  updateQuickLinkAction,
  deleteQuickLinkAction,
}: {
  project: ProjectDetails
  organizationSummary: MemberWorkspaceAdminOrganizationSummary
  createQuickLinkAction?: (input: {
    projectId: string
    name: string
    url: string
  }) => Promise<{ ok: true; linkId: string } | { error: string }>
  updateQuickLinkAction?: (input: {
    projectId: string
    linkId: string
    name: string
    url: string
  }) => Promise<{ ok: true; linkId: string } | { error: string }>
  deleteQuickLinkAction?: (input: {
    projectId: string
    linkId: string
  }) => Promise<{ ok: true } | { error: string }>
}) {
  return (
    <aside className="flex flex-col gap-10 p-4 pt-8 lg:sticky lg:self-start">
      <TimeCard time={project.time} />
      <Separator />
      <BacklogCard backlog={project.backlog} />
      <Separator />
      <MemberWorkspaceProjectOrganizationCard organization={organizationSummary} />
      <Separator />
      <MemberWorkspaceProjectQuickLinksCard
        links={project.quickLinks}
        projectId={project.id}
        createQuickLinkAction={createQuickLinkAction}
        updateQuickLinkAction={updateQuickLinkAction}
        deleteQuickLinkAction={deleteQuickLinkAction}
      />
    </aside>
  )
}
