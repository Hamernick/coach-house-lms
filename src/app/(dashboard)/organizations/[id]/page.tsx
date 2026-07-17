import { notFound } from "next/navigation"

import { Empty } from "@/components/ui/empty"
import {
  connectFiscalSponsorshipDocumentAsset,
  generateFiscalSponsorshipAgreement,
  loadFiscalSponsorshipProjectWorkflowSummary,
  reviewFiscalSponsorshipApplication,
  reviewFiscalSponsorshipDocument,
  sendFiscalSponsorshipAgreementForSignature,
} from "@/features/fiscal-sponsorship"
import {
  createMemberWorkspaceProjectNoteAction,
  createMemberWorkspaceProjectQuickLinkAction,
  createMemberWorkspaceTaskAction,
  deleteMemberWorkspaceProjectAction,
  deleteMemberWorkspaceTaskAction,
  deleteMemberWorkspaceProjectNoteAction,
  deleteMemberWorkspaceProjectQuickLinkAction,
  loadPlatformAdminOrganizationProjectDetailPage,
  MemberWorkspaceProjectDetailPage,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectNoteAction,
  updateMemberWorkspaceProjectQuickLinkAction,
  updateMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskOrderAction,
  updateMemberWorkspaceTaskStatusAction,
} from "@/features/member-workspace"
import { requireAdmin } from "@/lib/admin/auth"
import type { ProjectDetails } from "@/features/platform-admin-dashboard"

type PageProps = {
  params: Promise<{ id: string }>
}

type OrganizationAdminProjectKind = "standard" | "organization_admin"

function getOrganizationAdminProjectKind(
  source: ProjectDetails["source"]
): OrganizationAdminProjectKind | undefined {
  if (!source || !("projectKind" in source)) return undefined

  return source.projectKind === "standard" ||
    source.projectKind === "organization_admin"
    ? source.projectKind
    : undefined
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const admin = await requireAdmin()

  const { id } = await params
  const result = await loadPlatformAdminOrganizationProjectDetailPage({
    projectId: id,
    userId: admin.userId,
  })

  if (result.state === "not-found") {
    notFound()
  }

  if (result.state === "schema-unavailable") {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
        <Empty
          title="Organizations unavailable"
          description="Organizations cannot open until the latest workspace database migrations are applied."
          variant="subtle"
        />
      </div>
    )
  }

  const canManageProject =
    result.scope === "organization" || result.scope === "platform-admin"
  const canManageProjectAssets =
    result.scope === "organization" || result.scope === "platform-admin"
  const canEditProjectDetails =
    result.scope === "organization" || result.scope === "platform-admin"
  const canManageFiscalSponsorship = result.scope === "platform-admin"
  const projectKind = getOrganizationAdminProjectKind(result.project.source)
  const canManageProjectTasks =
    result.scope === "organization" || result.scope === "platform-admin"
  const canDeleteProject =
    canEditProjectDetails && projectKind !== "organization_admin"
  const fiscalSponsorshipWorkflowSummary =
    await loadFiscalSponsorshipProjectWorkflowSummary(result.project.id)
  const fiscalSponsorshipWorkflowData =
    "error" in fiscalSponsorshipWorkflowSummary
      ? null
      : fiscalSponsorshipWorkflowSummary

  return (
    <MemberWorkspaceProjectDetailPage
      project={result.project}
      assigneeOptions={result.assigneeOptions}
      currentUser={result.currentUser}
      organizationSummary={result.organizationSummary}
      fiscalSponsorshipWorkflowSummary={fiscalSponsorshipWorkflowData}
      canManageProject={canManageProject}
      canManageProjectAssets={canManageProjectAssets}
      canEditProjectDetails={canEditProjectDetails}
      connectFiscalSponsorshipDocumentAssetAction={
        canEditProjectDetails
          ? connectFiscalSponsorshipDocumentAsset
          : undefined
      }
      createTaskAction={
        canManageProjectTasks ? createMemberWorkspaceTaskAction : undefined
      }
      updateTaskAction={
        canManageProjectTasks ? updateMemberWorkspaceTaskAction : undefined
      }
      deleteTaskAction={
        canManageProjectTasks ? deleteMemberWorkspaceTaskAction : undefined
      }
      updateProjectAction={
        canEditProjectDetails ? updateMemberWorkspaceProjectAction : undefined
      }
      deleteProjectAction={
        canDeleteProject ? deleteMemberWorkspaceProjectAction : undefined
      }
      updateTaskStatusAction={
        canManageProjectTasks
          ? updateMemberWorkspaceTaskStatusAction
          : undefined
      }
      updateTaskOrderAction={
        canManageProjectTasks ? updateMemberWorkspaceTaskOrderAction : undefined
      }
      createNoteAction={
        canManageProject ? createMemberWorkspaceProjectNoteAction : undefined
      }
      updateNoteAction={
        canManageProject ? updateMemberWorkspaceProjectNoteAction : undefined
      }
      deleteNoteAction={
        canManageProject ? deleteMemberWorkspaceProjectNoteAction : undefined
      }
      createQuickLinkAction={
        canManageProject
          ? createMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
      updateQuickLinkAction={
        canManageProject
          ? updateMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
      deleteQuickLinkAction={
        canManageProject
          ? deleteMemberWorkspaceProjectQuickLinkAction
          : undefined
      }
      generateFiscalSponsorshipAgreementAction={
        canManageFiscalSponsorship
          ? generateFiscalSponsorshipAgreement
          : undefined
      }
      reviewFiscalSponsorshipApplicationAction={
        canManageFiscalSponsorship
          ? reviewFiscalSponsorshipApplication
          : undefined
      }
      reviewFiscalSponsorshipDocumentAction={
        canManageFiscalSponsorship ? reviewFiscalSponsorshipDocument : undefined
      }
      sendFiscalSponsorshipAgreementForSignatureAction={
        canManageFiscalSponsorship
          ? sendFiscalSponsorshipAgreementForSignature
          : undefined
      }
    />
  )
}
