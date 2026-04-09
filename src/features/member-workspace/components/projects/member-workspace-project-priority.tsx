"use client"

import { WarningOctagon } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

export type MemberWorkspaceProjectPriorityLevel = "urgent" | "high" | "medium" | "low"

function BarsGlyph({
  level,
  className,
}: {
  level: Exclude<MemberWorkspaceProjectPriorityLevel, "urgent">
  className?: string
}) {
  const bars = [
    { x: 4, y1: 13.333, y2: 13.333, color: "currentColor" },
    { x: 8, y1: 6.667, y2: 13.333, color: level === "low" ? "rgb(228, 228, 231)" : "currentColor" },
    {
      x: 12,
      y1: level === "high" ? 2.667 : level === "medium" ? 6.667 : 6.667,
      y2: 13.333,
      color: level === "high" ? "currentColor" : "rgb(228, 228, 231)",
    },
  ]

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      {bars.map((bar, index) => (
        <path
          key={index}
          d={`M${bar.x} ${bar.y2}V${bar.y1}`}
          stroke={bar.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

export function MemberWorkspaceProjectPriorityGlyphIcon({
  level,
  size = "md",
  className,
}: {
  level: MemberWorkspaceProjectPriorityLevel
  size?: "sm" | "md"
  className?: string
}) {
  const baseIcon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  if (level === "urgent") {
    return <WarningOctagon className={cn(baseIcon, "text-muted-foreground", className)} weight="fill" />
  }
  return <BarsGlyph level={level} className={cn(baseIcon, "text-muted-foreground", className)} />
}

export function MemberWorkspaceProjectPriorityBadge({
  level,
  appearance = "badge",
  size = "md",
  className,
  withIcon = true,
}: {
  level: MemberWorkspaceProjectPriorityLevel
  appearance?: "badge" | "inline"
  size?: "sm" | "md"
  className?: string
  withIcon?: boolean
}) {
  const isUrgent = level === "urgent"
  const label = level === "urgent" ? "Urgent" : level.charAt(0).toUpperCase() + level.slice(1)
  const baseText = size === "md" ? "text-sm" : "text-xs"
  const baseIcon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"

  if (appearance === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-foreground", baseText, className)}>
        {withIcon
          ? isUrgent
            ? <WarningOctagon className={cn(baseIcon, "text-muted-foreground")} weight="fill" />
            : <BarsGlyph level={level} className={cn(baseIcon, "text-muted-foreground")} />
          : null}
        <span className="text-foreground/80">{label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-foreground/80",
        baseText,
        className,
      )}
    >
      {withIcon
        ? isUrgent
          ? <WarningOctagon className={cn(baseIcon, "text-muted-foreground")} weight="fill" />
          : <BarsGlyph level={level} className={cn(baseIcon, "text-muted-foreground")} />
        : null}
      <span>{label}</span>
    </span>
  )
}
