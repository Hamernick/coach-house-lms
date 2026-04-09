import { notFound } from "next/navigation"

import { Empty } from "@/components/ui/empty"
import {
  createMemberWorkspaceProjectNoteAction,
  createMemberWorkspaceProjectQuickLinkAction,
  createMemberWorkspaceTaskAction,
  deleteMemberWorkspaceProjectNoteAction,
  deleteMemberWorkspaceProjectQuickLinkAction,
  loadMemberWorkspaceProjectDetailPage,
  MemberWorkspaceProjectDetailPage,
  updateMemberWorkspaceProjectNoteAction,
  updateMemberWorkspaceProjectQuickLinkAction,
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
      createTaskAction={createMemberWorkspaceTaskAction}
      updateTaskStatusAction={updateMemberWorkspaceTaskStatusAction}
      updateTaskOrderAction={updateMemberWorkspaceTaskOrderAction}
      createNoteAction={createMemberWorkspaceProjectNoteAction}
      updateNoteAction={updateMemberWorkspaceProjectNoteAction}
      deleteNoteAction={deleteMemberWorkspaceProjectNoteAction}
      createQuickLinkAction={createMemberWorkspaceProjectQuickLinkAction}
      updateQuickLinkAction={updateMemberWorkspaceProjectQuickLinkAction}
      deleteQuickLinkAction={deleteMemberWorkspaceProjectQuickLinkAction}
    />
  )
}
