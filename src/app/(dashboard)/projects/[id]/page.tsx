import { notFound } from "next/navigation"

import { Empty } from "@/components/ui/empty"
import {
  createMemberWorkspaceProjectNoteAction,
  createMemberWorkspaceProjectQuickLinkAction,
  createMemberWorkspaceTaskAction,
  deleteMemberWorkspaceTaskAction,
  deleteMemberWorkspaceProjectNoteAction,
  deleteMemberWorkspaceProjectQuickLinkAction,
  loadMemberWorkspaceProjectDetailPage,
  MemberWorkspaceProjectDetailPage,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectNoteAction,
  updateMemberWorkspaceProjectQuickLinkAction,
  updateMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskOrderAction,
  updateMemberWorkspaceTaskStatusAction,
} from "@/features/member-workspace"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await loadMemberWorkspaceProjectDetailPage(id)

  if (result.state === "not-found") {
    notFound()
  }

  if (result.state === "schema-unavailable") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
        <Empty
          title="Projects unavailable"
          description="Projects cannot open until the latest workspace database migrations are applied."
          variant="subtle"
        />
      </div>
    )
  }

  return (
    <MemberWorkspaceProjectDetailPage
      project={result.project}
      assigneeOptions={result.assigneeOptions}
      currentUser={result.currentUser}
      organizationSummary={result.organizationSummary}
      canManageProject={result.scope === "organization"}
      createTaskAction={
        result.scope === "organization" ? createMemberWorkspaceTaskAction : undefined
      }
      updateTaskAction={
        result.scope === "organization" ? updateMemberWorkspaceTaskAction : undefined
      }
      deleteTaskAction={
        result.scope === "organization" ? deleteMemberWorkspaceTaskAction : undefined
      }
      updateProjectAction={
        result.scope === "organization" ? updateMemberWorkspaceProjectAction : undefined
      }
      updateTaskStatusAction={
        result.scope === "organization" ? updateMemberWorkspaceTaskStatusAction : undefined
      }
      updateTaskOrderAction={
        result.scope === "organization" ? updateMemberWorkspaceTaskOrderAction : undefined
      }
      createNoteAction={
        result.scope === "organization" ? createMemberWorkspaceProjectNoteAction : undefined
      }
      updateNoteAction={
        result.scope === "organization" ? updateMemberWorkspaceProjectNoteAction : undefined
      }
      deleteNoteAction={
        result.scope === "organization" ? deleteMemberWorkspaceProjectNoteAction : undefined
      }
      createQuickLinkAction={
        result.scope === "organization"
          ? createMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
      updateQuickLinkAction={
        result.scope === "organization"
          ? updateMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
      deleteQuickLinkAction={
        result.scope === "organization"
          ? deleteMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
    />
  )
}
