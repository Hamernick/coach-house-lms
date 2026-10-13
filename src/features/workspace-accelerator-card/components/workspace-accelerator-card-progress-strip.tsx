"use client"

import { AcceleratorProgressRail } from "@/components/accelerator/accelerator-progress-rail"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"

type WorkspaceAcceleratorCardProgressStripProps = {
  progressPercent: number
  completedCount: number
  totalCount: number
}

export function WorkspaceAcceleratorCardProgressStrip({
  progressPercent,
  completedCount,
  totalCount,
}: WorkspaceAcceleratorCardProgressStripProps) {
  const progressSummaryText =
    totalCount === 0
      ? "No steps assigned yet."
      : `${completedCount} of ${totalCount} ${
          totalCount === 1 ? "step" : "steps"
        } complete.`

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
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
        />
        <p className="text-[11px] text-muted-foreground">{progressSummaryText}</p>
      </div>
    </div>
  )
}
