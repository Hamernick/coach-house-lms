"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { WorkspaceAcceleratorBanner } from "@/features/workspace-accelerator-card"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorOpenStepRequest,
} from "@/features/workspace-accelerator-card"
import type { RoadmapSection } from "@/lib/roadmap"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

import { WorkspaceBoardLazyAcceleratorCardPanel } from "../../workspace-board-accelerator-lazy"
import type { WorkspaceDataDrawerRequest } from "./workspace-canvas-overlay-drawer-tabs"

export function WorkspaceCanvasOverlayAcceleratorPanel({
  input,
  roadmapSections,
  hasAccess,
  paywallHref,
  request,
  onRequestHandled,
}: {
  input: WorkspaceAcceleratorCardInput
  roadmapSections: RoadmapSection[]
  hasAccess: boolean
  paywallHref: string
  request: WorkspaceDataDrawerRequest | null
  onRequestHandled: (requestId: number) => void
}) {
  const openStepRequest =
    useMemo<WorkspaceAcceleratorOpenStepRequest | null>(() => {
      if (
        request?.tab !== "accelerator" ||
        !request.acceleratorStepId ||
        !request.acceleratorModuleId
      ) {
        return null
      }

      return {
        id: request.id,
        stepId: request.acceleratorStepId,
        moduleId: request.acceleratorModuleId,
        lessonGroupKey: request.acceleratorLessonGroupKey ?? null,
      }
    }, [request])
  const requestedModuleId =
    request?.tab === "accelerator"
      ? (request.acceleratorModuleId ?? null)
      : null
  const panelInput = useMemo<WorkspaceAcceleratorCardInput>(
    () =>
      openStepRequest
        ? {
            ...input,
            initialCurrentStepId: openStepRequest.stepId,
          }
        : input,
    [input, openStepRequest]
  )
  const [isModuleViewerOpen, setIsModuleViewerOpen] = useState(false)
  const handleRuntimeChange = useCallback(
    (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => {
      setIsModuleViewerOpen(Boolean(snapshot.isModuleViewerOpen))
    },
    []
  )
  const showBanner = !requestedModuleId && !isModuleViewerOpen

  return (
    <div
      data-workspace-accelerator-drawer-panel="true"
      data-workspace-accelerator-request-step={
        openStepRequest?.stepId ?? undefined
      }
      data-workspace-accelerator-request-module={requestedModuleId ?? undefined}
      className="box-border flex h-full min-h-0 w-full min-w-0 flex-col p-2 sm:p-3"
    >
      {!hasAccess ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <h2 className="text-lg font-semibold text-balance">
              Unlock the Accelerator
            </h2>
            <p className="text-muted-foreground text-sm text-pretty">
              Get guided classes, videos, resources, and assignments inside your
              workspace.
            </p>
            <Button asChild>
              <Link href={paywallHref}>View access options</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <WorkspaceBoardLazyAcceleratorCardPanel
            input={panelInput}
            roadmapSections={roadmapSections}
            roadmapBasePath={WORKSPACE_ROADMAP_PATH}
            presentationMode="workspace-drawer"
            initialModuleViewerOpen={Boolean(requestedModuleId)}
            initialOpenModuleId={requestedModuleId}
            openStepRequest={openStepRequest}
            onOpenStepRequestHandled={onRequestHandled}
            onRuntimeChange={handleRuntimeChange}
            showEmbeddedClassPicker
            workspaceDrawerHeader={
              showBanner ? <WorkspaceAcceleratorBanner /> : null
            }
          />
        </div>
      )}
    </div>
  )
}
