"use client"

import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import { Dithering } from "@paper-design/shaders-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { WorkspaceCanvasTutorialStepId } from "../types"
import { useWorkspaceCanvasTutorialController } from "../hooks/use-workspace-canvas-tutorial-controller"

type WorkspaceCanvasTutorialPanelProps = {
  stepIndex: number
  openedStepIds: WorkspaceCanvasTutorialStepId[]
  onPrevious: () => void
  onNext: () => void
  className?: string
  dragHandleClassName?: string
}

export function WorkspaceCanvasTutorialPanel({
  stepIndex,
  openedStepIds,
  onPrevious,
  onNext,
  className,
  dragHandleClassName,
}: WorkspaceCanvasTutorialPanelProps) {
  const { step, stepCount, continueMode, typedMessage } =
    useWorkspaceCanvasTutorialController(stepIndex, openedStepIds)
  const isFirstStep = stepIndex <= 0
  const isFinalStep = stepIndex >= stepCount - 1
  const continueWithShortcut = continueMode === "shortcut"
  const fundraisingTitleBadge =
    step.id === "fundraising" ? (
      <Badge
        variant="outline"
        className="rounded-full border-amber-300/70 bg-amber-100/70 px-2 py-0 text-[10px] font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        Coming soon
      </Badge>
    ) : null

  return (
    <Card
      className={cn(
        "border-border/70 bg-card/92 mx-auto w-full max-w-[560px] overflow-hidden rounded-[30px] border shadow-[0_30px_90px_-48px_rgba(15,23,42,0.5)] backdrop-blur-xl",
        dragHandleClassName,
        className,
      )}
    >
      <CardHeader className="border-border/70 bg-muted/20 space-y-3 border-b px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="border-border/70 bg-background/90 relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] border shadow-inner">
              <Dithering
                colorBack="#050816"
                colorFront="#13b5ff"
                shape="sphere"
                type="4x4"
                size={2}
                speed={1}
                scale={0.6}
                style={{ height: "100%", width: "100%" }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-white/10" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Workspace guide
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                Step {stepIndex + 1} of {stepCount}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {!isFirstStep ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="nodrag rounded-xl"
                onClick={onPrevious}
                aria-label="Previous tutorial step"
                title="Previous tutorial step"
              >
                <ChevronLeftIcon aria-hidden />
              </Button>
            ) : null}

            {!continueWithShortcut ? (
              <Button
                type="button"
                size="icon"
                className="nodrag rounded-xl"
                onClick={onNext}
                aria-label={isFinalStep ? "Enter workspace" : "Next tutorial step"}
                title={isFinalStep ? "Enter workspace" : "Next tutorial step"}
              >
                <ChevronRightIcon aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="bg-border/60 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${Math.round(((stepIndex + 1) / stepCount) * 100)}%`,
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {step.title}
            </h2>
            {fundraisingTitleBadge}
          </div>
          <p className="min-h-[5.25rem] text-[15px] leading-6 text-muted-foreground sm:min-h-[4.75rem]">
            {typedMessage}
            <span
              aria-hidden
              className={cn(
                "ml-0.5 inline-block h-5 w-px translate-y-1 bg-primary/80 align-baseline",
                typedMessage.length >= step.message.length && "opacity-0",
              )}
            />
          </p>
          {continueWithShortcut ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Click on the highlighted button on the card to continue.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
