"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import type { ComponentProps } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { getOrganizationLaunchReturnHref, resolveEditorReturnDestination } from "@/lib/workspace/editor-navigation"

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
  const searchParams = useSearchParams()
  const guided = searchParams.get("guide") === "1" && searchParams.get("view") !== "editor"
  const guidePrograms = guided &&
    searchParams.get("guideStep") === "program" && searchParams.get("view") !== "editor"
  const returnHref = getOrganizationLaunchReturnHref(searchParams.toString())
  return (
    <div
      data-workspace-organization-drawer-panel="true"
      className="mx-auto box-border w-full max-w-3xl min-w-0 select-text p-2 sm:p-3 [&_[data-slot=organization-profile-section]]:grid-cols-1 [&_div:has(>[data-slot=organization-profile-field])]:grid-cols-1"
    >
      {returnHref ? (
        <Button asChild variant="ghost" size="sm" className="sticky top-0 z-20 mb-2 gap-1.5 bg-background text-xs text-muted-foreground">
          <Link href={returnHref}><ArrowLeftIcon className="size-3.5" aria-hidden="true" />{searchParams.get("from") === "workspace-guide" ? "Back to setup" : resolveEditorReturnDestination(returnHref).label === "Public preview" ? "Back to preview" : "Back to checklist"}</Link>
        </Button>
      ) : null}
      <MyOrganizationEditorView
        key={
          guided ? `organization-guide:${guidePrograms ? "programs" : "company"}` : request?.tab === "organization"
            ? `organization-request:${request.id}`
            : "organization-default"
        }
        embedded
        scrollMode="parent"
        initialProfile={data.initialProfile}
        people={data.people}
        programs={data.programs}
        initialTab={
          guided ? (guidePrograms ? "programs" : "company") : request?.tab === "organization"
            ? (request.organizationTab ?? "company")
            : undefined
        }
        initialProgramId={
          !guided && request?.tab === "organization" ? request.organizationProgramId : null
        }
        initialProgramStep={
          !guided && request?.tab === "organization"
            ? request.organizationProgramStep
            : null
        }
        initialFocus={
          !guided && request?.tab === "organization" ? request.organizationFocus : null
        }
        initialEditMode={
          !guided && request?.tab === "organization" && request.organizationEditMode
        }
        canEdit={data.canEdit && !guided}
      />
    </div>
  )
}
