"use client"

import { cn } from "@/lib/utils"

type SteppedProgressProps = {
  steps: number
  completed: number
  className?: string
  size?: "sm" | "md"
}

export function SteppedProgress({ steps, completed, className, size = "md" }: SteppedProgressProps) {
  const total = Math.max(0, steps)
  const done = Math.min(Math.max(0, completed), total)
  if (total === 0) {
    return <div className={cn("h-2 w-full rounded bg-muted", className)} />
  }
  const segments = Array.from({ length: total })
  const segmentClass = size === "sm" ? "h-1.5" : "h-2"
  const gapClass = size === "sm" ? "gap-1" : "gap-1.5"
  return (
    <div className={cn("flex w-full", className)}>
      <div className={cn("flex w-full", gapClass)}>
        {segments.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors",
              segmentClass,
              i < done ? "bg-primary" : "bg-muted"
            )}
            aria-hidden="true"
          />)
        )}
      </div>
    </div>
  )
}

