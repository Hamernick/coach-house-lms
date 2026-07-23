"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"

import type { ProjectDetails } from "@/features/platform-admin-dashboard"
import {
  FiscalSponsorshipApplicationEditor,
  FiscalSponsorshipProjectWorkbench,
  type FiscalSponsorshipProjectWorkbenchAdminActionProps,
  type FiscalSponsorshipProjectWorkbenchDocumentActionProps,
  type FiscalSponsorshipProjectAssetOption,
  type FiscalSponsorshipProjectWorkflowSummary,
} from "@/features/fiscal-sponsorship"
import type { MemberWorkspaceAdminOrganizationSummary } from "../../types"
import { buildMemberWorkspaceProjectFiscalWorkbenchData } from "./member-workspace-project-fiscal-workbench-data"

export function MemberWorkspaceProjectFiscalWorkbench({
  canConnectDocuments = false,
  connectFiscalSponsorshipDocumentAssetAction,
  generateFiscalSponsorshipAgreementAction,
  fiscalSponsorshipWorkflowSummary,
  organizationSummary,
  onOpenAssets,
  project,
  reviewFiscalSponsorshipApplicationAction,
  reviewFiscalSponsorshipDocumentAction,
  sendFiscalSponsorshipAgreementForSignatureAction,
}: FiscalSponsorshipProjectWorkbenchAdminActionProps &
  FiscalSponsorshipProjectWorkbenchDocumentActionProps & {
    canConnectDocuments?: boolean
    fiscalSponsorshipWorkflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
    organizationSummary: MemberWorkspaceAdminOrganizationSummary
    onOpenAssets?: () => void
    project: ProjectDetails
  }) {
  const router = useRouter()
  const projectAssets: FiscalSponsorshipProjectAssetOption[] = useMemo(
    () =>
      project.files.map((file) => ({
        id: file.id,
        name: file.name,
        description: file.description ?? null,
        url: file.url,
        sizeLabel: file.isLinkAsset ? "Link" : `${file.sizeMB.toFixed(1)} MB`,
      })),
    [project.files]
  )
  const data = useMemo(
    () =>
      buildMemberWorkspaceProjectFiscalWorkbenchData({
        fiscalSponsorshipWorkflowSummary,
        organizationSummary,
        project,
      }),
    [fiscalSponsorshipWorkflowSummary, organizationSummary, project]
  )

  return (
    <FiscalSponsorshipProjectWorkbench
      data={data}
      className="max-w-none"
      canConnectDocuments={canConnectDocuments}
      connectFiscalSponsorshipDocumentAssetAction={
        connectFiscalSponsorshipDocumentAssetAction
      }
      generateFiscalSponsorshipAgreementAction={
        generateFiscalSponsorshipAgreementAction
      }
      onOpenAssets={onOpenAssets}
      projectAssets={projectAssets}
      renderApplicationEditor={({ open, onOpenChange }) => (
        <FiscalSponsorshipApplicationEditor
          data={data}
          open={open}
          onOpenChange={onOpenChange}
          onSaved={() => router.refresh()}
          surface="inline"
        />
      )}
      reviewFiscalSponsorshipApplicationAction={
        reviewFiscalSponsorshipApplicationAction
      }
      reviewFiscalSponsorshipDocumentAction={
        reviewFiscalSponsorshipDocumentAction
      }
      sendFiscalSponsorshipAgreementForSignatureAction={
        sendFiscalSponsorshipAgreementForSignatureAction
      }
    />
  )
}
