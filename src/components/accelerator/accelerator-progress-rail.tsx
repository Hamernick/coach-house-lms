import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"

import { clampPercent } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"
import { cn } from "@/lib/utils"

type AcceleratorProgressRailProps = {
  progressPercent: number
  fundableCheckpoint?: number
  verifiedCheckpoint?: number
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
}

export function resolveAcceleratorProgressRailState({
  progressPercent,
  fundableCheckpoint = ACCELERATOR_FUNDABLE_THRESHOLD,
  verifiedCheckpoint = ACCELERATOR_VERIFIED_THRESHOLD,
}: Omit<AcceleratorProgressRailProps, "className">): AcceleratorProgressRailState {
  const progress = clampPercent(progressPercent)
  const fundable = clampPercent(fundableCheckpoint)
  const verified = Math.max(fundable + 1, clampPercent(verifiedCheckpoint))

  const firstSegmentFill = Math.min(progress, fundable)
  const secondSegmentFill = Math.max(
    0,
    Math.min(progress - fundable, verified - fundable),
  )
  const fundableReached = progress >= fundable
  const verifiedReached = progress >= verified
  const secondSegmentWidth = verifiedReached
    ? 100 - fundable
    : secondSegmentFill

  return {
    progress,
    fundable,
    verified,
    firstSegmentFill,
    secondSegmentWidth,
    fundableReached,
    verifiedReached,
    firstSegmentClass: fundableReached ? "bg-emerald-500" : "bg-amber-500",
    secondSegmentClass: verifiedReached
      ? "bg-emerald-500"
      : "bg-zinc-400 dark:bg-zinc-500",
  }
}

export function AcceleratorProgressRail({
  progressPercent,
  fundableCheckpoint = ACCELERATOR_FUNDABLE_THRESHOLD,
  verifiedCheckpoint = ACCELERATOR_VERIFIED_THRESHOLD,
  className,
}: AcceleratorProgressRailProps) {
  const state = resolveAcceleratorProgressRailState({
    progressPercent,
    fundableCheckpoint,
    verifiedCheckpoint,
  })

  return (
    <div
      className={cn(
        "relative h-2 rounded-full bg-zinc-300/65 dark:bg-zinc-700/55",
        className,
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-full rounded-full",
          state.firstSegmentClass,
        )}
        style={{ width: `${state.firstSegmentFill}%` }}
      />
      <div
        className={cn(
          "absolute top-0 h-full rounded-full",
          state.secondSegmentClass,
        )}
        style={{
          left: `${state.fundable}%`,
          width: `${state.secondSegmentWidth}%`,
        }}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fundable checkpoint"
            className={cn(
              "absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2",
              state.fundableReached
                ? "border-emerald-500 bg-emerald-500 text-white hover:!border-emerald-500 hover:!bg-emerald-500 hover:!text-white"
                : "border-emerald-500 bg-background text-emerald-600 hover:!border-emerald-500 hover:!bg-background hover:!text-emerald-600 dark:text-emerald-300 dark:hover:!border-emerald-500 dark:hover:!bg-background dark:hover:!text-emerald-300",
            )}
            style={{ left: `${state.fundable}%` }}
          >
            <DollarSignIcon className="size-2.5" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="inline-flex items-center gap-1.5"
        >
          <DollarSignIcon className="size-3" aria-hidden />
          <span>Fundable</span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Verified checkpoint"
            className={cn(
              "absolute right-0 top-1/2 z-10 size-5 -translate-y-1/2 rounded-full border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2",
              state.verifiedReached
                ? "border-sky-500 bg-sky-500 text-white hover:!border-sky-500 hover:!bg-sky-500 hover:!text-white"
                : "border-sky-400/70 bg-background text-sky-600 hover:!border-sky-400/70 hover:!bg-background hover:!text-sky-600 dark:text-sky-300 dark:hover:!border-sky-400/70 dark:hover:!bg-background dark:hover:!text-sky-300",
            )}
          >
            <BadgeCheckIcon className="size-2.5" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="inline-flex items-center gap-1.5"
        >
          <BadgeCheckIcon className="size-2.5" aria-hidden />
          <span>Verified</span>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
