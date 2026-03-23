"use client"

import { AcceleratorProgressRail } from "@/components/accelerator/accelerator-progress-rail"
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
  showMilestoneTooltips?: boolean
}

export function WorkspaceAcceleratorCardProgressStrip({
  progressPercent,
  readinessSummary = null,
  tutorialCallout = null,
  showMilestoneTooltips = true,
}: WorkspaceAcceleratorCardProgressStripProps) {
  const content = (
    <div className="rounded-lg border border-transparent bg-transparent px-3 py-3">
      <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Progress
        </p>
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground tabular-nums",
            tutorialCallout?.focus === "progress" &&
              "border-sky-300/70 bg-sky-50/80 dark:border-sky-400/45 dark:bg-sky-500/10",
          )}
        >
          {progressPercent}%
        </span>
      </div>
      <div className="space-y-2">
        <AcceleratorProgressRail
          progressPercent={progressPercent}
          fundableCheckpoint={ACCELERATOR_FUNDABLE_THRESHOLD}
          verifiedCheckpoint={ACCELERATOR_VERIFIED_THRESHOLD}
          fundableChecklist={readinessSummary?.fundableChecklist ?? []}
          verifiedChecklist={readinessSummary?.verifiedChecklist ?? []}
          showMilestoneTooltips={showMilestoneTooltips}
        />
      </div>
      </div>
    </div>
  )

  if (tutorialCallout?.focus !== "progress") {
    return content
  }

  return (
    <div className="relative pt-5">
      <WorkspaceTutorialCallout
        reactGrabOwnerId="workspace-accelerator-progress-strip:callout"
        mode="indicator"
        indicatorAnchorAlign="start"
        indicatorOffsetX={24}
      />
      {content}
    </div>
  )
}
