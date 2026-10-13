"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

import { Skeleton } from "@/components/ui/skeleton"

import type { WorkspaceOrganizationEditorData } from "../../workspace-board-types"
import type { WorkspaceDataDrawerRequest } from "./workspace-canvas-overlay-drawer-tabs"

const MyOrganizationEditorView = dynamic<
  ComponentProps<
    typeof import("../../../my-organization-editor-view").MyOrganizationEditorView
  >
>(
  () =>
    import("../../../my-organization-editor-view").then(
      (module) => module.MyOrganizationEditorView
    ),
  {
    loading: () => (
      <div className="flex h-full min-h-0 flex-col gap-3 p-2 sm:p-3">
        <Skeleton className="h-36 w-full shrink-0 rounded-2xl" />
        <Skeleton className="min-h-60 flex-1 rounded-2xl" />
      </div>
    ),
  }
)

export function WorkspaceCanvasOverlayOrganizationPanel({
  data,
  request,
}: {
  data: WorkspaceOrganizationEditorData
  request: WorkspaceDataDrawerRequest | null
}) {
  return (
    <div
      data-workspace-organization-drawer-panel="true"
      className="mx-auto box-border flex h-full min-h-0 w-full max-w-3xl min-w-0 flex-col p-2 sm:p-3"
    >
      <MyOrganizationEditorView
        key={
          request?.tab === "organization"
            ? `organization-request:${request.id}`
            : "organization-default"
        }
        embedded
        initialProfile={data.initialProfile}
        people={data.people}
        programs={data.programs}
        initialTab={
          request?.tab === "organization"
            ? (request.organizationTab ?? "company")
            : undefined
        }
        initialProgramId={
          request?.tab === "organization" ? request.organizationProgramId : null
        }
        initialProgramStep={
          request?.tab === "organization"
            ? request.organizationProgramStep
            : null
        }
        initialFocus={
          request?.tab === "organization" ? request.organizationFocus : null
        }
        initialEditMode={
          request?.tab === "organization" && request.organizationEditMode
        }
        canEdit={data.canEdit}
      />
    </div>
  )
}
