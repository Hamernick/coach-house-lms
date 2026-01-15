"use client"

import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type CircularProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  size?: number
  strokeWidth?: number
  shape?: "round" | "square"
  trackClassName?: string
  progressClassName?: string
}

export function CircularProgress({
  value,
  size = 28,
  strokeWidth = 3,
  shape = "round",
  className,
  trackClassName,
  progressClassName,
  ...props
}: CircularProgressProps) {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      className={cn("relative inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          fill="transparent"
          className={cn("stroke-muted-foreground/55 dark:stroke-muted/40", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="transparent"
          strokeLinecap={shape}
          className={cn("stroke-emerald-600 dark:stroke-emerald-400", progressClassName)}
        />
      </svg>
    </div>
  )
}
