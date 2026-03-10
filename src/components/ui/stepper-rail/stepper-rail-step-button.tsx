"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import Waypoints from "lucide-react/dist/esm/icons/waypoints"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { StepperRailStep } from "./types"

type StepperRailStepButtonProps = {
  step: StepperRailStep
  globalIndex: number
  safeActiveIndex: number
  isRoadmap: boolean
  onChange: (index: number) => void
  assignRef: (element: HTMLButtonElement | null) => void
}

export function StepperRailStepButton({
  step,
  globalIndex,
  safeActiveIndex,
  isRoadmap,
  onChange,
  assignRef,
}: StepperRailStepButtonProps) {
  const isActive = globalIndex === safeActiveIndex
  const showNumber = !step.roadmap && step.stepIndex != null
  const numberIcon = showNumber ? (
    <span className="text-[11px] font-semibold tabular-nums leading-none" aria-hidden>
      {step.stepIndex}
    </span>
  ) : null
  const styles =
    step.status === "complete"
      ? {
          border: "border-emerald-500",
          text: "text-emerald-500",
          icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : <CheckIcon className="h-4 w-4" aria-hidden />,
        }
      : step.status === "in_progress"
        ? {
            border: "border-amber-500",
            text: "text-amber-500",
            icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : numberIcon,
          }
        : {
            border: "border-muted-foreground/60",
            text: "text-muted-foreground",
            icon: step.roadmap ? <Waypoints className="h-4 w-4" aria-hidden /> : numberIcon,
          }
  const iconNode = isRoadmap
    ? step.icon ?? <Waypoints className="h-5 w-5" aria-hidden />
    : styles.icon
  const roadmapIconTextClass =
    step.status === "complete"
      ? "text-emerald-600 dark:text-emerald-300"
      : step.status === "in_progress"
        ? "text-amber-600 dark:text-amber-300"
        : "text-muted-foreground"
  const iconTextClass = isRoadmap ? roadmapIconTextClass : styles.text

  return (
    <Button
      type="button"
      variant="ghost"
      title={step.label}
      aria-label={`Go to ${step.label}`}
      aria-current={isActive ? "step" : undefined}
      onClick={() => onChange(globalIndex)}
      ref={assignRef}
      className={cn(
        "relative z-10 shrink-0 whitespace-normal p-0 transition focus-visible:ring-primary/40",
        isRoadmap
          ? "h-auto min-w-0 flex-1 flex-col items-start justify-start gap-2 text-left hover:bg-transparent"
          : cn(
              "h-8 w-8 rounded-full border-2 bg-background scroll-mx-10 hover:bg-background/90",
              styles.border,
              step.status === "not_started" && "hover:border-foreground/40",
            ),
      )}
    >
      {isRoadmap ? (
        <div
          data-stepper-roadmap-icon="true"
          className={cn(
            "flex h-[var(--dot-size)] w-[var(--dot-size)] items-center justify-center rounded-lg border bg-background shadow-sm",
            step.status === "complete"
              ? "border-emerald-500/35"
              : step.status === "in_progress"
                ? "border-amber-500/35"
                : "border-border/60",
          )}
        >
          {iconNode ? (
            <span className={cn("flex h-5 w-5 items-center justify-center", iconTextClass)}>
              {iconNode}
            </span>
          ) : null}
        </div>
      ) : iconNode ? (
        <span className={cn("flex h-5 w-5 items-center justify-center", iconTextClass)}>
          {iconNode}
        </span>
      ) : null}
      {isRoadmap ? (
        <span className="space-y-1 text-left">
          <span className="line-clamp-2 text-sm font-semibold text-foreground">{step.label}</span>
          {step.description ? (
            <span className="line-clamp-3 text-xs text-muted-foreground">{step.description}</span>
          ) : null}
        </span>
      ) : null}
    </Button>
  )
}
