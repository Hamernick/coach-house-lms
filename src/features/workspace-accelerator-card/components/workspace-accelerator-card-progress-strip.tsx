"use client"

import { AcceleratorProgressRail } from "@/components/accelerator/accelerator-progress-rail"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"
import type {
  WorkspaceAcceleratorTutorialCallout,
} from "../types"
import type { AcceleratorReadinessSummary } from "@/lib/accelerator/readiness"
import { cn } from "@/lib/utils"

type WorkspaceAcceleratorCardProgressStripProps = {
  progressPercent: number
  readinessSummary?: AcceleratorReadinessSummary | null
  tutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
}

export function WorkspaceAcceleratorCardProgressStrip({
  progressPercent,
  readinessSummary = null,
  tutorialCallout = null,
}: WorkspaceAcceleratorCardProgressStripProps) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/70 px-3 py-2.5",
        tutorialCallout?.focus === "progress" &&
          "border-sky-300/70 bg-sky-50/72 dark:border-sky-400/45 dark:bg-sky-500/10",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Progress
        </p>
        <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground tabular-nums">
          {progressPercent}%
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <AcceleratorProgressRail
          progressPercent={progressPercent}
          fundableCheckpoint={ACCELERATOR_FUNDABLE_THRESHOLD}
          verifiedCheckpoint={ACCELERATOR_VERIFIED_THRESHOLD}
          fundableChecklist={readinessSummary?.fundableChecklist ?? []}
          verifiedChecklist={readinessSummary?.verifiedChecklist ?? []}
        />
      </div>
    </div>
  )

  if (tutorialCallout?.focus !== "progress") {
    return content
  }

  return (
    <Tooltip open>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <WorkspaceTutorialCallout
        title={tutorialCallout.title}
        instruction={tutorialCallout.instruction}
        side="top"
        align="start"
        sideOffset={10}
      />
    </Tooltip>
  )
}
