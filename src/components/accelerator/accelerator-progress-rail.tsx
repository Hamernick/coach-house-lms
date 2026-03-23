import type { ReactNode } from "react"

import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign"

import { clampPercent } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
}

type AcceleratorMilestoneTone = {
  chipClassName: string
  statusClassName: string
  itemCompleteClassName: string
}

function resolveAcceleratorMilestoneTone(
  title: string,
): AcceleratorMilestoneTone {
  if (title.toLowerCase() === "fundable") {
    return {
      chipClassName: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
      statusClassName:
        "border-emerald-500/25 bg-emerald-500/10 text-foreground",
      itemCompleteClassName: "text-emerald-500",
    }
  }

  return {
    chipClassName: "border-sky-500/25 bg-sky-500/10 text-sky-500",
    statusClassName: "border-sky-500/25 bg-sky-500/10 text-foreground",
    itemCompleteClassName: "text-sky-500",
  }
}

function AcceleratorMilestoneTooltip({
  title,
  reached,
  icon,
  items,
}: {
  title: string
  reached: boolean
  icon: ReactNode
  items: AcceleratorReadinessChecklistItem[]
}) {
  const completeCount = items.filter((item) => item.complete).length
  const tone = resolveAcceleratorMilestoneTone(title)
  const statusLabel = reached ? "Reached" : "In progress"

  return (
    <div className="flex w-[19rem] flex-col gap-3 p-3.5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
            tone.chipClassName,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span>{title}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {completeCount} of {items.length} complete
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                reached ? tone.statusClassName : "bg-muted/50 text-muted-foreground",
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const StatusIcon = item.complete ? CheckCircle2Icon : CircleIcon

            return (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 px-3 py-2.5"
              >
                <StatusIcon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    item.complete
                      ? tone.itemCompleteClassName
                      : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "min-w-0 text-xs leading-5 break-words",
                    item.complete ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-3 py-2.5">
          <p className="text-xs leading-5 text-muted-foreground">
            No milestone requirements yet.
          </p>
        </div>
      )}
    </div>
  )
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
  fundableChecklist = [],
  verifiedChecklist = [],
  showMilestoneTooltips = true,
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

      {showMilestoneTooltips ? (
        <>
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
              className="max-w-none whitespace-normal rounded-xl border border-border/70 p-0 shadow-lg"
            >
              <AcceleratorMilestoneTooltip
                title="Fundable"
                reached={state.fundableReached}
                icon={<DollarSignIcon className="size-3.5" aria-hidden />}
                items={fundableChecklist}
              />
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
              className="max-w-none whitespace-normal rounded-xl border border-border/70 p-0 shadow-lg"
            >
              <AcceleratorMilestoneTooltip
                title="Verified"
                reached={state.verifiedReached}
                icon={<BadgeCheckIcon className="size-3.5" aria-hidden />}
                items={verifiedChecklist}
              />
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 z-10 inline-flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border",
              state.fundableReached
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-emerald-500 bg-background text-emerald-600 dark:text-emerald-300",
            )}
            style={{ left: `${state.fundable}%` }}
          >
            <DollarSignIcon className="size-2.5" />
          </span>
          <span
            aria-hidden
            className={cn(
              "absolute right-0 top-1/2 z-10 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full border",
              state.verifiedReached
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-sky-400/70 bg-background text-sky-600 dark:text-sky-300",
            )}
          >
            <BadgeCheckIcon className="size-2.5" />
          </span>
        </>
      )}
    </div>
  )
}
