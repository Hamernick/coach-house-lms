import { clampPercent } from "@/components/accelerator/accelerator-org-snapshot-strip/helpers"
import {
  ACCELERATOR_FUNDABLE_THRESHOLD,
  ACCELERATOR_VERIFIED_THRESHOLD,
} from "@/lib/accelerator/readiness"

export type AcceleratorProgressSegmentId = "build" | "fundable" | "verified"

export const ACCELERATOR_PROGRESS_SEGMENT_VISUALS = {
  build: {
    trackClassName: "bg-amber-500/20 dark:bg-amber-400/18",
    fillClassName: "bg-amber-500",
    iconClassName: "text-amber-600 dark:text-amber-400",
  },
  fundable: {
    trackClassName: "bg-emerald-500/25 dark:bg-emerald-400/25",
    fillClassName: "bg-emerald-500",
    iconClassName: "text-emerald-600 dark:text-emerald-400",
  },
  verified: {
    trackClassName: "bg-sky-500/25 dark:bg-sky-400/25",
    fillClassName: "bg-sky-500",
    iconClassName: "text-sky-600 dark:text-sky-400",
  },
} as const satisfies Record<
  AcceleratorProgressSegmentId,
  {
    trackClassName: string
    fillClassName: string
    iconClassName: string
  }
>

export function resolveAcceleratorProgressSegment(
  progressPercent: number
): AcceleratorProgressSegmentId {
  const progress = clampPercent(progressPercent)
  if (progress >= ACCELERATOR_VERIFIED_THRESHOLD) return "verified"
  if (progress >= ACCELERATOR_FUNDABLE_THRESHOLD) return "fundable"
  return "build"
}

export function resolveAcceleratorModuleProgressSegment({
  moduleSequenceIndex,
  moduleSequenceTotal,
}: {
  moduleSequenceIndex: number
  moduleSequenceTotal: number
}): AcceleratorProgressSegmentId {
  if (moduleSequenceTotal <= 0) return "build"

  const clampedIndex = Math.min(
    Math.max(moduleSequenceIndex, 1),
    moduleSequenceTotal
  )
  const moduleMidpointPercent =
    ((clampedIndex - 0.5) / moduleSequenceTotal) * 100
  return resolveAcceleratorProgressSegment(moduleMidpointPercent)
}
