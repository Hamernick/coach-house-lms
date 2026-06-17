import * as ProgressPrimitive from "@radix-ui/react-progress"

import { clampPercent } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  type AcceleratorReadinessChecklistItem,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"
import { cn } from "@/lib/utils"

type AcceleratorProgressRailProps = {
  progressPercent: number
  fundableCheckpoint?: number
  verifiedCheckpoint?: number
  fundableChecklist?: AcceleratorReadinessChecklistItem[]
  verifiedChecklist?: AcceleratorReadinessChecklistItem[]
  showMilestones?: boolean
  showMilestoneTooltips?: boolean
  className?: string
}

type AcceleratorProgressRailState = {
  progress: number
  fundable: number
  verified: number
  firstSegmentFill: number
  secondSegmentWidth: number
  fundableReached: boolean
  verifiedReached: boolean
  firstSegmentClass: string
  secondSegmentClass: string
  segments: AcceleratorProgressRailSegment[]
}

type AcceleratorProgressRailSegment = {
  id: "build" | "fundable" | "verified"
  label: string
  rangeLabel: string
  start: number
  end: number
  width: number
  fillPercent: number
  reached: boolean
  active: boolean
  trackClassName: string
  fillClassName: string
}

function resolveSegmentFillPercent({
  end,
  progress,
  start,
}: {
  end: number
  progress: number
  start: number
}) {
  const width = Math.max(1, end - start)
  return Math.max(
    0,
    Math.min(100, Math.round(((progress - start) / width) * 100))
  )
}

export function resolveAcceleratorProgressRailState({
  progressPercent,
  fundableCheckpoint = ACCELERATOR_FUNDABLE_THRESHOLD,
  verifiedCheckpoint = ACCELERATOR_VERIFIED_THRESHOLD,
}: Omit<
  AcceleratorProgressRailProps,
  "className"
>): AcceleratorProgressRailState {
  const progress = clampPercent(progressPercent)
  const fundable = clampPercent(fundableCheckpoint)
  const verified = Math.max(fundable + 1, clampPercent(verifiedCheckpoint))

  const firstSegmentFill = Math.min(progress, fundable)
  const secondSegmentFill = Math.max(
    0,
    Math.min(progress - fundable, verified - fundable)
  )
  const fundableReached = progress >= fundable
  const verifiedReached = progress >= verified
  const secondSegmentWidth = verifiedReached
    ? 100 - fundable
    : secondSegmentFill
  const segments = [
    {
      id: "build",
      label: "Build",
      rangeLabel: `0-${fundable}%`,
      start: 0,
      end: fundable,
      width: fundable,
      fillPercent: resolveSegmentFillPercent({
        end: fundable,
        progress,
        start: 0,
      }),
      reached: progress >= fundable,
      active: progress > 0 && progress < fundable,
      trackClassName: "bg-amber-500/20 dark:bg-amber-400/18",
      fillClassName: "bg-amber-500",
    },
    {
      id: "fundable",
      label: "Fundable",
      rangeLabel: `${fundable}-${verified}%`,
      start: fundable,
      end: verified,
      width: verified - fundable,
      fillPercent: resolveSegmentFillPercent({
        end: verified,
        progress,
        start: fundable,
      }),
      reached: progress >= verified,
      active: progress >= fundable && progress < verified,
      trackClassName: "bg-emerald-500/18 dark:bg-emerald-400/18",
      fillClassName: "bg-emerald-500",
    },
    {
      id: "verified",
      label: "Verified",
      rangeLabel: `${verified}-100%`,
      start: verified,
      end: 100,
      width: 100 - verified,
      fillPercent: resolveSegmentFillPercent({
        end: 100,
        progress,
        start: verified,
      }),
      reached: progress >= 100,
      active: progress >= verified && progress < 100,
      trackClassName: "bg-sky-500/18 dark:bg-sky-400/18",
      fillClassName: "bg-sky-500",
    },
  ] satisfies AcceleratorProgressRailSegment[]

  return {
    progress,
    fundable,
    verified,
    firstSegmentFill,
    secondSegmentWidth,
    fundableReached,
    verifiedReached,
    firstSegmentClass: "bg-amber-500",
    secondSegmentClass: "bg-emerald-500",
    segments,
  }
}

function formatSegmentStatusLabel(items: AcceleratorReadinessChecklistItem[]) {
  if (items.length === 0) return "Waiting on data"

  const completeCount = items.filter((item) => item.complete).length
  return `${completeCount}/${items.length} ready`
}

export function AcceleratorProgressRail({
  progressPercent,
  fundableCheckpoint = ACCELERATOR_FUNDABLE_THRESHOLD,
  verifiedCheckpoint = ACCELERATOR_VERIFIED_THRESHOLD,
  fundableChecklist = [],
  verifiedChecklist = [],
  showMilestones = true,
  showMilestoneTooltips = true,
  className,
}: AcceleratorProgressRailProps) {
  const state = resolveAcceleratorProgressRailState({
    progressPercent,
    fundableCheckpoint,
    verifiedCheckpoint,
  })
  const segmentStatusLabels = {
    build: `${state.progress}% complete`,
    fundable: formatSegmentStatusLabel(fundableChecklist),
    verified: formatSegmentStatusLabel(verifiedChecklist),
  } satisfies Record<AcceleratorProgressRailSegment["id"], string>

  return (
    <div className={cn("relative w-full", className)}>
      <ProgressPrimitive.Root
        data-slot="accelerator-segmented-progress"
        value={state.progress}
        max={100}
        aria-label={`Accelerator progress ${state.progress}%`}
        className="bg-border/40 flex h-3 w-full gap-0.5 overflow-hidden rounded-full p-0.5"
      >
        {state.segments.map((segment) => (
          <span
            key={segment.id}
            data-slot="accelerator-progress-segment"
            data-state={
              segment.reached ? "complete" : segment.active ? "active" : "idle"
            }
            aria-hidden
            className={cn(
              "relative h-full min-w-0 flex-none overflow-hidden rounded-full",
              segment.trackClassName
            )}
            style={{ width: `${segment.width}%` }}
          >
            <ProgressPrimitive.Indicator
              data-slot="accelerator-progress-segment-indicator"
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width]",
                segment.fillClassName
              )}
              style={{ width: `${segment.fillPercent}%` }}
            />
          </span>
        ))}
      </ProgressPrimitive.Root>

      {showMilestones && showMilestoneTooltips ? (
        <div className="absolute inset-0 flex gap-0.5 p-0.5">
          {state.segments.map((segment) => (
            <Tooltip
              key={segment.id}
              delayDuration={140}
              disableHoverableContent
            >
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${segment.label} segment, ${segment.rangeLabel}`}
                  className="focus-visible:ring-ring/70 data-[state=delayed-open]:ring-foreground/20 data-[state=instant-open]:ring-foreground/20 h-full min-w-0 flex-none rounded-full p-0 text-transparent shadow-none transition-[box-shadow] hover:bg-transparent hover:text-transparent focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=delayed-open]:ring-1 data-[state=instant-open]:ring-1"
                  style={{ width: `${segment.width}%` }}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="px-2.5 py-1.5"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", segment.fillClassName)}
                  />
                  <span className="font-medium">{segment.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {segment.rangeLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {segmentStatusLabels[segment.id]}
                  </span>
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : null}
    </div>
  )
}
