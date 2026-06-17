"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { WorkspaceAcceleratorCardProgressSummary } from "@/features/workspace-accelerator-card"
import type {
  WorkspaceAcceleratorCardInput,
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorCardStep,
} from "@/features/workspace-accelerator-card"
import { cn } from "@/lib/utils"

import { WorkspaceBoardLazyAcceleratorCardPanel } from "./workspace-board-accelerator-lazy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"

export function WorkspaceBoardAcceleratorCard({
  input,
  runtimeActions,
  runtimeSnapshot,
  canEdit,
  presentationMode,
  isCanvasFullscreen,
  tutorialCallout,
  tutorialInteractionPolicy,
  shouldTrackEmbeddedRuntime,
  onRuntimeActionsChange,
  onRuntimeChange,
  onTutorialActionComplete,
  onRequestOpenStep,
}: {
  input: WorkspaceAcceleratorCardInput
  runtimeActions: WorkspaceAcceleratorCardRuntimeActions | null
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  canEdit: boolean
  presentationMode: boolean
  isCanvasFullscreen: boolean
  tutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
  tutorialInteractionPolicy: WorkspaceBoardNodeData["acceleratorTutorialInteractionPolicy"]
  shouldTrackEmbeddedRuntime: boolean
  onRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
  onRuntimeChange?: (snapshot: WorkspaceAcceleratorCardRuntimeSnapshot) => void
  onTutorialActionComplete?: (
    mode?: "complete" | "complete-and-advance"
  ) => void
  onRequestOpenStep: ({
    step,
    selectedLessonGroupKey,
  }: {
    step: WorkspaceAcceleratorCardStep
    selectedLessonGroupKey: string | null
  }) => boolean
}) {
  const lessonGroupOptions = runtimeSnapshot?.lessonGroupOptions ?? []
  const selectedLessonGroupKey =
    runtimeSnapshot?.selectedLessonGroupKey ?? lessonGroupOptions[0]?.key ?? ""
  const canRenderClassPicker =
    lessonGroupOptions.length > 0 &&
    selectedLessonGroupKey.length > 0 &&
    Boolean(runtimeActions?.selectLessonGroup)
  const stepCount = runtimeSnapshot?.filteredStepCount ?? input.steps.length
  const stepCountLabel = `${stepCount} ${stepCount === 1 ? "step" : "steps"}`
  const progressPercent = runtimeSnapshot?.filteredProgressPercent ?? 0
  const contentCanDrag = canEdit && !presentationMode && !isCanvasFullscreen

  return (
    <Card
      data-workspace-card="accelerator"
      className="border-border/60 bg-muted relative w-full max-w-[42rem] rounded-[2rem] p-3 shadow-sm"
    >
      <CardHeader
        className={cn(
          "relative flex flex-col gap-2 px-3 pt-1.5 pb-2",
          contentCanDrag &&
            "workspace-card-drag-handle cursor-grab touch-manipulation select-none active:cursor-grabbing"
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CardTitle className="text-foreground truncate text-lg font-semibold tracking-tight">
              Accelerator
            </CardTitle>
            {!canRenderClassPicker ? (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary h-6 rounded-full border-transparent px-2.5 py-0.5 text-[11px] leading-none"
              >
                {stepCountLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <div className="bg-background border-border/60 mx-3 rounded-[1.45rem] border p-3">
          <WorkspaceBoardLazyAcceleratorCardPanel
            input={input}
            presentationMode="embedded"
            onRuntimeChange={
              shouldTrackEmbeddedRuntime ? onRuntimeChange : undefined
            }
            onRuntimeActionsChange={
              shouldTrackEmbeddedRuntime ? onRuntimeActionsChange : undefined
            }
            tutorialCallout={tutorialCallout}
            tutorialInteractionPolicy={tutorialInteractionPolicy}
            tutorialMode={
              tutorialInteractionPolicy?.stepId === "accelerator-close-module"
                ? "module-preview"
                : null
            }
            showEmbeddedClassPicker
            onTutorialActionComplete={onTutorialActionComplete}
            onRequestOpenStep={onRequestOpenStep}
          />
        </div>
      </CardContent>

      <CardFooter className="items-end justify-between gap-3 px-4 py-4">
        <WorkspaceAcceleratorCardProgressSummary
          progressPercent={progressPercent}
          readinessSummary={runtimeSnapshot?.readinessSummary ?? null}
          tutorialCallout={
            tutorialCallout?.focus === "progress" ? tutorialCallout : null
          }
          showMilestoneTooltips={tutorialInteractionPolicy === null}
          className="nodrag nopan"
        />
      </CardFooter>
    </Card>
  )
}
